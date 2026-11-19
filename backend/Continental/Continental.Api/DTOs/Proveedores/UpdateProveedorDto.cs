using System.ComponentModel.DataAnnotations;

namespace Continental.Api.DTOs.Proveedores;

public class UpdateProveedorDto
{
    [Required(ErrorMessage = "El documento es obligatorio.")]
    [MaxLength(
        20,
        ErrorMessage =
        "El documento no puede superar 20 caracteres."
    )]
    public string Documento { get; set; } = string.Empty;

    [Required(ErrorMessage = "La razón social es obligatoria.")]
    [MaxLength(
        150,
        ErrorMessage =
        "La razón social no puede superar 150 caracteres."
    )]
    public string RazonSocial { get; set; } = string.Empty;

    [MaxLength(
        20,
        ErrorMessage =
        "El teléfono no puede superar 20 caracteres."
    )]
    public string? Telefono { get; set; }

    [EmailAddress(
        ErrorMessage = "El correo no tiene un formato válido."
    )]
    [MaxLength(
        150,
        ErrorMessage =
        "El correo no puede superar 150 caracteres."
    )]
    public string? Correo { get; set; }

    [MaxLength(
        200,
        ErrorMessage =
        "La dirección no puede superar 200 caracteres."
    )]
    public string? Direccion { get; set; }
}