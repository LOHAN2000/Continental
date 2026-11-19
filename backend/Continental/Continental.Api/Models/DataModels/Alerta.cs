using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Continental.Api.Models.DataModels;

[Table("alertas")]
public class Alerta : BaseEntity
{
    [Key]
    [Column("id_alerta")]
    public long IdAlerta { get; set; }

    [Required]
    [Column("id_producto")]
    public long IdProducto { get; set; }

    [Column("id_lote")]
    public long? IdLote { get; set; }

    [Required]
    [MaxLength(30)]
    [Column("tipo")]
    public string Tipo { get; set; } = string.Empty;

    [Required]
    [MaxLength(300)]
    [Column("mensaje")]
    public string Mensaje { get; set; } = string.Empty;

    [Column("leida")]
    public bool Leida { get; set; }

    [Column("activa")]
    public bool Activa { get; set; } = true;

    [ForeignKey(nameof(IdProducto))]
    public Producto Producto { get; set; } = null!;

    [ForeignKey(nameof(IdLote))]
    public Lote? Lote { get; set; }
}