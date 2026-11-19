using Continental.Api.DTOs.Reportes;

namespace Continental.Api.Services.Reportes;

public interface IReporteService
{
    Task<DashboardResponseDto> GetDashboardAsync(
        DateTime? fechaInicio = null,
        DateTime? fechaFin = null
    );

    Task<BalanceFinancieroDto> GetBalanceAsync(
        DateTime fechaInicio,
        DateTime fechaFin
    );

    Task<IReadOnlyCollection<ProductoMasVendidoDto>>
    GetTopProductsAsync(
        DateTime fechaInicio,
        DateTime fechaFin,
        int limit = 10
    );
}