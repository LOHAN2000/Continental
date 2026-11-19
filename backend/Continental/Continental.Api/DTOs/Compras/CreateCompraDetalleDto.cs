using System.ComponentModel.DataAnnotations;

namespace Continental.Api.DTOs.Compras;

public class CreateCompraDetalleDto
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

    [Range(
        0,
        9999999999.99,
        ErrorMessage =
        "El costo unitario debe ser mayor o igual a cero."
    )]
    public decimal CostoUnitario { get; set; }
}