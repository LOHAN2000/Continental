using Continental.Api.DTOs.Proveedores;

namespace Continental.Api.Services.Proveedores;

public interface IProveedorService
{
    Task<IReadOnlyCollection<ProveedorResponseDto>>
    GetAllAsync(
        string? search = null,
        bool includeInactive = false
    );

    Task<ProveedorResponseDto?> GetByIdAsync(
        long idProveedor
    );

    Task<ProveedorResult> CreateAsync(
        CreateProveedorDto request
    );

    Task<ProveedorResult> UpdateAsync(
        long idProveedor,
        UpdateProveedorDto request
    );

    Task<ProveedorResult> ChangeStatusAsync(
        long idProveedor,
        bool activo
    );
}