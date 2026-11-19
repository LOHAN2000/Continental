using Continental.Api.DTOs.Usuarios;

namespace Continental.Api.Services.Usuarios;

public interface IUsuarioService
{
    Task<IReadOnlyCollection<UsuarioResponseDto>>
    GetAllAsync(
        string? search = null,
        bool includeInactive = false
    );

    Task<UsuarioResponseDto?> GetByIdAsync(
        long idUsuario
    );

    Task<IReadOnlyCollection<RolResponseDto>>
    GetRolesAsync();

    Task<UsuarioResult> CreateAsync(
        CreateUsuarioDto request
    );

    Task<UsuarioResult> UpdateAsync(
        long idUsuario,
        UpdateUsuarioDto request
    );

    Task<UsuarioResult> ChangeStatusAsync(
        long idUsuario,
        bool activo,
        long currentUserId
    );

    Task<UsuarioResult> ResetPasswordAsync(
        long idUsuario,
        ResetPasswordDto request
    );
}