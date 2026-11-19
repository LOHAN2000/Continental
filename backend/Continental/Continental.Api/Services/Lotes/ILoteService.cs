using Continental.Api.DTOs.Lotes;

namespace Continental.Api.Services.Lotes;

public interface ILoteService
{
    Task<IReadOnlyCollection<LoteResponseDto>>
    GetAllAsync(
        long? idProducto = null,
        bool onlyAvailable = false
    );

    Task<LoteResponseDto?> GetByIdAsync(
        long idLote
    );
}