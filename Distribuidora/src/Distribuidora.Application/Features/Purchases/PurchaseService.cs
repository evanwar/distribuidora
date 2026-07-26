using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Features.Administration;
using Distribuidora.Application.Features.Audits;
using Distribuidora.Application.Features.Inventory;
using Distribuidora.Application.Specifications;
using Distribuidora.Contracts.Requests;
using Distribuidora.Domain.Common;
using Distribuidora.Domain.Inventory;
using Distribuidora.Domain.Purchases;
using Distribuidora.Domain.Catalogs;

namespace Distribuidora.Application.Features.Purchases;

public sealed class PurchaseService(
    IAppDbContext db,
    InventoryPostingService inventory,
    FolioNumberService folios,
    AuditEntryService audit,
    IDatatimeProvider datetimeProvider)
{
    public IReadOnlyCollection<PurchaseOrder> GetPurchases() =>
        db.Query(Specification.All<PurchaseOrder>()).OrderByDescending(x => x.Date).ToArray();

    public PurchaseOrder GetPurchase(Guid id) =>
        db.Query(Specification.Create<PurchaseOrder>(x => x.Id == id)).SingleOrDefault()
        ?? throw new NotFoundException("Purchase not found.");

    public async Task<PurchaseOrder> CreatePurchaseAsync(CreatePurchaseRequest request, Guid actorId, CancellationToken cancellationToken)
    {
        EnsureActiveSupplier(request.SupplierId);
        ValidateItems(request.Items);
        var purchase = new PurchaseOrder
        {
            Folio = await folios.NextAsync("purchase", "PO-", cancellationToken),
            SupplierId = request.SupplierId,
            Date = datetimeProvider.UtcNow,
            Tax = request.Tax,
            Notes = request.Notes,
            CreatedBy = actorId
        };
        foreach (var item in request.Items)
            purchase.Items.Add(new PurchaseOrderItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitCost = item.UnitCost,
                Discount = item.Discount
            });
        purchase.Recalculate();
        db.Add(purchase);
        await db.SaveChangesAsync(cancellationToken);
        return purchase;
    }

    public async Task<PurchaseOrder> UpdatePurchaseAsync(Guid id, CreatePurchaseRequest request, Guid actorId, CancellationToken cancellationToken)
    {
        var purchase = GetPurchase(id);
        if (purchase.Status != DocumentStatus.Draft)
            throw new ConflictException("Only draft purchases can be edited.");
        ValidateItems(request.Items);
        purchase.SupplierId = request.SupplierId;
        purchase.Tax = request.Tax;
        purchase.Notes = request.Notes;
        purchase.Items.Clear();
        foreach (var item in request.Items)
            purchase.Items.Add(new PurchaseOrderItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitCost = item.UnitCost,
                Discount = item.Discount
            });
        purchase.Recalculate();
        purchase.UpdatedAt = datetimeProvider.UtcNow;
        purchase.UpdatedBy = actorId;
        await db.SaveChangesAsync(cancellationToken);
        return purchase;
    }

    public async Task ConfirmPurchaseAsync(Guid id, Guid actorId, string correlationId, CancellationToken cancellationToken)
    {
        var purchase = GetPurchase(id);
        purchase.Confirm(datetimeProvider.UtcNow);
        audit.Add("Confirm", "purchases", nameof(PurchaseOrder), id, actorId, correlationId);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task CancelPurchaseAsync(Guid id, string reason, Guid actorId, string correlationId, CancellationToken cancellationToken)
    {
        var purchase = GetPurchase(id);
        purchase.Cancel(reason);
        audit.Add("Cancel", "purchases", nameof(PurchaseOrder), id, actorId, correlationId);
        await db.SaveChangesAsync(cancellationToken);
    }

    public GoodsReceipt GetReceipt(Guid id) =>
        db.Query(Specification.Create<GoodsReceipt>(x => x.Id == id)).SingleOrDefault()
        ?? throw new NotFoundException("Receipt not found.");

    public IReadOnlyCollection<GoodsReceipt> GetReceipts() =>
        db.Query(Specification.All<GoodsReceipt>()).OrderByDescending(x => x.ReceivedAt).ToArray();

    public async Task<GoodsReceipt> CreateReceiptAsync(CreateReceiptRequest request, Guid actorId, CancellationToken cancellationToken)
    {
        EnsureActiveSupplier(request.SupplierId);
        if (!db.Query(Specification.Create<Warehouse>(x => x.Id == request.DestinationWarehouseId && x.Active)).Any())
            throw new ArgumentException("Warehouse is inactive or does not exist.");
        if (request.Items.Count == 0 || request.Items.Any(x => x.Quantity <= 0 || x.UnitCost < 0))
            throw new ArgumentException("Receipt requires valid items.");
        if (request.Items.Select(x => x.ProductId).Distinct().Count() != request.Items.Count)
            throw new ArgumentException("A product cannot be repeated in the same receipt.");
        if (request.Items.Any(item => !db.Query(Specification.Create<Product>(
                product => product.Id == item.ProductId && product.Active)).Any()))
            throw new ArgumentException("Receipt contains an inactive or missing product.");
        var receipt = new GoodsReceipt
        {
            Folio = await folios.NextAsync("goods_receipt", "GR-", cancellationToken),
            SupplierId = request.SupplierId,
            PurchaseOrderId = request.PurchaseOrderId,
            DestinationWarehouseId = request.DestinationWarehouseId,
            ReceivedAt = datetimeProvider.UtcNow,
            Notes = request.Notes,
            ReceivedBy = actorId,
            CreatedBy = actorId
        };
        foreach (var item in request.Items)
            receipt.Items.Add(new GoodsReceiptItem
            {
                ProductId = item.ProductId,
                ReceivedQuantity = item.Quantity,
                UnitCost = item.UnitCost
            });
        db.Add(receipt);
        await db.SaveChangesAsync(cancellationToken);
        return receipt;
    }

    public Task<GoodsReceipt> CloseReceiptAsync(Guid id, Guid actorId, string correlationId, CancellationToken cancellationToken) =>
        db.ExecuteAtomicAsync(async token =>
        {
            var receipt = GetReceipt(id);
            receipt.Close(datetimeProvider.UtcNow);
            foreach (var item in receipt.Items)
                inventory.Post(item.ProductId, receipt.DestinationWarehouseId, item.ReceivedQuantity,
                    item.UnitCost, MovementType.PurchaseReceipt, nameof(GoodsReceipt), receipt.Id, actorId);
            audit.Add("Close", "purchases", nameof(GoodsReceipt), id, actorId, correlationId);
            await db.SaveChangesAsync(token);
            return receipt;
        }, cancellationToken);

    public async Task CancelReceiptAsync(Guid id, string reason, Guid actorId, string correlationId, CancellationToken cancellationToken)
    {
        var receipt = GetReceipt(id);
        if (receipt.Status == DocumentStatus.Closed)
            throw new ConflictException("A closed receipt requires a controlled reversing document.");
        receipt.Cancel(reason);
        audit.Add("Cancel", "purchases", nameof(GoodsReceipt), id, actorId, correlationId);
        await db.SaveChangesAsync(cancellationToken);
    }

    private void EnsureActiveSupplier(Guid supplierId)
    {
        if (!db.Query(Specification.Create<Supplier>(x => x.Id == supplierId && x.Active)).Any())
            throw new ArgumentException("Supplier is inactive or does not exist.");
    }

    private static void ValidateItems(IReadOnlyCollection<PurchaseItemRequest> items)
    {
        if (items.Count == 0 || items.Any(x => x.Quantity <= 0 || x.UnitCost < 0))
            throw new ArgumentException("Purchase requires valid items.");
    }
}
