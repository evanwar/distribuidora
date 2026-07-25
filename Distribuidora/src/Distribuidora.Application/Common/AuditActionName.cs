using System.Text.RegularExpressions;

namespace Distribuidora.Application.Common;

public static partial class AuditActionName
{
    private static readonly Dictionary<string, string> PastTense = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Create"] = "CREATED", ["Update"] = "UPDATED", ["Confirm"] = "CONFIRMED",
        ["Cancel"] = "CANCELLED", ["Close"] = "CLOSED", ["Transfer"] = "TRANSFERRED",
        ["RegisterPayment"] = "PAYMENT_REGISTERED", ["ApplyPayment"] = "PAYMENT_APPLIED",
        ["CancelPayment"] = "PAYMENT_CANCELLED", ["ChangeCreditLimit"] = "CREDIT_LIMIT_CHANGED",
        ["AddNote"] = "NOTE_ADDED"
    };

    public static string For(string entityName, string action)
    {
        var entity = WordBoundary().Replace(entityName, "$1_$2").ToUpperInvariant();
        var normalizedAction = PastTense.TryGetValue(action, out var value)
            ? value
            : WordBoundary().Replace(action, "$1_$2").ToUpperInvariant();
        return $"{entity}_{normalizedAction}";
    }

    [GeneratedRegex("([a-z0-9])([A-Z])")]
    private static partial Regex WordBoundary();
}
