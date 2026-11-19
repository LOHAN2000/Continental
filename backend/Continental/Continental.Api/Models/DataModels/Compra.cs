using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Continental.Api.Models.DataModels;

[Table("compras")]
public class Compra : BaseEntity
{
    [Key]
    [Column("id_compra")]
    public long IdCompra { get; set; }

    [Required]
    [Column("id_proveedor")]
    public long IdProveedor { get; set; }

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

    [ForeignKey(nameof(IdProveedor))]
    public Proveedor Proveedor { get; set; } = null!;

    [ForeignKey(nameof(IdUsuario))]
    public Usuario Usuario { get; set; } = null!;

    public ICollection<CompraDetalle> Detalles { get; set; } =
        new List<CompraDetalle>();
}