using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Continental.Api.Models.DataModels;

[Table("productos")]
public class Producto : BaseEntity
{
    [Key]
    [Column("id_producto")]
    public long IdProducto { get; set; }

    [Required]
    [Column("id_categoria")]
    public long IdCategoria { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("codigo_barras")]
    public string CodigoBarras { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    [Column("nombre")]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(250)]
    [Column("descripcion")]
    public string? Descripcion { get; set; }

    [Column("precio_compra", TypeName = "numeric(12,2)")]
    public decimal PrecioCompra { get; set; }

    [Column("precio_venta", TypeName = "numeric(12,2)")]
    public decimal PrecioVenta { get; set; }

    [Column("stock_actual", TypeName = "numeric(12,2)")]
    public decimal StockActual { get; set; } = 0;

    [Column("stock_minimo", TypeName = "numeric(12,2)")]
    public decimal StockMinimo { get; set; } = 0;

    [Column("controla_vencimiento")]
    public bool ControlaVencimiento { get; set; }

    [Column("activo")]
    public bool Activo { get; set; } = true;

    [ForeignKey(nameof(IdCategoria))]
    public Categoria Categoria { get; set; } = null!;

    public ICollection<CompraDetalle> CompraDetalles { get; set; } =
        new List<CompraDetalle>();

    public ICollection<MovimientoInventario> MovimientosInventario
        { get; set; } = new List<MovimientoInventario>();

    public ICollection<Lote> Lotes { get; set; } =
        new List<Lote>();

    public ICollection<VentaDetalle> VentaDetalles { get; set; } =
        new List<VentaDetalle>();

    public ICollection<Alerta> Alertas { get; set; } =
        new List<Alerta>();
}