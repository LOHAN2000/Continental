using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Continental.Api.Models.DataModels;

[Table("usuarios")]
public class Usuario : BaseEntity
{
    [Key]
    [Column("id_usuario")]
    public long IdUsuario { get; set; }

    [Required]
    [Column("id_rol")]
    public long IdRol { get; set; }

    [Required]
    [MaxLength(120)]
    [Column("nombres")]
    public string Nombres { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    [Column("correo")]
    public string Correo { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [Column("password_hash")]
    public string PasswordHash { get; set; } = string.Empty;

    [Column("activo")]
    public bool Activo { get; set; } = true;

    [ForeignKey(nameof(IdRol))]
    public Rol Rol { get; set; } = null!;
}