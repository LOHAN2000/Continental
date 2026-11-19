using System.ComponentModel.DataAnnotations;

namespace Continental.Api.DTOs.Ajustes;

public class CreateAjusteInventarioDto
{
    [Range(
        1,
        long.MaxValue,
        ErrorMessage = "El producto no es válido."
    )]
    public long IdProducto { get; set; }

    [Required(ErrorMessage = "El tipo de ajuste es obligatorio.")]
    public string Tipo { get; set; } = string.Empty;

    [Range(
        0.01,
        9999999999.99,
        ErrorMessage = "La cantidad debe ser mayor que cero."
    )]
    public decimal Cantidad { get; set; }

    [Required(ErrorMessage = "El motivo es obligatorio.")]
    [MaxLength(
        250,
        ErrorMessage = "El motivo no puede superar 250 caracteres."
    )]
    public string Motivo { get; set; } = string.Empty;
}