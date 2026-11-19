using System.ComponentModel.DataAnnotations;

namespace Continental.Api.DTOs.Usuarios;

public class ResetPasswordDto
{
    [Required(
        ErrorMessage = "La nueva contraseña es obligatoria."
    )]
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
    public string NuevaPassword { get; set; } = string.Empty;
}