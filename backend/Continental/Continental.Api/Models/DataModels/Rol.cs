using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Continental.Api.Models.DataModels;

[Table("roles")]
public class Rol : BaseEntity
{
    [Key]
    [Column("id_rol")]
    public long IdRol { get; set; }

    [Required]
    [MaxLength(40)]
    [Column("nombre")]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(150)]
    [Column("descripcion")]
    public string? Descripcion { get; set; }

    [Column("activo")]
    public bool Activo { get; set; } = true;

    public ICollection<Usuario> Usuarios { get; set; } =
        new List<Usuario>();
}