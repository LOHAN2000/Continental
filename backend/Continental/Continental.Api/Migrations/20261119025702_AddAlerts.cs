using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Continental.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAlerts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "alertas",
                columns: table => new
                {
                    id_alerta = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    id_producto = table.Column<long>(type: "bigint", nullable: false),
                    id_lote = table.Column<long>(type: "bigint", nullable: true),
                    tipo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    mensaje = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    leida = table.Column<bool>(type: "boolean", nullable: false),
                    activa = table.Column<bool>(type: "boolean", nullable: false),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    actualizado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_alertas", x => x.id_alerta);
                    table.ForeignKey(
                        name: "FK_alertas_lotes_id_lote",
                        column: x => x.id_lote,
                        principalTable: "lotes",
                        principalColumn: "id_lote",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_alertas_productos_id_producto",
                        column: x => x.id_producto,
                        principalTable: "productos",
                        principalColumn: "id_producto",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_alertas_activa_leida",
                table: "alertas",
                columns: new[] { "activa", "leida" });

            migrationBuilder.CreateIndex(
                name: "IX_alertas_id_lote",
                table: "alertas",
                column: "id_lote");

            migrationBuilder.CreateIndex(
                name: "IX_alertas_id_producto",
                table: "alertas",
                column: "id_producto");

            migrationBuilder.CreateIndex(
                name: "IX_alertas_tipo",
                table: "alertas",
                column: "tipo");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "alertas");
        }
    }
}
