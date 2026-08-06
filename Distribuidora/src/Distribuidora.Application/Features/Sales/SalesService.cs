using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Features.Administration;
using Distribuidora.Application.Features.Audits;
using Distribuidora.Application.Features.Inventory;
using Distribuidora.Application.Specifications;
using Distribuidora.Contracts.Requests;
using Distribuidora.Domain.AccountsReceivable;
using Distribuidora.Domain.Catalogs;
using Distribuidora.Domain.Common;
using Distribuidora.Domain.Inventory;
using Distribuidora.Domain.Sales;
using PaymentCondition = Distribuidora.Domain.Common.PaymentCondition;

namespace Distribuidora.Application.Features.Sales;

public sealed class SalesService(
    IAppDbContext db,
    InventoryPostingService inventory,
    FolioNumberService folios,
    AuditEntryService audit,
    IDatatimeProvider datetimeProvider)
{
    public IReadOnlyCollection<CounterSale> GetAll() =>
        db.Query(Specification.All<CounterSale>()).OrderByDescending(x => x.SaleDate).ToArray();

    public CounterSale GetById(Guid id) =>
        db.Query(Specification.Create<CounterSale>(x => x.Id == id)).SingleOrDefault()
        ?? throw new NotFoundException("Sale not found.");

    public async Task<CounterSale> CreateAsync(CreateSaleRequest request, Guid actorId, CancellationToken cancellationToken)
    {
        ValidateRequest(request);
        var sale = new CounterSale
        {
            Folio = await folios.NextAsync("counter_sale", "CS-", cancellationToken),
            CustomerId = request.CustomerId,
            SourceWarehouseId = request.SourceWarehouseId,
            PaymentCondition = (PaymentCondition)request.PaymentCondition,
            SaleDate = datetimeProvider.UtcNow,
            TaxTotal = request.TaxTotal,
            Notes = request.Notes,
            CreatedBy = actorId
        };
        AddLines(sale, request, actorId);
        sale.ValidateCommercialIntegrity();
        db.Add(sale);
        await db.SaveChangesAsync(cancellationToken);
        return sale;
    }

    public async Task<CounterSale> UpdateAsync(Guid id, CreateSaleRequest request, Guid actorId, CancellationToken cancellationToken)
    {
        var sale = GetById(id);
        if (sale.Status != DocumentStatus.Draft)
            throw new ConflictException("Only draft sales can be edited.");
        ValidateRequest(request);
        sale.CustomerId = request.CustomerId;
        sale.SourceWarehouseId = request.SourceWarehouseId;
        sale.PaymentCondition = (PaymentCondition)request.PaymentCondition;
        sale.TaxTotal = request.TaxTotal;
        sale.Notes = request.Notes;
        sale.Items.Clear();
        sale.Payments.Clear();
        AddLines(sale, request, actorId);
        sale.ValidateCommercialIntegrity();
        sale.UpdatedAt = datetimeProvider.UtcNow;
        sale.UpdatedBy = actorId;
        await db.SaveChangesAsync(cancellationToken);
        return sale;
    }

    public Task<CounterSale> ConfirmAsync(Guid id, Guid actorId, string correlationId, CancellationToken cancellationToken) =>
        db.ExecuteAtomicAsync(async token =>
        {
            var sale = GetById(id);
            EnsureStockAvailable(sale);
            sale.Confirm(datetimeProvider.UtcNow);
            if (!sale.CustomerId.HasValue &&
                !db.Query(Specification.Create<SaleFiscalStatus>(x => x.SaleId == sale.Id)).Any())
                db.Add(new SaleFiscalStatus
                {
                    SaleId = sale.Id,
                    CreatedBy = actorId
                });
            if (sale.PaymentCondition != PaymentCondition.Cash)
            {
                var customer = db.Query(Specification.Create<Customer>(x => x.Id == sale.CustomerId)).Single();
                var debt = db.Query(Specification.Create<AccountReceivable>(x =>
                    x.CustomerId == customer.Id &&
                    x.Status != ReceivableStatus.Paid &&
                    x.Status != ReceivableStatus.Cancelled)).Sum(x => x.Balance);
                if (customer.CreditBlocked || debt + sale.Balance > customer.CreditLimit)
                    throw new DomainRuleException("Customer credit is blocked or limit would be exceeded.");
            }
            foreach (var item in sale.Items)
                inventory.Post(item.ProductId, sale.SourceWarehouseId, -item.Quantity,
                    item.HistoricalUnitCost, MovementType.CounterSale, nameof(CounterSale), sale.Id, actorId);
            if (sale.Balance > 0)
            {
                var policy = db.Query(Specification.Create<Domain.Administration.CreditPolicy>(x => x.Active)).FirstOrDefault();
                var receivable = new AccountReceivable
                {
                    CustomerId = sale.CustomerId!.Value,
                    SaleId = sale.Id,
                    IssueDate = sale.SaleDate,
                    DueDate = sale.SaleDate.AddDays(policy?.DefaultDueDays ?? 30),
                    Total = sale.Balance,
                    CreatedBy = actorId
                };
                receivable.InitializeBalance();
                db.Add(receivable);
            }
            audit.Add("Confirm", "sales", nameof(CounterSale), id, actorId, correlationId);
            await db.SaveChangesAsync(token);
            return sale;
        }, cancellationToken);

    public async Task RegisterPaymentAsync(Guid id, SalePaymentRequest request, Guid actorId, string correlationId, CancellationToken cancellationToken)
    {
        var sale = GetById(id);
        var method = db.Query(Specification.Create<Domain.Administration.PaymentMethod>(
            x => x.Code == request.Method && x.Active)).SingleOrDefault();
        if (method is null) throw new ArgumentException("Payment method is inactive or does not exist.");
        if (method.RequiresReference && string.IsNullOrWhiteSpace(request.Reference))
            throw new ArgumentException("Payment reference is required.");
        sale.RegisterPayment(new SalePayment
        {
            PaymentDate = datetimeProvider.UtcNow,
            Method = request.Method,
            Amount = request.Amount,
            Reference = request.Reference,
            ReceivedBy = actorId
        }, datetimeProvider.UtcNow);
        audit.Add("RegisterPayment", "sales", nameof(CounterSale), id, actorId, correlationId);
        await db.SaveChangesAsync(cancellationToken);
    }

    public Task CancelAsync(Guid id, string reason, Guid actorId, string correlationId, CancellationToken cancellationToken) =>
        db.ExecuteAtomicAsync(async token =>
        {
            var sale = GetById(id);
            if (sale.Payments.Count != 0)
                throw new ConflictException("A paid sale cannot be cancelled until every payment is refunded or reversed.");
            sale.Cancel(reason, actorId, datetimeProvider.UtcNow);
            foreach (var item in sale.Items)
                inventory.Post(item.ProductId, sale.SourceWarehouseId, item.Quantity, item.HistoricalUnitCost,
                    MovementType.SaleCancellation, nameof(CounterSale), sale.Id, actorId, false, reason);
            var receivable = db.Query(Specification.Create<AccountReceivable>(x => x.SaleId == sale.Id)).SingleOrDefault();
            if (receivable is not null && receivable.Balance != receivable.Total)
                throw new ConflictException("Sale with allocated receivable payments cannot be cancelled until payments are reversed.");
            if (receivable is not null) db.Remove(receivable);
            sale.Cancellation!.InventoryReverted = true;
            sale.Cancellation.PaymentsReverted = sale.Payments.Count == 0;
            audit.Add("Cancel", "sales", nameof(CounterSale), id, actorId, correlationId);
            await db.SaveChangesAsync(token);
            return true;
        }, cancellationToken);

    private void ValidateRequest(CreateSaleRequest request)
    {
        if (!db.Query(Specification.Create<Warehouse>(x => x.Id == request.SourceWarehouseId && x.Active)).Any())
            throw new ArgumentException("Warehouse is inactive or does not exist.");
        if (request.PaymentCondition != Contracts.Requests.PaymentCondition.Cash &&
            (!request.CustomerId.HasValue ||
             !db.Query(Specification.Create<Customer>(x => x.Id == request.CustomerId && x.Active)).Any()))
            throw new ArgumentException("An active customer is required.");
        if (request.TaxTotal < 0 || request.Items.Count == 0 || request.Items.Any(x =>
                x.Quantity <= 0 || x.UnitPrice < 0 || x.Discount < 0 || x.Discount > x.Quantity * x.UnitPrice))
            throw new ArgumentException("Sale requires valid items.");
        if (request.Items.Select(x => x.ProductId).Distinct().Count() != request.Items.Count)
            throw new ArgumentException("A product cannot be repeated in the same sale.");
    }

    private void EnsureStockAvailable(CounterSale sale)
    {
        foreach (var line in sale.Items.GroupBy(x => x.ProductId))
        {
            var requested = line.Sum(x => x.Quantity);
            var balance = db.Query(Specification.Create<StockBalance>(
                x => x.WarehouseId == sale.SourceWarehouseId && x.ProductId == line.Key))
                .SingleOrDefault();
            var available = Math.Max(0, (balance?.Quantity ?? 0) - (balance?.ReservedQuantity ?? 0));
            if (requested <= available) continue;

            var productName = db.Query(Specification.Create<Product>(x => x.Id == line.Key))
                .Select(x => x.Name)
                .SingleOrDefault() ?? "Producto";
            throw new DomainRuleException(
                $"Stock insuficiente para {productName}. Disponible: {available:0.####}; solicitado: {requested:0.####}.");
        }
    }

    private void AddLines(CounterSale sale, CreateSaleRequest request, Guid actorId)
    {
        foreach (var item in request.Items)
        {
            var product = db.Query(Specification.Create<Product>(
                x => x.Id == item.ProductId && x.Active)).SingleOrDefault()
                ?? throw new ArgumentException("Product is inactive or does not exist.");
            if (item.UnitPrice != product.BasePrice)
                throw new DomainRuleException("The sale price must match the current product base price. Authorized price overrides require a dedicated workflow.");
            sale.Items.Add(new CounterSaleItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Discount = item.Discount,
                HistoricalUnitCost = product.Cost
            });
        }
        if (request.Payments is null) return;
        foreach (var payment in request.Payments)
        {
            var method = db.Query(Specification.Create<Domain.Administration.PaymentMethod>(
                x => x.Code == payment.Method && x.Active)).SingleOrDefault()
                ?? throw new ArgumentException("Payment method is inactive or does not exist.");
            if (payment.Amount <= 0) throw new ArgumentException("Payment amount must be positive.");
            if (method.RequiresReference && string.IsNullOrWhiteSpace(payment.Reference))
                throw new ArgumentException("Payment reference is required.");
            sale.Payments.Add(new SalePayment
            {
                PaymentDate = datetimeProvider.UtcNow,
                Method = payment.Method,
                Amount = payment.Amount,
                Reference = payment.Reference,
                ReceivedBy = actorId
            });
        }
    }
}
