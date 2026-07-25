using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Common;
using Distribuidora.Application.Specifications;
using Distribuidora.Contracts.Requests;
using Distribuidora.Domain.Administration;
using Distribuidora.Domain.Audits;

namespace Distribuidora.Application.Features.Administration;

public sealed class AdministrationService(IAppDbContext db, IDatatimeProvider datetimeProvider)
{
    public IReadOnlyCollection<SystemSetting> GetSettings() =>
        db.Query(Specification.All<SystemSetting>()).OrderBy(x => x.Module).ThenBy(x => x.Key).ToArray();

    public async Task<SystemSetting> UpdateSettingAsync(string key, UpdateSettingRequest r, Guid actor, string correlationId, CancellationToken ct)
    {
        ValidateTypedValue(r.Value, r.DataType);
        var setting = db.Query(Specification.Create<SystemSetting>(x => x.Key == key)).SingleOrDefault();
        if (setting is null)
        {
            setting = new SystemSetting { Key = key, CreatedBy = actor };
            db.Add(setting);
        }
        setting.Value = r.Value; setting.DataType = r.DataType; setting.Description = r.Description; setting.Module = r.Module;
        setting.UpdatedAt = datetimeProvider.UtcNow; setting.UpdatedBy = actor;
        Audit("UpdateSetting", nameof(SystemSetting), setting.Id, actor, correlationId);
        await db.SaveChangesAsync(ct); return setting;
    }

    public IReadOnlyCollection<FolioSequence> GetFolioSequences() =>
        db.Query(Specification.All<FolioSequence>()).OrderBy(x => x.DocumentType).ToArray();

    public async Task<FolioSequence> SaveFolioAsync(Guid? id, FolioSequenceRequest r, Guid actor, string correlationId, CancellationToken ct)
    {
        if (r.Padding is < 1 or > 20 || string.IsNullOrWhiteSpace(r.DocumentType)) throw new ArgumentException("Invalid folio sequence.");
        if (db.Query(Specification.Create<FolioSequence>(x => x.DocumentType == r.DocumentType && x.Id != id)).Any()) throw new ConflictException("Document type already has a sequence.");
        var entity = id is null ? new FolioSequence { CreatedBy = actor } :
            db.Query(Specification.Create<FolioSequence>(x => x.Id == id)).SingleOrDefault() ?? throw new NotFoundException("Folio sequence not found.");
        entity.DocumentType = r.DocumentType; entity.Prefix = r.Prefix; entity.Padding = r.Padding; entity.Active = r.Active; entity.SetCurrentNumber(r.CurrentNumber);
        if (id is null) db.Add(entity);
        Audit(id is null ? "CreateFolio" : "UpdateFolio", nameof(FolioSequence), entity.Id, actor, correlationId);
        await db.SaveChangesAsync(ct); return entity;
    }

    public IReadOnlyCollection<PaymentMethod> GetPaymentMethods() =>
        db.Query(Specification.All<PaymentMethod>()).OrderBy(x => x.Name).ToArray();

    public async Task<PaymentMethod> SavePaymentMethodAsync(Guid? id, PaymentMethodRequest r, Guid actor, string correlationId, CancellationToken ct)
    {
        if (db.Query(Specification.Create<PaymentMethod>(x => x.Code == r.Code && x.Id != id)).Any()) throw new ConflictException("Payment method code already exists.");
        var entity = id is null ? new PaymentMethod { CreatedBy = actor } :
            db.Query(Specification.Create<PaymentMethod>(x => x.Id == id)).SingleOrDefault() ?? throw new NotFoundException("Payment method not found.");
        entity.Code = r.Code.Trim().ToLowerInvariant(); entity.Name = r.Name.Trim(); entity.RequiresReference = r.RequiresReference; entity.Active = r.Active;
        if (id is null) db.Add(entity);
        Audit(id is null ? "CreatePaymentMethod" : "UpdatePaymentMethod", nameof(PaymentMethod), entity.Id, actor, correlationId);
        await db.SaveChangesAsync(ct); return entity;
    }

    public CreditPolicy GetCreditPolicy() => db.Query(Specification.All<CreditPolicy>()).FirstOrDefault() ?? new CreditPolicy();

    public async Task<CreditPolicy> UpdateCreditPolicyAsync(CreditPolicyRequest r, Guid actor, string correlationId, CancellationToken ct)
    {
        if (r.DefaultDueDays < 0) throw new ArgumentException("Default due days cannot be negative.");
        var entity = db.Query(Specification.All<CreditPolicy>()).FirstOrDefault();
        if (entity is null) { entity = new CreditPolicy { CreatedBy = actor }; db.Add(entity); }
        entity.AllowCreditSales = r.AllowCreditSales; entity.DefaultDueDays = r.DefaultDueDays; entity.RequireAuthorizationOverLimit = r.RequireAuthorizationOverLimit; entity.Active = r.Active;
        Audit("UpdateCreditPolicy", nameof(CreditPolicy), entity.Id, actor, correlationId);
        await db.SaveChangesAsync(ct); return entity;
    }

    public InventoryPolicy GetInventoryPolicy() => db.Query(Specification.All<InventoryPolicy>()).FirstOrDefault() ?? new InventoryPolicy();

    public async Task<InventoryPolicy> UpdateInventoryPolicyAsync(InventoryPolicyRequest r, Guid actor, string correlationId, CancellationToken ct)
    {
        var entity = db.Query(Specification.All<InventoryPolicy>()).FirstOrDefault();
        if (entity is null) { entity = new InventoryPolicy { CreatedBy = actor }; db.Add(entity); }
        entity.AllowNegativeStock = r.AllowNegativeStock; entity.RequireReasonForAdjustment = r.RequireReasonForAdjustment; entity.Active = r.Active;
        Audit("UpdateInventoryPolicy", nameof(InventoryPolicy), entity.Id, actor, correlationId);
        await db.SaveChangesAsync(ct); return entity;
    }

    private static void ValidateTypedValue(string value, string type)
    {
        var valid = type.ToLowerInvariant() switch
        {
            "string" => true,
            "int" => int.TryParse(value, out _),
            "decimal" => decimal.TryParse(value, out _),
            "bool" => bool.TryParse(value, out _),
            "datetime" => DateTimeOffset.TryParse(value, out _),
            _ => false
        };
        if (!valid) throw new ArgumentException("Setting value does not match its data type.");
    }

    private void Audit(string action, string entity, Guid id, Guid actor, string correlationId)
    {
        var utcNow = datetimeProvider.UtcNow;
        db.Add(new AuditLog { OccurredAt = utcNow, CreatedAt = utcNow, UserId = actor, Action = AuditActionName.For(entity, action), Module = "admin", EntityName = entity, EntityId = id, CorrelationId = correlationId });
    }
}
