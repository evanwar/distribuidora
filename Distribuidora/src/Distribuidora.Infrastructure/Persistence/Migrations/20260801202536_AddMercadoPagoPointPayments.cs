using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Distribuidora.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMercadoPagoPointPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "point_payments",
                schema: "sales",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SaleId = table.Column<Guid>(type: "uuid", nullable: false),
                    InitiatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    ExternalReference = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    IdempotencyKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TerminalId = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    OrderId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PaymentId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    StatusDetail = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PaymentMethodType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    PaymentMethodId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Installments = table.Column<int>(type: "integer", nullable: true),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    RowVersion = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_point_payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_point_payments_counter_sales_SaleId",
                        column: x => x.SaleId,
                        principalSchema: "sales",
                        principalTable: "counter_sales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_point_payments_ExternalReference",
                schema: "sales",
                table: "point_payments",
                column: "ExternalReference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_point_payments_IdempotencyKey",
                schema: "sales",
                table: "point_payments",
                column: "IdempotencyKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_point_payments_OrderId",
                schema: "sales",
                table: "point_payments",
                column: "OrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_point_payments_SaleId_Status",
                schema: "sales",
                table: "point_payments",
                columns: new[] { "SaleId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "point_payments",
                schema: "sales");
        }
    }
}
