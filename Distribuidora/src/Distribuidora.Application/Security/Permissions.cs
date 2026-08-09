namespace Distribuidora.Application.Security;

public static class SecurityClaimTypes
{
    public const string Permission = "permission";
}

public static class SecurityRoleNames
{
    public const string Administrator = "Administrator";
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
        public const string Deactivate = "catalogs.deactivate";
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
        public const string Export = "audit.export";
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
        Security.View,
        Security.CreateUser,
        Security.EditUser,
        Security.ManageRoles,
        Catalogs.View,
        Catalogs.Create,
        Catalogs.Edit,
        Catalogs.Deactivate,
        Inventory.View,
        Inventory.Adjust,
        Inventory.Transfer,
        Inventory.CancelAdjustment,
        Purchases.View,
        Purchases.Create,
        Purchases.Confirm,
        Purchases.Cancel,
        Purchases.CloseReceipt,
        Sales.View,
        Sales.Create,
        Sales.EditDraft,
        Sales.Confirm,
        Sales.RegisterPayment,
        Sales.Cancel,
        Sales.Invoice,
        Sales.CancelInvoice,
        Sales.ViewBillingEligibility,
        Sales.AssignBillingRecipient,
        Sales.ReplaceBillingRecipient,
        Sales.ReconcileInvoice,
        Sales.ManageGlobalInvoiceReplacement,
        Receivables.View,
        Receivables.RegisterPayment,
        Receivables.ApplyPayment,
        Receivables.CancelPayment,
        Receivables.ChangeCreditLimit,
        Audit.View,
        Audit.Export,
        Audit.ManageReasons,
        Logs.ActivityRead,
        Logs.AuditRead,
        Logs.ErrorsRead,
        Logs.ErrorsResolve,
        Logs.EventsRead,
        Logs.TraceRead,
        Logs.Export,
        Reports.View,
        Reports.Financial,
        Reports.Inventory,
        Administration.View,
        Administration.Configure,
        Administration.ManageFolios,
        Administration.ManagePaymentMethods
    ];
}
