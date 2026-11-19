using Continental.Api.DTOs.Ajustes;

namespace Continental.Api.Services.Ajustes;

public interface IAjusteInventarioService
{
    Task<AjusteInventarioResult> CreateAsync(
        CreateAjusteInventarioDto request,
        long idUsuario
    );

    Task<IReadOnlyCollection<AjusteInventarioResponseDto>>
    GetAllAsync(
        long? idProducto = null,
        int limit = 50
    );
}