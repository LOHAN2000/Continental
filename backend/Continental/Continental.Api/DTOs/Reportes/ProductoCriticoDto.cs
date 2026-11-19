namespace Continental.Api.DTOs.Reportes;

public class ProductoCriticoDto
{
    public long IdProducto { get; set; }

    public string CodigoBarras { get; set; } = string.Empty;

    public string Producto { get; set; } = string.Empty;

    public decimal StockActual { get; set; }

    public decimal StockMinimo { get; set; }

    public string Estado { get; set; } = string.Empty;
}