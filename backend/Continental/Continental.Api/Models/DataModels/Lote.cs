using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Continental.Api.Models.DataModels;

[Table("lotes")]
public class Lote : BaseEntity
{
    [Key]
    [Column("id_lote")]
    public long IdLote { get; set; }

    [Required]
    [Column("id_producto")]
    public long IdProducto { get; set; }

    [Column("id_compra_detalle")]
    public long? IdCompraDetalle { get; set; }

    [Required]
    [MaxLength(60)]
    [Column("codigo_lote")]
    public string CodigoLote { get; set; } = string.Empty;

    [Column(
        "cantidad_inicial",
        TypeName = "numeric(12,2)"
    )]
    public decimal CantidadInicial { get; set; }

    [Column(
        "cantidad_disponible",
        TypeName = "numeric(12,2)"
    )]
    public decimal CantidadDisponible { get; set; }

    [Column("fecha_vencimiento")]
    public DateOnly FechaVencimiento { get; set; }

    [Column("activo")]
    public bool Activo { get; set; } = true;

    [ForeignKey(nameof(IdProducto))]
    public Producto Producto { get; set; } = null!;

    [ForeignKey(nameof(IdCompraDetalle))]
    public CompraDetalle? CompraDetalle { get; set; }
}