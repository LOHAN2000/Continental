namespace Continental.Api.DTOs.Ajustes;

public class AjusteInventarioResponseDto
{
    public long IdMovimiento { get; set; }

    public long IdProducto { get; set; }

    public string Producto { get; set; } = string.Empty;

    public string CodigoBarras { get; set; } = string.Empty;

    public long IdUsuario { get; set; }

    public string Usuario { get; set; } = string.Empty;

    public string Tipo { get; set; } = string.Empty;

    public decimal Cantidad { get; set; }

    public decimal StockAnterior { get; set; }

    public decimal StockActual { get; set; }

    public string Motivo { get; set; } = string.Empty;

    public DateTime Fecha { get; set; }
}