using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Continental.Api.Migrations
{
    /// <inheritdoc />
    public partial class PreventDuplicateActiveAlerts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DELETE FROM alertas
                WHERE id_alerta IN
                (
                    SELECT id_alerta
                    FROM
                    (
                        SELECT
                            id_alerta,
                            ROW_NUMBER() OVER
                            (
                                PARTITION BY
                                    id_producto,
                                    id_lote,
                                    tipo
                                ORDER BY id_alerta
                            ) AS numero
                        FROM alertas
                        WHERE activa = TRUE
                    ) duplicadas
                    WHERE numero > 1
                );
                """
            );

            migrationBuilder.DropIndex(
                name: "IX_alertas_id_producto",
                table: "alertas");

            migrationBuilder.CreateIndex(
                name: "IX_alertas_id_producto_id_lote_tipo",
                table: "alertas",
                columns: new[] { "id_producto", "id_lote", "tipo" },
                unique: true,
                filter: "\"activa\" = TRUE AND \"id_lote\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_alertas_id_producto_tipo",
                table: "alertas",
                columns: new[] { "id_producto", "tipo" },
                unique: true,
                filter: "\"activa\" = TRUE AND \"id_lote\" IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_alertas_id_producto_id_lote_tipo",
                table: "alertas");

            migrationBuilder.DropIndex(
                name: "IX_alertas_id_producto_tipo",
                table: "alertas");

            migrationBuilder.CreateIndex(
                name: "IX_alertas_id_producto",
                table: "alertas",
                column: "id_producto");
        }
    }
}
