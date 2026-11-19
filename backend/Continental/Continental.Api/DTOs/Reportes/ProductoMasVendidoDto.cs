namespace Continental.Api.DTOs.Reportes;

public class ProductoMasVendidoDto
{
    public long IdProducto { get; set; }

    public string Producto { get; set; } = string.Empty;

    public string CodigoBarras { get; set; } = string.Empty;

    public decimal CantidadVendida { get; set; }

    public decimal ImporteVendido { get; set; }
}