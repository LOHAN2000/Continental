using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Continental.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProductBatches : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "lotes",
                columns: table => new
                {
                    id_lote = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_producto = table.Column<long>(type: "bigint", nullable: false),
                    id_compra_detalle = table.Column<long>(type: "bigint", nullable: true),
                    codigo_lote = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    cantidad_inicial = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    cantidad_disponible = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    fecha_vencimiento = table.Column<DateOnly>(type: "date", nullable: false),
                    activo = table.Column<bool>(type: "boolean", nullable: false),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    actualizado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lotes", x => x.id_lote);
                    table.ForeignKey(
                        name: "FK_lotes_compra_detalles_id_compra_detalle",
                        column: x => x.id_compra_detalle,
                        principalTable: "compra_detalles",
                        principalColumn: "id_compra_detalle",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_lotes_productos_id_producto",
                        column: x => x.id_producto,
                        principalTable: "productos",
                        principalColumn: "id_producto",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_lotes_fecha_vencimiento",
                table: "lotes",
                column: "fecha_vencimiento");

            migrationBuilder.CreateIndex(
                name: "IX_lotes_id_compra_detalle",
                table: "lotes",
                column: "id_compra_detalle");

            migrationBuilder.CreateIndex(
                name: "IX_lotes_id_producto_codigo_lote",
                table: "lotes",
                columns: new[] { "id_producto", "codigo_lote" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "lotes");
        }
    }
}
