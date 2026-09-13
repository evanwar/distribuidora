using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Distribuidora.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PosProductDiscovery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:pg_trgm", ",,");

            // Expression indexes match the case-insensitive search predicates.
            migrationBuilder.Sql("""
                CREATE INDEX ix_pos_products_name ON catalogs.products USING gin (lower("Name") gin_trgm_ops) WHERE "Active" AND NOT "IsDeleted";
                CREATE INDEX ix_pos_products_sku ON catalogs.products USING gin (lower("Sku") gin_trgm_ops) WHERE "Active" AND NOT "IsDeleted";
                CREATE INDEX ix_pos_aliases_name ON catalogs.product_aliases USING gin (lower("Alias") gin_trgm_ops) WHERE "Active" AND NOT "IsDeleted";
                CREATE INDEX ix_pos_categories_name ON catalogs.categories USING gin (lower("Name") gin_trgm_ops) WHERE "Active" AND NOT "IsDeleted";
                CREATE INDEX ix_pos_brands_name ON catalogs.brands USING gin (lower("Name") gin_trgm_ops) WHERE "Active" AND NOT "IsDeleted";
                CREATE INDEX ix_pos_sales_frequency ON sales.counter_sales ("SourceWarehouseId", "SaleDate", "Id") WHERE "Status" = 1 AND NOT "IsDeleted";
                """);

            migrationBuilder.CreateTable(
                name: "product_favorites",
                schema: "catalogs",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_favorites", x => new { x.UserId, x.ProductId });
                    table.ForeignKey(
                        name: "FK_product_favorites_products_ProductId",
                        column: x => x.ProductId,
                        principalSchema: "catalogs",
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_product_favorites_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "security",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_product_favorites_ProductId",
                schema: "catalogs",
                table: "product_favorites",
                column: "ProductId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP INDEX IF EXISTS catalogs.ix_pos_products_name;
                DROP INDEX IF EXISTS catalogs.ix_pos_products_sku;
                DROP INDEX IF EXISTS catalogs.ix_pos_aliases_name;
                DROP INDEX IF EXISTS catalogs.ix_pos_categories_name;
                DROP INDEX IF EXISTS catalogs.ix_pos_brands_name;
                DROP INDEX IF EXISTS sales.ix_pos_sales_frequency;
                """);
            migrationBuilder.DropTable(
                name: "product_favorites",
                schema: "catalogs");

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:PostgresExtension:pg_trgm", ",,");
        }
    }
}
