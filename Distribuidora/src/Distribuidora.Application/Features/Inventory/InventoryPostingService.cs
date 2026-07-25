using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Specifications;
using Distribuidora.Domain.Inventory;

namespace Distribuidora.Application.Features.Inventory;

public sealed class InventoryPostingService(
    IAppDbContext db,
    IRequestTraceContext trace,
    IDatatimeProvider datetimeProvider)
{
    public InventoryMovement Post(
        Guid productId, Guid warehouseId, decimal delta, decimal unitCost,
        MovementType type, string referenceType, Guid referenceId, Guid actorId,
        bool allowNegativeStock = false, string? notes = null)
    {
        if (delta == 0) throw new ArgumentException("Movement quantity cannot be zero.");
        var balance = db.Query(Specification.Create<StockBalance>(
            x => x.ProductId == productId && x.WarehouseId == warehouseId)).SingleOrDefault();
        if (balance is null)
        {
            balance = new StockBalance { ProductId = productId, WarehouseId = warehouseId, CreatedBy = actorId };
            db.Add(balance);
        }
        var utcNow = datetimeProvider.UtcNow;
        balance.Apply(delta, allowNegativeStock, utcNow);
        var movement = new InventoryMovement
        {
            OperationId = trace.OperationId,
            CorrelationId = trace.CorrelationId,
            TransactionId = trace.TransactionId ?? "",
            Folio = $"MOV-{utcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid():N}"[..31],
            Date = utcNow,
            ProductId = productId,
            Quantity = Math.Abs(delta),
            SourceWarehouseId = delta < 0 ? warehouseId : null,
            DestinationWarehouseId = delta > 0 ? warehouseId : null,
            UnitCost = unitCost,
            MovementType = type,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            Notes = notes,
            ResultingBalance = balance.Quantity,
            CreatedBy = actorId
        };
        db.Add(movement);
        return movement;
    }
}
