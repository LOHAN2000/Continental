using Continental.Api.DTOs.Categorias;

namespace Continental.Api.Services.Categorias;

public interface ICategoriaService
{
    Task<IReadOnlyCollection<CategoriaResponseDto>>
    GetAllAsync(
        bool includeInactive = false
    );

    Task<CategoriaResponseDto?> GetByIdAsync(
        long idCategoria
    );

    Task<CategoriaResult> CreateAsync(
        CreateCategoriaDto request
    );

    Task<CategoriaResult> UpdateAsync(
        long idCategoria,
        UpdateCategoriaDto request
    );

    Task<CategoriaResult> ChangeStatusAsync(
        long idCategoria,
        bool activo
    );
}