namespace Continental.Api.DTOs.Compras;

public class CompraResponseDto
{
    public long IdCompra { get; set; }

    public long IdProveedor { get; set; }

    public string Proveedor { get; set; } = string.Empty;

    public long IdUsuario { get; set; }

    public string Usuario { get; set; } = string.Empty;

    public DateTime Fecha { get; set; }

    public decimal Total { get; set; }

    public string Estado { get; set; } = string.Empty;

    public string? Observacion { get; set; }

    public IReadOnlyCollection<CompraDetalleResponseDto>
        Detalles { get; set; } =
        Array.Empty<CompraDetalleResponseDto>();
}