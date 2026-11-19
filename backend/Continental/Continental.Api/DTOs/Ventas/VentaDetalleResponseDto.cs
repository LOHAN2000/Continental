namespace Continental.Api.DTOs.Ventas;

public class VentaDetalleResponseDto
{
    public long IdVentaDetalle { get; set; }

    public long IdProducto { get; set; }

    public string Producto { get; set; } = string.Empty;

    public string CodigoBarras { get; set; } = string.Empty;

    public long? IdLote { get; set; }

    public string? CodigoLote { get; set; }

    public decimal Cantidad { get; set; }

    public decimal PrecioUnitario { get; set; }

    public decimal CostoHistoricoUnitario { get; set; }

    public decimal Subtotal { get; set; }

    public decimal CostoHistoricoTotal { get; set; }

    public decimal MargenBrutoEstimado { get; set; }
}