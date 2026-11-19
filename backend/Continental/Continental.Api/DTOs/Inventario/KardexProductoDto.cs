namespace Continental.Api.DTOs.Inventario;

public class KardexProductoDto
{
    public long IdProducto { get; set; }

    public string CodigoBarras { get; set; } = string.Empty;

    public string Producto { get; set; } = string.Empty;

    public decimal StockActual { get; set; }

    public IReadOnlyCollection<MovimientoInventarioResponseDto>
        Movimientos { get; set; } =
        Array.Empty<MovimientoInventarioResponseDto>();
}