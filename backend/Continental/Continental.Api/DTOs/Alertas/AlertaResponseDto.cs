namespace Continental.Api.DTOs.Alertas;

public class AlertaResponseDto
{
    public long IdAlerta { get; set; }

    public long IdProducto { get; set; }

    public string Producto { get; set; } = string.Empty;

    public string CodigoBarras { get; set; } = string.Empty;

    public long? IdLote { get; set; }

    public string? CodigoLote { get; set; }

    public string Tipo { get; set; } = string.Empty;

    public string Mensaje { get; set; } = string.Empty;

    public decimal StockActual { get; set; }

    public decimal StockMinimo { get; set; }

    public DateOnly? FechaVencimiento { get; set; }

    public bool Leida { get; set; }

    public bool Activa { get; set; }

    public DateTime CreatedAt { get; set; }
}