namespace Continental.Api.DTOs.Lotes;

public class LoteResponseDto
{
    public long IdLote { get; set; }

    public long IdProducto { get; set; }

    public string Producto { get; set; } = string.Empty;

    public string CodigoBarras { get; set; } = string.Empty;

    public string CodigoLote { get; set; } = string.Empty;

    public decimal CantidadInicial { get; set; }

    public decimal CantidadDisponible { get; set; }

    public DateOnly FechaVencimiento { get; set; }

    public int DiasParaVencer { get; set; }

    public string Estado { get; set; } = string.Empty;

    public bool Activo { get; set; }
}