using System.ComponentModel.DataAnnotations;

namespace Continental.Api.DTOs.Productos;

public class UpdateProductoDto
{
    [Required(ErrorMessage = "La categoría es obligatoria.")]
    [Range(
        1,
        long.MaxValue,
        ErrorMessage = "La categoría no es válida."
    )]
    public long IdCategoria { get; set; }

    [Required(ErrorMessage = "El código de barras es obligatorio.")]
    [MaxLength(
        50,
        ErrorMessage =
        "El código de barras no puede superar 50 caracteres."
    )]
    public string CodigoBarras { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(
        150,
        ErrorMessage = "El nombre no puede superar 150 caracteres."
    )]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(
        250,
        ErrorMessage =
        "La descripción no puede superar 250 caracteres."
    )]
    public string? Descripcion { get; set; }

    [Range(
        0,
        9999999999.99,
        ErrorMessage =
        "El precio de compra debe ser mayor o igual a cero."
    )]
    public decimal PrecioCompra { get; set; }

    [Range(
        0,
        9999999999.99,
        ErrorMessage =
        "El precio de venta debe ser mayor o igual a cero."
    )]
    public decimal PrecioVenta { get; set; }

    [Range(
        0,
        9999999999.99,
        ErrorMessage =
        "El stock mínimo debe ser mayor o igual a cero."
    )]
    public decimal StockMinimo { get; set; }

    public bool ControlaVencimiento { get; set; }
}