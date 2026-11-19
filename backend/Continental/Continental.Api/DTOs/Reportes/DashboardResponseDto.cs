namespace Continental.Api.DTOs.Reportes;

public class DashboardResponseDto
{
    public DateTime FechaInicio { get; set; }

    public DateTime FechaFin { get; set; }

    public int ProductosActivos { get; set; }

    public int ProductosSinStock { get; set; }

    public int ProductosConStockMinimo { get; set; }

    public int LotesProximosAVencer { get; set; }

    public int AlertasNoLeidas { get; set; }

    public int CantidadVentas { get; set; }

    public decimal IngresosPorVentas { get; set; }

    public decimal CostoHistoricoVendido { get; set; }

    public decimal MargenBrutoEstimado { get; set; }

    public decimal ValorInventarioCosto { get; set; }

    public decimal ValorInventarioVenta { get; set; }

    public IReadOnlyCollection<ProductoCriticoDto>
        ProductosCriticos { get; set; } =
        Array.Empty<ProductoCriticoDto>();

    public IReadOnlyCollection<VentaRecienteDto>
        VentasRecientes { get; set; } =
        Array.Empty<VentaRecienteDto>();
}