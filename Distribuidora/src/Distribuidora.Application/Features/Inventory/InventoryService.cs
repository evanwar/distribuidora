using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Features.Administration;
using Distribuidora.Application.Features.Audits;
using Distribuidora.Application.Specifications;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Distribuidora.Domain.Inventory;
using Distribuidora.Domain.Common;
using Domain = Distribuidora.Domain;

namespace Distribuidora.Application.Features.Inventory;

public sealed class InventoryService(
    IAppDbContext db,
    InventoryPostingService posting,
    FolioNumberService folios,
    AuditEntryService audit,
    IDatatimeProvider datetimeProvider)
{
    private const int RequiredWarehouseCountForTransfer = 2;

    public IReadOnlyCollection<InventoryAdjustment> GetAdjustments() =>
        db.Query(Specification.All<InventoryAdjustment>())
            .OrderByDescending(x => x.CreatedAt)
            .ToArray();

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
        if (!db.Query(Specification.Create<Domain.Catalogs.Warehouse>(
                x => x.Id == request.WarehouseId && x.Active)).Any())
            throw new ArgumentException("Warehouse is inactive or does not exist.");
        if (request.Items.Any(x => x.PhysicalQuantity < 0 || x.UnitCost < 0))
            throw new ArgumentException("Physical quantity and unit cost cannot be negative.");
        if (request.Items.Select(x => x.ProductId).Distinct().Count() != request.Items.Count)
            throw new ArgumentException("A product cannot be repeated in the same adjustment.");

        var adjustment = new InventoryAdjustment
        {
            Folio = await folios.NextAsync(
                Domain.Administration.DocumentFolioTypes.InventoryAdjustment,
                Domain.Administration.DocumentFolioTypes.InventoryAdjustmentPrefix,
                cancellationToken),
            WarehouseId = request.WarehouseId,
            Reason = request.Reason,
            CreatedBy = actorId
        };
        foreach (var item in request.Items)
        {
            if (!db.Query(Specification.Create<Domain.Catalogs.Product>(
                    x => x.Id == item.ProductId && x.Active)).Any())
                throw new ArgumentException("Product is inactive or does not exist.");
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
            foreach (var item in adjustment.Items)
            {
                var current = db.Query(Specification.Create<StockBalance>(
                    x => x.WarehouseId == adjustment.WarehouseId && x.ProductId == item.ProductId))
                    .SingleOrDefault()?.Quantity ?? 0;
                var difference = item.PhysicalQuantity - current;
                if (difference != 0)
                    posting.Post(item.ProductId, adjustment.WarehouseId, difference, item.UnitCost,
                        MovementType.Adjustment, nameof(InventoryAdjustment), adjustment.Id, actorId);
            }
            audit.Add("Confirm", "inventory", nameof(InventoryAdjustment), id, actorId, correlationId);
            await db.SaveChangesAsync(token);
            return adjustment;
        }, cancellationToken);

    public Task CancelAdjustmentAsync(
        Guid id,
        string reason,
        Guid actorId,
        string correlationId,
        CancellationToken cancellationToken) =>
        db.ExecuteAtomicAsync(async token =>
        {
            var adjustment = GetAdjustment(id);

            if (adjustment.Status == DocumentStatus.Confirmed)
            {
                ReverseConfirmedAdjustment(adjustment, reason, actorId);
            }

            adjustment.Cancel(reason, datetimeProvider.UtcNow);
            audit.Add(
                "Cancel",
                "inventory",
                nameof(InventoryAdjustment),
                id,
                actorId,
                correlationId,
                reason: reason);

            await db.SaveChangesAsync(token);
            return true;
        }, cancellationToken);

    public Task TransferAsync(
        TransferRequest request, Guid actorId, string correlationId, CancellationToken cancellationToken) =>
        db.ExecuteAtomicAsync(async token =>
        {
            if (request.SourceWarehouseId == request.DestinationWarehouseId)
                throw new ArgumentException("Warehouses must differ.");
            if (request.Quantity <= 0)
                throw new ArgumentException("Quantity must be positive.");
            if (!db.Query(Specification.Create<Domain.Catalogs.Product>(
                    x => x.Id == request.ProductId && x.Active)).Any())
                throw new ArgumentException("Product is inactive or does not exist.");
            var activeWarehouses = db.Query(Specification.Create<Domain.Catalogs.Warehouse>(
                    x => (x.Id == request.SourceWarehouseId || x.Id == request.DestinationWarehouseId) && x.Active))
                .Count();
            if (activeWarehouses != RequiredWarehouseCountForTransfer)
                throw new ArgumentException("Both warehouses must be active.");
            var reference = Guid.NewGuid();
            posting.Post(request.ProductId, request.SourceWarehouseId, -request.Quantity, request.UnitCost,
                MovementType.InternalTransfer, nameof(MovementType.InternalTransfer), reference, actorId, false, request.Notes);
            posting.Post(request.ProductId, request.DestinationWarehouseId, request.Quantity, request.UnitCost,
                MovementType.InternalTransfer, nameof(MovementType.InternalTransfer), reference, actorId, false, request.Notes);
            audit.Add("Transfer", "inventory", nameof(MovementType.InternalTransfer), reference, actorId, correlationId);
            await db.SaveChangesAsync(token);
            return true;
        }, cancellationToken);

    private InventoryAdjustment GetAdjustment(Guid id) =>
        db.Query(Specification.Create<InventoryAdjustment>(x => x.Id == id)).SingleOrDefault()
        ?? throw new NotFoundException("Adjustment not found.");

    private void ReverseConfirmedAdjustment(
        InventoryAdjustment adjustment,
        string reason,
        Guid actorId)
    {
        var originalMovements = db.Query(Specification.Create<InventoryMovement>(movement =>
                movement.MovementType == MovementType.Adjustment &&
                movement.ReferenceType == nameof(InventoryAdjustment) &&
                movement.ReferenceId == adjustment.Id))
            .ToArray();

        foreach (var movement in originalMovements)
        {
            var reversalQuantity = movement.DestinationWarehouseId == adjustment.WarehouseId
                ? -movement.Quantity
                : movement.Quantity;

            posting.Post(
                movement.ProductId,
                adjustment.WarehouseId,
                reversalQuantity,
                movement.UnitCost,
                MovementType.AdjustmentCancellation,
                nameof(InventoryAdjustment),
                adjustment.Id,
                actorId,
                notes: reason);
        }
    }
}
