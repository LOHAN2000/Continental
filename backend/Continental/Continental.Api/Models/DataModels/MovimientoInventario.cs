using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Continental.Api.Models.DataModels;

[Table("movimientos_inventario")]
public class MovimientoInventario : BaseEntity
{
    [Key]
    [Column("id_movimiento")]
    public long IdMovimiento { get; set; }

    [Required]
    [Column("id_producto")]
    public long IdProducto { get; set; }

    [Required]
    [Column("id_usuario")]
    public long IdUsuario { get; set; }

    [Required]
    [MaxLength(20)]
    [Column("tipo")]
    public string Tipo { get; set; } = string.Empty;

    [Column("referencia_id")]
    public long? ReferenciaId { get; set; }

    [Column("entrada", TypeName = "numeric(12,2)")]
    public decimal Entrada { get; set; }

    [Column("salida", TypeName = "numeric(12,2)")]
    public decimal Salida { get; set; }

    [Column("saldo", TypeName = "numeric(12,2)")]
    public decimal Saldo { get; set; }

    [MaxLength(250)]
    [Column("motivo")]
    public string? Motivo { get; set; }

    [Column("fecha")]
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(IdProducto))]
    public Producto Producto { get; set; } = null!;

    [ForeignKey(nameof(IdUsuario))]
    public Usuario Usuario { get; set; } = null!;
}