using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Continental.Api.Models.DataModels;

[Table("venta_detalles")]
public class VentaDetalle : BaseEntity
{
    [Key]
    [Column("id_venta_detalle")]
    public long IdVentaDetalle { get; set; }

    [Required]
    [Column("id_venta")]
    public long IdVenta { get; set; }

    [Required]
    [Column("id_producto")]
    public long IdProducto { get; set; }

    [Column("id_lote")]
    public long? IdLote { get; set; }

    [Column("cantidad", TypeName = "numeric(12,2)")]
    public decimal Cantidad { get; set; }

    [Column("precio_unitario", TypeName = "numeric(12,2)")]
    public decimal PrecioUnitario { get; set; }

    [Column(
        "costo_historico_unitario",
        TypeName = "numeric(12,2)"
    )]
    public decimal CostoHistoricoUnitario { get; set; }

    [Column("subtotal", TypeName = "numeric(12,2)")]
    public decimal Subtotal { get; set; }

    [ForeignKey(nameof(IdVenta))]
    public Venta Venta { get; set; } = null!;

    [ForeignKey(nameof(IdProducto))]
    public Producto Producto { get; set; } = null!;

    [ForeignKey(nameof(IdLote))]
    public Lote? Lote { get; set; }
}