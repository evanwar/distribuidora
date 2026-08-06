using Distribuidora.Domain.AccountsReceivable;
using Distribuidora.Domain.Administration;
using Distribuidora.Domain.Common;
using Distribuidora.Domain.Catalogs;
using Distribuidora.Domain.Inventory;
using Distribuidora.Domain.Purchases;
using Distribuidora.Domain.Sales;

namespace Distribuidora.UnitTests;

public sealed class DomainRulesTests
{
    private static readonly DateTimeOffset OccurredAt = new(2026, 7, 25, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Stock_entry_increases_balance()
    {
        var stock = new StockBalance();
        stock.Apply(10, false, OccurredAt);
        Assert.Equal(10, stock.Quantity);
        Assert.Equal(OccurredAt, stock.UpdatedAt);
        Assert.Equal(OccurredAt, stock.DomainEvents.Single().OccurredAt);
    }

    [Fact]
    public void Stock_exit_without_quantity_is_rejected()
    {
        var stock = new StockBalance();
        Assert.Throws<DomainRuleException>(() => stock.Apply(-1, false, OccurredAt));
    }

    [Fact]
    public void Failed_stock_exit_preserves_the_existing_balance()
    {
        var stock = new StockBalance();
        stock.Apply(3, false, OccurredAt);

        Assert.Throws<DomainRuleException>(() => stock.Apply(-4, false, OccurredAt));

        Assert.Equal(3, stock.Quantity);
    }

    [Fact]
    public void Cash_sale_requires_full_payment()
    {
        var sale = Sale(PaymentCondition.Cash);
        Assert.Throws<DomainRuleException>(() => sale.Confirm(OccurredAt));
    }

    [Fact]
    public void Fully_paid_cash_sale_can_be_confirmed()
    {
        var sale = Sale(PaymentCondition.Cash);
        sale.Payments.Add(new SalePayment { Amount = 100, Method = "cash" });
        sale.Confirm(OccurredAt);
        Assert.Equal(DocumentStatus.Confirmed, sale.Status);
        Assert.Equal(0, sale.Balance);
    }

    [Fact]
    public void Sale_with_negative_payment_is_rejected()
    {
        var sale = Sale(PaymentCondition.Cash);
        sale.Payments.Add(new SalePayment { Amount = -100, Method = "cash" });
        Assert.Throws<DomainRuleException>(() => sale.Confirm(OccurredAt));
    }

    [Fact]
    public void Sale_discount_cannot_exceed_line_amount()
    {
        var sale = Sale(PaymentCondition.Credit);
        sale.Items.Single().Discount = 101;
        Assert.Throws<DomainRuleException>(() => sale.Confirm(OccurredAt));
    }

    [Fact]
    public void Confirmed_sale_cannot_be_confirmed_twice()
    {
        var sale = Sale(PaymentCondition.Cash);
        sale.Payments.Add(new SalePayment { Amount = 100, Method = "cash" });
        sale.Confirm(OccurredAt);
        Assert.Throws<DomainRuleException>(() => sale.Confirm(OccurredAt));
    }

    [Fact]
    public void Sale_cancellation_requires_reason()
    {
        var sale = Sale(PaymentCondition.Cash);
        sale.Payments.Add(new SalePayment { Amount = 100, Method = "cash" });
        sale.Confirm(OccurredAt);
        Assert.Throws<DomainRuleException>(() => sale.Cancel("", Guid.NewGuid(), OccurredAt));
    }

    [Fact]
    public void Receivable_payment_reduces_balance_and_reversal_restores_it()
    {
        var receivable = new AccountReceivable { Total = 200 };
        receivable.InitializeBalance();
        receivable.Apply(75, OccurredAt);
        Assert.Equal(125, receivable.Balance);
        Assert.Equal(ReceivableStatus.PartiallyPaid, receivable.Status);
        receivable.Reverse(75);
        Assert.Equal(200, receivable.Balance);
        Assert.Equal(ReceivableStatus.Pending, receivable.Status);
    }

    [Fact]
    public void Allocation_cannot_exceed_receivable_balance()
    {
        var receivable = new AccountReceivable { Total = 50 };
        receivable.InitializeBalance();
        Assert.Throws<DomainRuleException>(() => receivable.Apply(51, OccurredAt));
    }

    [Fact]
    public void Cancelled_customer_payment_cannot_be_allocated_again()
    {
        var payment = new CustomerPayment { Amount = 100 };
        payment.Cancel("voided");
        Assert.Throws<DomainRuleException>(() => payment.EnsureCanAllocate(50));
    }

    [Fact]
    public void Empty_goods_receipt_cannot_close()
    {
        var receipt = new GoodsReceipt();
        Assert.Throws<DomainRuleException>(() => receipt.Close(OccurredAt));
    }

    [Fact]
    public void Folio_is_incremental_and_cannot_move_backwards()
    {
        var sequence = new FolioSequence { Prefix = "CS-", Padding = 3 };
        Assert.Equal("CS-001", sequence.Next());
        Assert.Equal("CS-002", sequence.Next());
        Assert.Throws<DomainRuleException>(() => sequence.SetCurrentNumber(1));
    }

    [Fact]
    public void Electronic_invoice_has_a_strict_lifecycle()
    {
        var invoice = new ElectronicInvoice { SaleId = Guid.NewGuid(), Provider = "test", IdempotencyKey = "sale:1" };

        invoice.MarkIssued("provider-1", "83f8fead-70fe-4f6d-82ba-8af6abdd8343", OccurredAt);
        invoice.MarkCancelled("02", OccurredAt.AddMinutes(1));

        Assert.Equal(ElectronicInvoiceStatus.Cancelled, invoice.Status);
        Assert.Equal("83f8fead-70fe-4f6d-82ba-8af6abdd8343", invoice.FiscalUuid);
        Assert.Throws<DomainRuleException>(() => invoice.MarkIssued("provider-2", "other", OccurredAt));
    }

    [Fact]
    public void Failed_electronic_invoice_cannot_be_marked_as_issued_without_reconciliation()
    {
        var invoice = new ElectronicInvoice { SaleId = Guid.NewGuid(), Provider = "test", IdempotencyKey = "sale:2" };
        invoice.MarkFailed("timeout", "Unknown provider outcome");
        Assert.Throws<DomainRuleException>(() => invoice.MarkIssued("provider-1", "uuid", OccurredAt));
    }

    [Fact]
    public void Public_sale_fiscal_status_reserves_and_completes_nominative_invoice_once()
    {
        var status = new SaleFiscalStatus { SaleId = Guid.NewGuid() };

        status.ReserveForNominativeInvoice(OccurredAt);
        status.MarkNominativeInvoicePending(OccurredAt.AddMinutes(1));
        status.MarkNominativeInvoiceIssued(OccurredAt.AddMinutes(2));

        Assert.Equal(FiscalCoverageStatus.NominativeInvoiceIssued, status.CoverageStatus);
        Assert.Throws<DomainRuleException>(() => status.ReserveForNominativeInvoice(OccurredAt.AddMinutes(3)));
    }

    [Fact]
    public void Sale_in_issued_global_invoice_cannot_be_reserved_directly()
    {
        var status = new SaleFiscalStatus { SaleId = Guid.NewGuid() };
        status.Reconcile(
            FiscalCoverageStatus.IncludedInIssuedGlobalInvoice,
            "Verified against the fiscal provider.",
            "83f8fead-70fe-4f6d-82ba-8af6abdd8343",
            OccurredAt);

        Assert.Throws<DomainRuleException>(() => status.ReserveForNominativeInvoice(OccurredAt.AddMinutes(1)));
    }

    [Fact]
    public void Billing_recipient_replacement_is_auditable_and_locks_on_invoice_attempt()
    {
        var firstCustomer = Guid.NewGuid();
        var secondCustomer = Guid.NewGuid();
        var recipient = new SaleBillingRecipient { SaleId = Guid.NewGuid() };

        recipient.Assign(firstCustomer, "Buyer requested an invoice.", Guid.NewGuid(), OccurredAt);
        recipient.Assign(secondCustomer, "Corrected before invoicing.", Guid.NewGuid(), OccurredAt.AddMinutes(1));
        recipient.Lock(OccurredAt.AddMinutes(2));

        Assert.Equal(secondCustomer, recipient.CustomerId);
        Assert.Equal(BillingRecipientStatus.Locked, recipient.Status);
        Assert.Throws<DomainRuleException>(() =>
            recipient.Assign(firstCustomer, "Late change.", Guid.NewGuid(), OccurredAt.AddMinutes(3)));
    }

    [Fact]
    public void Customer_fiscal_profile_requires_cfdi_4_recipient_data()
    {
        var profile = new CustomerFiscalProfile
        {
            TaxId = "XAXX010101000",
            LegalName = "PUBLICO EN GENERAL",
            FiscalZipCode = "06000",
            TaxRegimeCode = "616",
            DefaultCfdiUseCode = "S01"
        };

        Assert.True(profile.IsComplete());
        profile.FiscalZipCode = "6000";
        Assert.False(profile.IsComplete());
    }

    private static CounterSale Sale(PaymentCondition condition)
    {
        var sale = new CounterSale { PaymentCondition = condition, CustomerId = condition == PaymentCondition.Cash ? null : Guid.NewGuid() };
        sale.Items.Add(new CounterSaleItem { ProductId = Guid.NewGuid(), Quantity = 2, UnitPrice = 50, HistoricalUnitCost = 25 });
        return sale;
    }
}
