using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Features.Audits;
using Distribuidora.Application.Specifications;
using Distribuidora.Contracts.Requests;
using Distribuidora.Domain.AccountsReceivable;
using Distribuidora.Domain.Catalogs;
using Distribuidora.Domain.Common;

namespace Distribuidora.Application.Features.Receivables;

public sealed class ReceivablesService(
    IAppDbContext db,
    AuditEntryService audit,
    IDatatimeProvider datetimeProvider)
{
    public IReadOnlyCollection<AccountReceivable> GetReceivables(Guid? customerId) =>
        db.Query(Specification.Create<AccountReceivable>(
                x => !customerId.HasValue || x.CustomerId == customerId))
            .OrderBy(x => x.DueDate).ToArray();

    public AccountReceivable GetReceivable(Guid id) =>
        db.Query(Specification.Create<AccountReceivable>(x => x.Id == id)).SingleOrDefault()
        ?? throw new NotFoundException("Receivable not found.");

    public async Task<CustomerPayment> RegisterPaymentAsync(
        CustomerPaymentRequest request, Guid actorId, string correlationId, CancellationToken cancellationToken)
    {
        if (request.Amount <= 0)
            throw new ArgumentException("Payment must be positive.");
        if (!db.Query(Specification.Create<Customer>(
                x => x.Id == request.CustomerId && x.Active)).Any())
            throw new ArgumentException("Customer is inactive or does not exist.");
        var payment = new CustomerPayment
        {
            CustomerId = request.CustomerId,
            PaymentDate = datetimeProvider.UtcNow,
            Method = request.Method,
            Amount = request.Amount,
            Reference = request.Reference,
            ReceivedBy = actorId,
            CreatedBy = actorId
        };
        db.Add(payment);
        audit.Add("RegisterPayment", "receivables", nameof(CustomerPayment), payment.Id, actorId, correlationId);
        await db.SaveChangesAsync(cancellationToken);
        return payment;
    }

    public Task ApplyPaymentAsync(
        Guid id, ApplyPaymentRequest request, Guid actorId, string correlationId, CancellationToken cancellationToken) =>
        db.ExecuteAtomicAsync(async token =>
        {
            var payment = GetPayment(id);
            if (request.Allocations.Count == 0)
                throw new DomainRuleException("At least one allocation is required.");
            payment.EnsureCanAllocate(request.Allocations.Sum(x => x.Amount));
            foreach (var requested in request.Allocations)
            {
                var receivable = db.Query(Specification.Create<AccountReceivable>(x =>
                    x.Id == requested.AccountReceivableId && x.CustomerId == payment.CustomerId))
                    .SingleOrDefault() ?? throw new NotFoundException("Receivable not found for customer.");
                receivable.Apply(requested.Amount, datetimeProvider.UtcNow);
                payment.Allocations.Add(new PaymentAllocation
                {
                    CustomerPaymentId = payment.Id,
                    AccountReceivableId = receivable.Id,
                    AmountApplied = requested.Amount
                });
            }
            audit.Add("ApplyPayment", "receivables", nameof(CustomerPayment), id, actorId, correlationId);
            await db.SaveChangesAsync(token);
            return true;
        }, cancellationToken);

    public Task CancelPaymentAsync(
        Guid id, string reason, Guid actorId, string correlationId, CancellationToken cancellationToken) =>
        db.ExecuteAtomicAsync(async token =>
        {
            var payment = GetPayment(id);
            payment.Cancel(reason);
            foreach (var allocation in payment.Allocations.Where(x => !x.Reversed))
            {
                var receivable = db.Query(Specification.Create<AccountReceivable>(
                    x => x.Id == allocation.AccountReceivableId)).Single();
                receivable.Reverse(allocation.AmountApplied);
                allocation.Reversed = true;
            }
            audit.Add("CancelPayment", "receivables", nameof(CustomerPayment), id, actorId, correlationId);
            await db.SaveChangesAsync(token);
            return true;
        }, cancellationToken);

    public async Task ChangeCreditLimitAsync(
        Guid customerId, ChangeCreditLimitRequest request, Guid actorId,
        string correlationId, CancellationToken cancellationToken)
    {
        if (request.NewLimit < 0 || string.IsNullOrWhiteSpace(request.Reason))
            throw new ArgumentException("A non-negative limit and reason are required.");
        var customer = db.Query(Specification.Create<Customer>(x => x.Id == customerId)).SingleOrDefault()
                       ?? throw new NotFoundException("Customer not found.");
        db.Add(new CreditLimitHistory
        {
            CustomerId = customer.Id,
            PreviousLimit = customer.CreditLimit,
            NewLimit = request.NewLimit,
            AuthorizedBy = actorId,
            Reason = request.Reason,
            CreatedAt = datetimeProvider.UtcNow
        });
        customer.CreditLimit = request.NewLimit;
        audit.Add("ChangeCreditLimit", "receivables", nameof(Customer), customerId, actorId, correlationId);
        await db.SaveChangesAsync(cancellationToken);
    }

    public CustomerStatementData GetCustomerStatement(Guid customerId) => new(
        customerId,
        db.Query(Specification.Create<AccountReceivable>(x => x.CustomerId == customerId))
            .OrderBy(x => x.IssueDate).ToArray(),
        db.Query(Specification.Create<CustomerPayment>(x => x.CustomerId == customerId))
            .OrderBy(x => x.PaymentDate).ToArray(),
        db.Query(Specification.Create<AccountReceivable>(
            x => x.CustomerId == customerId && x.Status != ReceivableStatus.Cancelled)).Sum(x => x.Balance));

    private CustomerPayment GetPayment(Guid id) =>
        db.Query(Specification.Create<CustomerPayment>(x => x.Id == id)).SingleOrDefault()
        ?? throw new NotFoundException("Payment not found.");
}

public sealed record CustomerStatementData(
    Guid CustomerId,
    IReadOnlyCollection<AccountReceivable> Receivables,
    IReadOnlyCollection<CustomerPayment> Payments,
    decimal Balance);
