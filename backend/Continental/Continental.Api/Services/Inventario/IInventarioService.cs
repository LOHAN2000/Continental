using Continental.Api.DTOs.Inventario;

namespace Continental.Api.Services.Inventario;

public interface IInventarioService
{
    Task<IReadOnlyCollection<InventarioResponseDto>>
    GetInventoryAsync(
        string? search = null,
        long? idCategoria = null,
        string? estado = null,
        bool includeInactive = false
    );

    Task<KardexProductoDto?> GetKardexAsync(
        long idProducto,
        DateTime? fechaInicio = null,
        DateTime? fechaFin = null
    );

    Task<IReadOnlyCollection<MovimientoInventarioResponseDto>>
    GetRecentMovementsAsync(
        int limit = 20
    );

    Task<ResumenInventarioDto>
    GetSummaryAsync();
}