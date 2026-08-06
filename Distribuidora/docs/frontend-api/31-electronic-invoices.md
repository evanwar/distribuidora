# Electronic invoices

Electronic invoicing is exposed as a sale subresource. The backend remains the source of truth and FiscalAPI is hidden behind a provider-neutral application port.

## Operations

- `GET /api/v1/sales/{saleId}/electronic-invoice` — `sales.view`
- `POST /api/v1/sales/{saleId}/electronic-invoice` — `sales.invoice`
- `GET /api/v1/sales/{saleId}/electronic-invoice/files/xml` — `sales.view`
- `GET /api/v1/sales/{saleId}/electronic-invoice/files/pdf` — `sales.view`
- `POST /api/v1/sales/{saleId}/electronic-invoice/cancel` — `sales.cancel_invoice`
- `GET /api/v1/counter-sales/{saleId}/billing-eligibility` — `sales.view_billing_eligibility`
- `PUT /api/v1/counter-sales/{saleId}/billing-recipient` — `sales.assign_billing_recipient`
- `GET /api/v1/counter-sales/{saleId}/fiscal-status` — `sales.view_billing_eligibility`
- `PUT /api/v1/counter-sales/{saleId}/fiscal-coverage` — `sales.manage_global_invoice_replacement`

The issue request supplies CFDI 4.0 recipient data and SAT metadata for each sale product. Prices, quantities, discounts, descriptions, payment method (`PUE`/`PPD`) and folio are always taken from the confirmed backend sale.

## Configuration

Set secrets through environment variables or a secret provider; never commit them:

- `ElectronicInvoicing__Provider=FiscalApi`
- `ElectronicInvoicing__IssuerProviderId`
- `ElectronicInvoicing__ExpeditionZipCode`
- `ElectronicInvoicing__Series`
- `ElectronicInvoicing__FiscalApi__ApiUrl` (`https://test.fiscalapi.com` or live URL)
- `ElectronicInvoicing__FiscalApi__ApiKey`
- `ElectronicInvoicing__FiscalApi__Tenant`

An attempt is persisted before the remote call. A timeout or indeterminate provider failure is marked as `Failed` and is not automatically retried, preventing accidental duplicate CFDIs; reconcile it in FiscalAPI first.

## Post-sale billing recipient

A confirmed public sale keeps `CounterSale.CustomerId` unchanged. The buyer that later requests an invoice is recorded as a separate, audited billing recipient. The UI must query billing eligibility first, then associate an active customer with a complete CFDI 4.0 profile. The backend reserves the sale for a nominative invoice and persists the exact recipient snapshot used for the provider request.

Historical sales without a trusted fiscal coverage record are returned as `ReconciliationRequired`. Sales marked as included in an open or issued global invoice are blocked from direct nominative invoicing. An issued global invoice requires the SAT reason `04` replacement workflow outside the nominative-invoice cancellation endpoint.
