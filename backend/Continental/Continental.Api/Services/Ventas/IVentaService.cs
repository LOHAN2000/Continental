using Continental.Api.DTOs.Ventas;

namespace Continental.Api.Services.Ventas;

public interface IVentaService
{
    Task<IReadOnlyCollection<VentaResponseDto>>
    GetAllAsync(
        DateTime? fechaInicio = null,
        DateTime? fechaFin = null
    );

    Task<VentaResponseDto?> GetByIdAsync(
        long idVenta
    );

    Task<VentaResult> CreateAsync(
        CreateVentaDto request,
        long idUsuario
    );
}