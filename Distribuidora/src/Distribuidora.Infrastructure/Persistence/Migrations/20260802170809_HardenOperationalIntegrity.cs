using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Distribuidora.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class HardenOperationalIntegrity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_sale_payments_SaleId",
                schema: "sales",
                table: "sale_payments");

            migrationBuilder.AddColumn<long>(
                name: "RowVersion",
                schema: "security",
                table: "refresh_tokens",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.CreateIndex(
                name: "IX_sale_payments_SaleId_Reference",
                schema: "sales",
                table: "sale_payments",
                columns: new[] { "SaleId", "Reference" },
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_sale_payments_positive",
                schema: "sales",
                table: "sale_payments",
                sql: "\"Amount\" > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_purchase_order_items_integrity",
                schema: "purchases",
                table: "purchase_order_items",
                sql: "\"Quantity\" > 0 AND \"UnitCost\" >= 0 AND \"Discount\" >= 0 AND \"Discount\" <= \"Quantity\" * \"UnitCost\"");

            migrationBuilder.AddCheckConstraint(
                name: "CK_payment_allocations_positive",
                schema: "receivables",
                table: "payment_allocations",
                sql: "\"AmountApplied\" > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_goods_receipt_items_integrity",
                schema: "purchases",
                table: "goods_receipt_items",
                sql: "\"ReceivedQuantity\" > 0 AND \"UnitCost\" >= 0");

            migrationBuilder.CreateIndex(
                name: "IX_customer_payments_Method_Reference",
                schema: "receivables",
                table: "customer_payments",
                columns: new[] { "Method", "Reference" },
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_customer_payments_positive",
                schema: "receivables",
                table: "customer_payments",
                sql: "\"Amount\" > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_counter_sale_items_integrity",
                schema: "sales",
                table: "counter_sale_items",
                sql: "\"Quantity\" > 0 AND \"UnitPrice\" >= 0 AND \"Discount\" >= 0 AND \"Discount\" <= \"Quantity\" * \"UnitPrice\"");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_sale_payments_SaleId_Reference",
                schema: "sales",
                table: "sale_payments");

            migrationBuilder.DropCheckConstraint(
                name: "CK_sale_payments_positive",
                schema: "sales",
                table: "sale_payments");

            migrationBuilder.DropCheckConstraint(
                name: "CK_purchase_order_items_integrity",
                schema: "purchases",
                table: "purchase_order_items");

            migrationBuilder.DropCheckConstraint(
                name: "CK_payment_allocations_positive",
                schema: "receivables",
                table: "payment_allocations");

            migrationBuilder.DropCheckConstraint(
                name: "CK_goods_receipt_items_integrity",
                schema: "purchases",
                table: "goods_receipt_items");

            migrationBuilder.DropIndex(
                name: "IX_customer_payments_Method_Reference",
                schema: "receivables",
                table: "customer_payments");

            migrationBuilder.DropCheckConstraint(
                name: "CK_customer_payments_positive",
                schema: "receivables",
                table: "customer_payments");

            migrationBuilder.DropCheckConstraint(
                name: "CK_counter_sale_items_integrity",
                schema: "sales",
                table: "counter_sale_items");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                schema: "security",
                table: "refresh_tokens");

            migrationBuilder.CreateIndex(
                name: "IX_sale_payments_SaleId",
                schema: "sales",
                table: "sale_payments",
                column: "SaleId");
        }
    }
}
