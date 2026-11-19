using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Continental.Api.Models.DataModels;

[Table("categorias")]
public class Categoria : BaseEntity
{
    [Key]
    [Column("id_categoria")]
    public long IdCategoria { get; set; }

    [Required]
    [MaxLength(80)]
    [Column("nombre")]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(200)]
    [Column("descripcion")]
    public string? Descripcion { get; set; }

    [Column("activo")]
    public bool Activo { get; set; } = true;

    public ICollection<Producto> Productos { get; set; } =
        new List<Producto>();
}