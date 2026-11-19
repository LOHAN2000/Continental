namespace Continental.Api.DTOs.Productos;

public class ProductoResponseDto
{
    public long IdProducto { get; set; }

    public long IdCategoria { get; set; }

    public string Categoria { get; set; } = string.Empty;

    public string CodigoBarras { get; set; } = string.Empty;

    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public decimal PrecioCompra { get; set; }

    public decimal PrecioVenta { get; set; }

    public decimal StockActual { get; set; }

    public decimal StockMinimo { get; set; }

    public bool ControlaVencimiento { get; set; }

    public bool Activo { get; set; }

    public string EstadoStock { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}