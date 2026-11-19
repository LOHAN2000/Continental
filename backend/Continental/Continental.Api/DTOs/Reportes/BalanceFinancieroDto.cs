namespace Continental.Api.DTOs.Reportes;

public class BalanceFinancieroDto
{
    public DateTime FechaInicio { get; set; }

    public DateTime FechaFin { get; set; }

    public int CantidadVentas { get; set; }

    public decimal IngresosPorVentas { get; set; }

    public decimal CostoHistoricoVendido { get; set; }

    public decimal MargenBrutoEstimado { get; set; }

    public decimal PorcentajeMargenBruto { get; set; }

    public IReadOnlyCollection<BalanceProductoDto>
        Productos { get; set; } =
        Array.Empty<BalanceProductoDto>();
}