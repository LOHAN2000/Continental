using System.ComponentModel.DataAnnotations;

namespace Continental.Api.DTOs.Ventas;

public class CreateVentaDto
{
    [MaxLength(
        250,
        ErrorMessage =
        "La observación no puede superar 250 caracteres."
    )]
    public string? Observacion { get; set; }

    [Required(
        ErrorMessage =
        "La venta debe contener productos."
    )]
    [MinLength(
        1,
        ErrorMessage =
        "La venta debe contener al menos un producto."
    )]
    public List<CreateVentaDetalleDto> Detalles
    { get; set; } = new();
}