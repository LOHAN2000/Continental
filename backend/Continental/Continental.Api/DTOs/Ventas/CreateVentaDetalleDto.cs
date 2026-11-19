using System.ComponentModel.DataAnnotations;

namespace Continental.Api.DTOs.Ventas;

public class CreateVentaDetalleDto
{
    [Range(
        1,
        long.MaxValue,
        ErrorMessage = "El producto no es válido."
    )]
    public long IdProducto { get; set; }

    [Range(
        0.01,
        9999999999.99,
        ErrorMessage = "La cantidad debe ser mayor que cero."
    )]
    public decimal Cantidad { get; set; }
}