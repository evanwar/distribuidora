using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Features.Audits;
using Distribuidora.Application.Features.Inventory;
using Distribuidora.Application.Specifications;
using Distribuidora.Domain.Common;
using Distribuidora.Domain.Inventory;
using Distribuidora.Infrastructure.Security;

namespace Distribuidora.UnitTests;

public sealed class SecurityAndInventoryRegressionTests
{
    private static readonly DateTimeOffset OccurredAt =
        new(2026, 8, 9, 12, 0, 0, TimeSpan.Zero);

    [Theory]
    [InlineData("")]
    [InlineData("not-a-password-hash")]
    [InlineData("PBKDF2-SHA256$120000$invalid-base64$invalid-base64")]
    [InlineData("PBKDF2-SHA256$999999999$AA==$AA==")]
    public void Password_verification_rejects_malformed_hashes(string encodedHash)
    {
        var passwords = new PasswordService();

        var verified = passwords.Verify(encodedHash, "irrelevant-password");

        Assert.False(verified);
    }

    [Fact]
    public async Task Cancelling_confirmed_adjustment_reverses_stock_with_a_kardex_movement()
    {
        var actorId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var warehouseId = Guid.NewGuid();
        var adjustment = new InventoryAdjustment
        {
            WarehouseId = warehouseId,
            Reason = "Cycle count",
            AuthorizedBy = actorId
        };
        adjustment.Items.Add(new InventoryAdjustmentItem
        {
            ProductId = productId,
            PhysicalQuantity = 15,
            SystemQuantity = 10,
            UnitCost = 25
        });
        adjustment.Confirm(OccurredAt.AddMinutes(-1));

        var balance = new StockBalance
        {
            ProductId = productId,
            WarehouseId = warehouseId
        };
        balance.Apply(15, false, OccurredAt.AddMinutes(-1));

        var originalMovement = new InventoryMovement
        {
            ProductId = productId,
            DestinationWarehouseId = warehouseId,
            Quantity = 5,
            UnitCost = 25,
            MovementType = MovementType.Adjustment,
            ReferenceType = nameof(InventoryAdjustment),
            ReferenceId = adjustment.Id
        };

        var db = new InMemoryAppDbContext(adjustment, balance, originalMovement);
        var clock = new FixedDatetimeProvider(OccurredAt);
        var trace = new TestTraceContext
        {
            CorrelationId = "correlation-id",
            OperationId = "operation-id",
            TransactionId = "transaction-id"
        };
        var posting = new InventoryPostingService(db, trace, clock);
        var audit = new AuditEntryService(db, clock);
        var service = new InventoryService(db, posting, null!, audit, clock);

        await service.CancelAdjustmentAsync(
            adjustment.Id,
            "Count was entered incorrectly",
            actorId,
            trace.CorrelationId,
            CancellationToken.None);

        var reversal = Assert.Single(
            db.Entities.OfType<InventoryMovement>(),
            movement => movement.MovementType == MovementType.AdjustmentCancellation);
        Assert.Equal(10, balance.Quantity);
        Assert.Equal(DocumentStatus.Cancelled, adjustment.Status);
        Assert.Equal(5, reversal.Quantity);
        Assert.Equal(warehouseId, reversal.SourceWarehouseId);
        Assert.Equal(adjustment.Id, reversal.ReferenceId);
    }

    private sealed class InMemoryAppDbContext(params object[] entities) : IAppDbContext
    {
        public List<object> Entities { get; } = [.. entities];

        public IQueryable<TEntity> Query<TEntity>(Specification<TEntity> specification)
            where TEntity : class =>
            Entities.OfType<TEntity>()
                .AsQueryable()
                .Where(specification.ToExpression());

        public void Add<T>(T entity)
            where T : class =>
            Entities.Add(entity);

        public void Remove<T>(T entity)
            where T : class =>
            Entities.Remove(entity);

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult(1);

        public Task<T> ExecuteAtomicAsync<T>(
            Func<CancellationToken, Task<T>> action,
            CancellationToken cancellationToken = default) =>
            action(cancellationToken);
    }

    private sealed class FixedDatetimeProvider(DateTimeOffset utcNow) : IDatatimeProvider
    {
        public DateTimeOffset UtcNow { get; } = utcNow;
    }

    private sealed class TestTraceContext : IRequestTraceContext
    {
        public string CorrelationId { get; set; } = "";
        public string OperationId { get; set; } = "";
        public string TraceId { get; set; } = "";
        public string RequestId { get; set; } = "";
        public string? TransactionId { get; set; }
        public string? CausationId { get; set; }
    }
}
