using System.Text.Json;
using Distribuidora.Application.Realtime;
using Distribuidora.Application.Security;
using Distribuidora.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Distribuidora.Api.Features.Realtime;

[Authorize]
public sealed class RealtimeHub : Hub
{
    public const string Route = "/hubs/realtime";
    public const string ClientEventName = "domainEvent";

    public async Task Subscribe(string channel)
    {
        var permission = RealtimeChannelCatalog.RequiredPermission(channel);
        if (permission is null || !Context.User!.HasClaim(SecurityClaimTypes.Permission, permission))
            throw new HubException("You are not authorized to subscribe to this real-time channel.");

        await Groups.AddToGroupAsync(Context.ConnectionId, channel);
    }

    public Task Unsubscribe(string channel) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, channel);
}

public sealed class SignalRRealtimeEventPublisher(IHubContext<RealtimeHub> hub) : IRealtimeEventPublisher
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public async Task PublishAsync(PersistedEvent persistedEvent, CancellationToken cancellationToken)
    {
        if (!persistedEvent.Type.EndsWith(nameof(EntityChangedDomainEvent), StringComparison.Ordinal))
            return;

        var domainEvent = JsonSerializer.Deserialize<EntityChangedDomainEvent>(persistedEvent.Payload, JsonOptions);
        if (domainEvent is null || !RealtimeChannelCatalog.TryResolve(domainEvent, out var channel))
            return;

        var notification = new RealtimeEvent(
            persistedEvent.EventId,
            channel,
            domainEvent.EventName,
            domainEvent.EntityName,
            domainEvent.EntityId,
            persistedEvent.OccurredAt,
            persistedEvent.CorrelationId,
            persistedEvent.OperationId);

        await hub.Clients.Group(channel)
            .SendAsync(RealtimeHub.ClientEventName, notification, cancellationToken);
    }
}

internal static class RealtimeChannelCatalog
{
    private static readonly IReadOnlyDictionary<string, string> Permissions =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            [RealtimeChannels.Sales] = Application.Security.Permissions.Sales.View,
            [RealtimeChannels.Inventory] = Application.Security.Permissions.Inventory.View,
            [RealtimeChannels.Purchases] = Application.Security.Permissions.Purchases.View,
            [RealtimeChannels.Receivables] = Application.Security.Permissions.Receivables.View,
            [RealtimeChannels.Catalogs] = Application.Security.Permissions.Catalogs.View,
            [RealtimeChannels.PaymentTerminals] = Application.Security.Permissions.Administration.ViewPaymentTerminals,
            [RealtimeChannels.Invoicing] = Application.Security.Permissions.Sales.ViewBillingEligibility,
            [RealtimeChannels.Security] = Application.Security.Permissions.Security.View,
            [RealtimeChannels.Logs] = Application.Security.Permissions.Logs.EventsRead
        };

    public static string? RequiredPermission(string channel) =>
        Permissions.GetValueOrDefault(channel);

    public static bool TryResolve(EntityChangedDomainEvent domainEvent, out string channel)
    {
        channel = domainEvent.EntityName switch
        {
            "CounterSale" or "PointPayment" => RealtimeChannels.Sales,
            "StockBalance" or "InventoryAdjustment" or "InventoryTransfer" => RealtimeChannels.Inventory,
            "PurchaseOrder" or "GoodsReceipt" => RealtimeChannels.Purchases,
            "AccountReceivable" or "CustomerPayment" => RealtimeChannels.Receivables,
            "Customer" or "Supplier" or "Product" or "Warehouse" => RealtimeChannels.Catalogs,
            "PaymentTerminal" => RealtimeChannels.PaymentTerminals,
            "SaleFiscalStatus" or "SaleBillingRecipient" or "ElectronicInvoice" => RealtimeChannels.Invoicing,
            "User" or "Role" => RealtimeChannels.Security,
            "SystemErrorLog" or "SystemEventLog" => RealtimeChannels.Logs,
            _ => string.Empty
        };
        return channel.Length > 0;
    }
}
