namespace Continental.Api.DTOs.Usuarios;

public class UsuarioResponseDto
{
    public long IdUsuario { get; set; }

    public long IdRol { get; set; }

    public string Rol { get; set; } = string.Empty;

    public string Nombres { get; set; } = string.Empty;

    public string Correo { get; set; } = string.Empty;

    public bool Activo { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}