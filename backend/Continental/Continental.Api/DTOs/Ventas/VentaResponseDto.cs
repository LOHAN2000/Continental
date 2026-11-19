namespace Continental.Api.DTOs.Ventas;

public class VentaResponseDto
{
    public long IdVenta { get; set; }

    public long IdUsuario { get; set; }

    public string Usuario { get; set; } = string.Empty;

    public DateTime Fecha { get; set; }

    public decimal Total { get; set; }

    public decimal CostoHistoricoTotal { get; set; }

    public decimal MargenBrutoEstimado { get; set; }

    public string Estado { get; set; } = string.Empty;

    public string? Observacion { get; set; }

    public IReadOnlyCollection<VentaDetalleResponseDto>
        Detalles { get; set; } =
        Array.Empty<VentaDetalleResponseDto>();
}