using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Distribuidora.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPostSaleBillingRecipient : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "BillingCustomerId",
                schema: "sales",
                table: "electronic_invoices",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CfdiUseCode",
                schema: "sales",
                table: "electronic_invoices",
                type: "character varying(4)",
                maxLength: 4,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CurrencyCode",
                schema: "sales",
                table: "electronic_invoices",
                type: "character varying(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ExpeditionZipCode",
                schema: "sales",
                table: "electronic_invoices",
                type: "character varying(5)",
                maxLength: 5,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PaymentFormCode",
                schema: "sales",
                table: "electronic_invoices",
                type: "character varying(2)",
                maxLength: 2,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PaymentMethodCode",
                schema: "sales",
                table: "electronic_invoices",
                type: "character varying(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RecipientFiscalZipCode",
                schema: "sales",
                table: "electronic_invoices",
                type: "character varying(5)",
                maxLength: 5,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RecipientLegalName",
                schema: "sales",
                table: "electronic_invoices",
                type: "character varying(254)",
                maxLength: 254,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RecipientTaxId",
                schema: "sales",
                table: "electronic_invoices",
                type: "character varying(13)",
                maxLength: 13,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RecipientTaxRegimeCode",
                schema: "sales",
                table: "electronic_invoices",
                type: "character varying(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "customer_fiscal_profiles",
                schema: "catalogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    TaxId = table.Column<string>(type: "character varying(13)", maxLength: 13, nullable: false),
                    LegalName = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                    FiscalZipCode = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false),
                    TaxRegimeCode = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    DefaultCfdiUseCode = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: true),
                    InvoiceEmail = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    RowVersion = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_customer_fiscal_profiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_customer_fiscal_profiles_customers_CustomerId",
                        column: x => x.CustomerId,
                        principalSchema: "catalogs",
                        principalTable: "customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sale_billing_recipients",
                schema: "sales",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SaleId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    AssignedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    AssignedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    RowVersion = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sale_billing_recipients", x => x.Id);
                    table.ForeignKey(
                        name: "FK_sale_billing_recipients_counter_sales_SaleId",
                        column: x => x.SaleId,
                        principalSchema: "sales",
                        principalTable: "counter_sales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_sale_billing_recipients_customers_CustomerId",
                        column: x => x.CustomerId,
                        principalSchema: "catalogs",
                        principalTable: "customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "sale_fiscal_statuses",
                schema: "sales",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SaleId = table.Column<Guid>(type: "uuid", nullable: false),
                    CoverageStatus = table.Column<int>(type: "integer", nullable: false),
                    GlobalInvoiceFiscalUuid = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    ReconciliationReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    RowVersion = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sale_fiscal_statuses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_sale_fiscal_statuses_counter_sales_SaleId",
                        column: x => x.SaleId,
                        principalSchema: "sales",
                        principalTable: "counter_sales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_customer_fiscal_profiles_CustomerId",
                schema: "catalogs",
                table: "customer_fiscal_profiles",
                column: "CustomerId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_customer_fiscal_profiles_TaxId",
                schema: "catalogs",
                table: "customer_fiscal_profiles",
                column: "TaxId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sale_billing_recipients_CustomerId",
                schema: "sales",
                table: "sale_billing_recipients",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_sale_billing_recipients_SaleId",
                schema: "sales",
                table: "sale_billing_recipients",
                column: "SaleId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sale_fiscal_statuses_CoverageStatus",
                schema: "sales",
                table: "sale_fiscal_statuses",
                column: "CoverageStatus");

            migrationBuilder.CreateIndex(
                name: "IX_sale_fiscal_statuses_SaleId",
                schema: "sales",
                table: "sale_fiscal_statuses",
                column: "SaleId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "customer_fiscal_profiles",
                schema: "catalogs");

            migrationBuilder.DropTable(
                name: "sale_billing_recipients",
                schema: "sales");

            migrationBuilder.DropTable(
                name: "sale_fiscal_statuses",
                schema: "sales");

            migrationBuilder.DropColumn(
                name: "BillingCustomerId",
                schema: "sales",
                table: "electronic_invoices");

            migrationBuilder.DropColumn(
                name: "CfdiUseCode",
                schema: "sales",
                table: "electronic_invoices");

            migrationBuilder.DropColumn(
                name: "CurrencyCode",
                schema: "sales",
                table: "electronic_invoices");

            migrationBuilder.DropColumn(
                name: "ExpeditionZipCode",
                schema: "sales",
                table: "electronic_invoices");

            migrationBuilder.DropColumn(
                name: "PaymentFormCode",
                schema: "sales",
                table: "electronic_invoices");

            migrationBuilder.DropColumn(
                name: "PaymentMethodCode",
                schema: "sales",
                table: "electronic_invoices");

            migrationBuilder.DropColumn(
                name: "RecipientFiscalZipCode",
                schema: "sales",
                table: "electronic_invoices");

            migrationBuilder.DropColumn(
                name: "RecipientLegalName",
                schema: "sales",
                table: "electronic_invoices");

            migrationBuilder.DropColumn(
                name: "RecipientTaxId",
                schema: "sales",
                table: "electronic_invoices");

            migrationBuilder.DropColumn(
                name: "RecipientTaxRegimeCode",
                schema: "sales",
                table: "electronic_invoices");
        }
    }
}
