using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Features.Administration;
using Distribuidora.Application.Features.Audits;
using Distribuidora.Application.Specifications;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Distribuidora.Domain.Inventory;
using Domain = Distribuidora.Domain;

namespace Distribuidora.Application.Features.Inventory;

public sealed class InventoryService(
    IAppDbContext db,
    InventoryPostingService posting,
    FolioNumberService folios,
    AuditEntryService audit,
    IDatatimeProvider datetimeProvider)
{
    public IReadOnlyCollection<StockBalance> GetBalances(Guid? warehouseId, Guid? productId) =>
        db.Query(Specification.Create<StockBalance>(x =>
                (!warehouseId.HasValue || x.WarehouseId == warehouseId) &&
                (!productId.HasValue || x.ProductId == productId)))
            .OrderBy(x => x.WarehouseId).ThenBy(x => x.ProductId).ToArray();

    public IReadOnlyCollection<InventoryMovement> GetKardex(
        Guid productId, Guid? warehouseId, DateTimeOffset? from, DateTimeOffset? to) =>
        db.Query(Specification.Create<InventoryMovement>(x =>
                x.ProductId == productId &&
                (!warehouseId.HasValue || x.SourceWarehouseId == warehouseId || x.DestinationWarehouseId == warehouseId) &&
                (!from.HasValue || x.Date >= from) &&
                (!to.HasValue || x.Date <= to)))
            .OrderBy(x => x.Date).ToArray();

    public IReadOnlyCollection<LowStockResponse> GetLowStock() =>
        (from product in db.Query(Specification.Create<Domain.Catalogs.Product>(x => x.Active))
         join balance in db.Query(Specification.All<StockBalance>())
             on product.Id equals balance.ProductId into balances
         from balance in balances.DefaultIfEmpty()
         let quantity = balance == null ? 0 : balance.Quantity
         where quantity <= product.MinimumStock
         select new LowStockResponse(
             product.Id, product.Sku, product.Name, product.MinimumStock,
             quantity, balance == null ? null : balance.WarehouseId))
        .ToArray();

    public async Task<InventoryAdjustment> CreateAdjustmentAsync(
        CreateAdjustmentRequest request, Guid actorId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Items.Count == 0)
            throw new ArgumentException("Reason and items are required.");

        var adjustment = new InventoryAdjustment
        {
            Folio = await folios.NextAsync("inventory_adjustment", "ADJ-", cancellationToken),
            WarehouseId = request.WarehouseId,
            Reason = request.Reason,
            CreatedBy = actorId
        };
        foreach (var item in request.Items)
        {
            var current = db.Query(Specification.Create<StockBalance>(
                x => x.WarehouseId == request.WarehouseId && x.ProductId == item.ProductId))
                .SingleOrDefault()?.Quantity ?? 0;
            adjustment.Items.Add(new InventoryAdjustmentItem
            {
                ProductId = item.ProductId,
                SystemQuantity = current,
                PhysicalQuantity = item.PhysicalQuantity,
                UnitCost = item.UnitCost
            });
        }
        db.Add(adjustment);
        await db.SaveChangesAsync(cancellationToken);
        return adjustment;
    }

    public Task<InventoryAdjustment> ConfirmAdjustmentAsync(
        Guid id, Guid actorId, string correlationId, CancellationToken cancellationToken) =>
        db.ExecuteAtomicAsync(async token =>
        {
            var adjustment = GetAdjustment(id);
            adjustment.AuthorizedBy = actorId;
            adjustment.Confirm(datetimeProvider.UtcNow);
            foreach (var item in adjustment.Items.Where(x => x.DifferenceQuantity != 0))
                posting.Post(item.ProductId, adjustment.WarehouseId, item.DifferenceQuantity, item.UnitCost,
                    MovementType.Adjustment, nameof(InventoryAdjustment), adjustment.Id, actorId);
            audit.Add("Confirm", "inventory", nameof(InventoryAdjustment), id, actorId, correlationId);
            await db.SaveChangesAsync(token);
            return adjustment;
        }, cancellationToken);

    public async Task CancelAdjustmentAsync(
        Guid id, string reason, Guid actorId, string correlationId, CancellationToken cancellationToken)
    {
        var adjustment = GetAdjustment(id);
        adjustment.Cancel(reason, datetimeProvider.UtcNow);
        audit.Add("Cancel", "inventory", nameof(InventoryAdjustment), id, actorId, correlationId);
        await db.SaveChangesAsync(cancellationToken);
    }

    public Task TransferAsync(
        TransferRequest request, Guid actorId, string correlationId, CancellationToken cancellationToken) =>
        db.ExecuteAtomicAsync(async token =>
        {
            if (request.SourceWarehouseId == request.DestinationWarehouseId)
                throw new ArgumentException("Warehouses must differ.");
            if (request.Quantity <= 0)
                throw new ArgumentException("Quantity must be positive.");
            var reference = Guid.NewGuid();
            posting.Post(request.ProductId, request.SourceWarehouseId, -request.Quantity, request.UnitCost,
                MovementType.InternalTransfer, "InternalTransfer", reference, actorId, false, request.Notes);
            posting.Post(request.ProductId, request.DestinationWarehouseId, request.Quantity, request.UnitCost,
                MovementType.InternalTransfer, "InternalTransfer", reference, actorId, false, request.Notes);
            audit.Add("Transfer", "inventory", "InternalTransfer", reference, actorId, correlationId);
            await db.SaveChangesAsync(token);
            return true;
        }, cancellationToken);

    private InventoryAdjustment GetAdjustment(Guid id) =>
        db.Query(Specification.Create<InventoryAdjustment>(x => x.Id == id)).SingleOrDefault()
        ?? throw new NotFoundException("Adjustment not found.");
}
