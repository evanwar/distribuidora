using Microsoft.AspNetCore.Authorization;

namespace Distribuidora.Api.Auth;

public sealed record PermissionRequirement(string Permission) : IAuthorizationRequirement;

public sealed class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (context.User.HasClaim("permission", requirement.Permission)) context.Succeed(requirement);
        return Task.CompletedTask;
    }
}

public static class Permissions
{
    public static class Security
    {
        public const string View = "security.view";
        public const string CreateUser = "security.create_user";
        public const string EditUser = "security.edit_user";
        public const string ManageRoles = "security.manage_roles";
    }
    public static class Catalogs
    {
        public const string View = "catalogs.view";
        public const string Create = "catalogs.create";
        public const string Edit = "catalogs.edit";
    }
    public static class Inventory
    {
        public const string View = "inventory.view";
        public const string Adjust = "inventory.adjust";
        public const string Transfer = "inventory.transfer";
        public const string CancelAdjustment = "inventory.cancel_adjustment";
    }
    public static class Purchases
    {
        public const string View = "purchases.view";
        public const string Create = "purchases.create";
        public const string Confirm = "purchases.confirm";
        public const string Cancel = "purchases.cancel";
        public const string CloseReceipt = "goods_receipts.close";
    }
    public static class Sales
    {
        public const string View = "sales.view";
        public const string Create = "sales.create";
        public const string EditDraft = "sales.edit_draft";
        public const string Confirm = "sales.confirm";
        public const string RegisterPayment = "sales.register_payment";
        public const string Cancel = "sales.cancel";
        public const string Invoice = "sales.invoice";
        public const string CancelInvoice = "sales.cancel_invoice";
        public const string ViewBillingEligibility = "sales.view_billing_eligibility";
        public const string AssignBillingRecipient = "sales.assign_billing_recipient";
        public const string ReplaceBillingRecipient = "sales.replace_billing_recipient";
        public const string ReconcileInvoice = "sales.reconcile_invoice";
        public const string ManageGlobalInvoiceReplacement = "sales.manage_global_invoice_replacement";
    }
    public static class Receivables
    {
        public const string View = "receivables.view";
        public const string RegisterPayment = "receivables.register_payment";
        public const string ApplyPayment = "receivables.apply_payment";
        public const string CancelPayment = "receivables.cancel_payment";
        public const string ChangeCreditLimit = "receivables.change_credit_limit";
    }
    public static class Audit
    {
        public const string View = "audit.view";
        public const string ManageReasons = "admin.manage_cancellation_reasons";
    }
    public static class Logs
    {
        public const string ActivityRead = "logs.activity.read";
        public const string AuditRead = "logs.audit.read";
        public const string ErrorsRead = "logs.errors.read";
        public const string ErrorsResolve = "logs.errors.resolve";
        public const string EventsRead = "logs.events.read";
        public const string TraceRead = "logs.trace.read";
        public const string Export = "logs.export";
    }
    public static class Reports
    {
        public const string View = "reports.view";
        public const string Financial = "reports.financial";
        public const string Inventory = "reports.inventory";
    }
    public static class Administration
    {
        public const string View = "admin.view";
        public const string Configure = "admin.configure";
        public const string ManageFolios = "admin.manage_folios";
        public const string ManagePaymentMethods = "admin.manage_payment_methods";
    }

    public static readonly string[] All =
    [
        "security.view", "security.create_user", "security.edit_user", "security.manage_roles",
        "catalogs.view", "catalogs.create", "catalogs.edit", "catalogs.deactivate",
        "inventory.view", "inventory.adjust", "inventory.transfer", "inventory.cancel_adjustment",
        "purchases.view", "purchases.create", "purchases.confirm", "purchases.cancel", "goods_receipts.close",
        "sales.view", "sales.create", "sales.edit_draft", "sales.confirm", "sales.register_payment", "sales.cancel", "sales.invoice", "sales.cancel_invoice",
        "sales.view_billing_eligibility", "sales.assign_billing_recipient", "sales.replace_billing_recipient", "sales.reconcile_invoice", "sales.manage_global_invoice_replacement",
        "receivables.view", "receivables.register_payment", "receivables.apply_payment", "receivables.cancel_payment", "receivables.change_credit_limit",
        "audit.view", "audit.export", "admin.manage_cancellation_reasons",
        "logs.activity.read", "logs.audit.read", "logs.errors.read", "logs.errors.resolve", "logs.events.read", "logs.trace.read", "logs.export",
        "reports.view", "reports.financial", "reports.inventory",
        "admin.view", "admin.configure", "admin.manage_folios", "admin.manage_payment_methods"
    ];
}
