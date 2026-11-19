using System.ComponentModel.DataAnnotations;

namespace Continental.Api.DTOs.Compras;

public class CreateCompraDto
{
    [Range(
        1,
        long.MaxValue,
        ErrorMessage = "El proveedor no es válido."
    )]
    public long IdProveedor { get; set; }

    [MaxLength(
        250,
        ErrorMessage =
        "La observación no puede superar 250 caracteres."
    )]
    public string? Observacion { get; set; }

    [Required(
        ErrorMessage =
        "La compra debe contener productos."
    )]
    [MinLength(
        1,
        ErrorMessage =
        "La compra debe contener al menos un producto."
    )]
    public List<CreateCompraDetalleDto> Detalles
    { get; set; } = new();
}