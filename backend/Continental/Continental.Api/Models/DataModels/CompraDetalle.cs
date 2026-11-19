using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Continental.Api.Models.DataModels;

[Table("compra_detalles")]
public class CompraDetalle : BaseEntity
{
    [Key]
    [Column("id_compra_detalle")]
    public long IdCompraDetalle { get; set; }

    [Required]
    [Column("id_compra")]
    public long IdCompra { get; set; }

    [Required]
    [Column("id_producto")]
    public long IdProducto { get; set; }

    [Column("cantidad", TypeName = "numeric(12,2)")]
    public decimal Cantidad { get; set; }

    [Column("costo_unitario", TypeName = "numeric(12,2)")]
    public decimal CostoUnitario { get; set; }

    [Column("subtotal", TypeName = "numeric(12,2)")]
    public decimal Subtotal { get; set; }

    [ForeignKey(nameof(IdCompra))]
    public Compra Compra { get; set; } = null!;

    [ForeignKey(nameof(IdProducto))]
    public Producto Producto { get; set; } = null!;
}