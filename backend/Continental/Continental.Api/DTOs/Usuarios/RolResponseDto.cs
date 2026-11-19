namespace Continental.Api.DTOs.Usuarios;

public class RolResponseDto
{
    public long IdRol { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public bool Activo { get; set; }
}