using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Distribuidora.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentTerminalManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PaymentTerminalId",
                schema: "sales",
                table: "point_payments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "payment_terminals",
                schema: "admin",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ExternalId = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    RowVersion = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payment_terminals", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_point_payments_PaymentTerminalId",
                schema: "sales",
                table: "point_payments",
                column: "PaymentTerminalId");

            migrationBuilder.CreateIndex(
                name: "IX_payment_terminals_Active_Name",
                schema: "admin",
                table: "payment_terminals",
                columns: new[] { "Active", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_payment_terminals_Provider_ExternalId",
                schema: "admin",
                table: "payment_terminals",
                columns: new[] { "Provider", "ExternalId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_payment_terminals_Provider_IsDefault",
                schema: "admin",
                table: "payment_terminals",
                columns: new[] { "Provider", "IsDefault" },
                unique: true,
                filter: "\"IsDefault\" = TRUE");

            migrationBuilder.AddForeignKey(
                name: "FK_point_payments_payment_terminals_PaymentTerminalId",
                schema: "sales",
                table: "point_payments",
                column: "PaymentTerminalId",
                principalSchema: "admin",
                principalTable: "payment_terminals",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_point_payments_payment_terminals_PaymentTerminalId",
                schema: "sales",
                table: "point_payments");

            migrationBuilder.DropTable(
                name: "payment_terminals",
                schema: "admin");

            migrationBuilder.DropIndex(
                name: "IX_point_payments_PaymentTerminalId",
                schema: "sales",
                table: "point_payments");

            migrationBuilder.DropColumn(
                name: "PaymentTerminalId",
                schema: "sales",
                table: "point_payments");
        }
    }
}
