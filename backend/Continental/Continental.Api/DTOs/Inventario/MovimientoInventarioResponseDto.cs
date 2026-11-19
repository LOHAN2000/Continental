namespace Continental.Api.DTOs.Inventario;

public class MovimientoInventarioResponseDto
{
    public long IdMovimiento { get; set; }

    public long IdProducto { get; set; }

    public string Producto { get; set; } = string.Empty;

    public string CodigoBarras { get; set; } = string.Empty;

    public long IdUsuario { get; set; }

    public string Usuario { get; set; } = string.Empty;

    public string Tipo { get; set; } = string.Empty;

    public long? ReferenciaId { get; set; }

    public decimal Entrada { get; set; }

    public decimal Salida { get; set; }

    public decimal Saldo { get; set; }

    public string? Motivo { get; set; }

    public DateTime Fecha { get; set; }
}