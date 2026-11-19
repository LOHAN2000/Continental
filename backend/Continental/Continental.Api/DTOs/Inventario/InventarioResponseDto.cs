namespace Continental.Api.DTOs.Inventario;

public class InventarioResponseDto
{
    public long IdProducto { get; set; }

    public string CodigoBarras { get; set; } = string.Empty;

    public string Producto { get; set; } = string.Empty;

    public long IdCategoria { get; set; }

    public string Categoria { get; set; } = string.Empty;

    public decimal StockActual { get; set; }

    public decimal StockMinimo { get; set; }

    public string EstadoStock { get; set; } = string.Empty;

    public bool ControlaVencimiento { get; set; }

    public decimal CantidadEnLotes { get; set; }

    public DateOnly? ProximoVencimiento { get; set; }

    public bool Activo { get; set; }
}