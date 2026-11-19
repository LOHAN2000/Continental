using System.ComponentModel.DataAnnotations;

namespace Continental.Api.DTOs.Usuarios;

public class CreateUsuarioDto
{
    [Required(ErrorMessage = "El rol es obligatorio.")]
    [Range(
        1,
        long.MaxValue,
        ErrorMessage = "El rol no es válido."
    )]
    public long IdRol { get; set; }

    [Required(ErrorMessage = "Los nombres son obligatorios.")]
    [MaxLength(
        120,
        ErrorMessage =
        "Los nombres no pueden superar 120 caracteres."
    )]
    public string Nombres { get; set; } = string.Empty;

    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(
        ErrorMessage = "El correo no tiene un formato válido."
    )]
    [MaxLength(
        150,
        ErrorMessage =
        "El correo no puede superar 150 caracteres."
    )]
    public string Correo { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [MinLength(
        8,
        ErrorMessage =
        "La contraseña debe contener al menos 8 caracteres."
    )]
    [MaxLength(
        100,
        ErrorMessage =
        "La contraseña no puede superar 100 caracteres."
    )]
    public string Password { get; set; } = string.Empty;
}