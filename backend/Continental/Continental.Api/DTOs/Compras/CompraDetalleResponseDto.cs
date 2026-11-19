namespace Continental.Api.DTOs.Compras;

public class CompraDetalleResponseDto
{
    public long IdCompraDetalle { get; set; }

    public long IdProducto { get; set; }

    public string Producto { get; set; } = string.Empty;

    public string CodigoBarras { get; set; } = string.Empty;

    public decimal Cantidad { get; set; }

    public decimal CostoUnitario { get; set; }

    public decimal Subtotal { get; set; }
}