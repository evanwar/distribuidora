using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Distribuidora.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddElectronicInvoicing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "electronic_invoices",
                schema: "sales",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SaleId = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IdempotencyKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ProviderInvoiceId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    FiscalUuid = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    IssuedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CancelledAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CancellationReasonCode = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: true),
                    ErrorCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    RowVersion = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_electronic_invoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_electronic_invoices_counter_sales_SaleId",
                        column: x => x.SaleId,
                        principalSchema: "sales",
                        principalTable: "counter_sales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_electronic_invoices_FiscalUuid",
                schema: "sales",
                table: "electronic_invoices",
                column: "FiscalUuid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_electronic_invoices_IdempotencyKey",
                schema: "sales",
                table: "electronic_invoices",
                column: "IdempotencyKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_electronic_invoices_Provider_ProviderInvoiceId",
                schema: "sales",
                table: "electronic_invoices",
                columns: new[] { "Provider", "ProviderInvoiceId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_electronic_invoices_SaleId",
                schema: "sales",
                table: "electronic_invoices",
                column: "SaleId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "electronic_invoices",
                schema: "sales");
        }
    }
}
