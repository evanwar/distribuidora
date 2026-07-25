using Distribuidora.Application.Features.Administration;
using Distribuidora.Application.Features.Authentication;
using Distribuidora.Application.Features.Audits;
using Distribuidora.Application.Features.Customers;
using Distribuidora.Application.Features.Identity;
using Distribuidora.Application.Features.Inventory;
using Distribuidora.Application.Features.Products;
using Distribuidora.Application.Features.Purchases;
using Distribuidora.Application.Features.Receivables;
using Distribuidora.Application.Features.ReferenceData;
using Distribuidora.Application.Features.Reports;
using Distribuidora.Application.Features.Sales;
using Distribuidora.Application.Features.Suppliers;
using Distribuidora.Application.Features.Warehouses;
using Microsoft.Extensions.DependencyInjection;

namespace Distribuidora.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services) =>
        services.AddScoped<AuthService>()
            .AddScoped<IdentityAccessService>()
            .AddScoped<ProductService>()
            .AddScoped<ReferenceDataService>()
            .AddScoped<CustomerService>()
            .AddScoped<SupplierService>()
            .AddScoped<WarehouseService>()
            .AddScoped<InventoryPostingService>()
            .AddScoped<InventoryService>()
            .AddScoped<PurchaseService>()
            .AddScoped<SalesService>()
            .AddScoped<ReceivablesService>()
            .AddScoped<FolioNumberService>()
            .AddScoped<AuditService>()
            .AddScoped<AuditEntryService>()
            .AddScoped<LogQueryService>()
            .AddScoped<ReportService>()
            .AddScoped<AdministrationService>();
}
