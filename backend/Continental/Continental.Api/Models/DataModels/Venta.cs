using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Continental.Api.Models.DataModels;

[Table("ventas")]
public class Venta : BaseEntity
{
    [Key]
    [Column("id_venta")]
    public long IdVenta { get; set; }

    [Required]
    [Column("id_usuario")]
    public long IdUsuario { get; set; }

    [Column("fecha")]
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    [Column("total", TypeName = "numeric(12,2)")]
    public decimal Total { get; set; }

    [Required]
    [MaxLength(20)]
    [Column("estado")]
    public string Estado { get; set; } = "REGISTRADA";

    [MaxLength(250)]
    [Column("observacion")]
    public string? Observacion { get; set; }

    [ForeignKey(nameof(IdUsuario))]
    public Usuario Usuario { get; set; } = null!;

    public ICollection<VentaDetalle> Detalles { get; set; } =
        new List<VentaDetalle>();
}