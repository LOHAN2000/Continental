using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Continental.Api.Models.DataModels;

[Table("proveedores")]
public class Proveedor : BaseEntity
{
    [Key]
    [Column("id_proveedor")]
    public long IdProveedor { get; set; }

    [Required]
    [MaxLength(20)]
    [Column("documento")]
    public string Documento { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    [Column("razon_social")]
    public string RazonSocial { get; set; } = string.Empty;

    [MaxLength(20)]
    [Column("telefono")]
    public string? Telefono { get; set; }

    [MaxLength(150)]
    [Column("correo")]
    public string? Correo { get; set; }

    [MaxLength(200)]
    [Column("direccion")]
    public string? Direccion { get; set; }

    [Column("activo")]
    public bool Activo { get; set; } = true;

    public ICollection<Compra> Compras { get; set; } =
        new List<Compra>();
}