namespace Continental.Api.DTOs.Auth;

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;

    public DateTime Expiration { get; set; }

    public UserSessionDto Usuario { get; set; } = new();
}

public class UserSessionDto
{
    public long IdUsuario { get; set; }

    public string Nombres { get; set; } = string.Empty;

    public string Correo { get; set; } = string.Empty;

    public string Rol { get; set; } = string.Empty;
}