using Continental.Api.DTOs.Auth;

namespace Continental.Api.Services.Auth;

public class AuthResult
{
    public bool Success { get; private set; }

    public string Message { get; private set; } = string.Empty;

    public LoginResponseDto? Data { get; private set; }

    public static AuthResult Ok(
        LoginResponseDto data,
        string message = "Inicio de sesión correcto."
    )
    {
        return new AuthResult
        {
            Success = true,
            Message = message,
            Data = data
        };
    }

    public static AuthResult Fail(string message)
    {
        return new AuthResult
        {
            Success = false,
            Message = message,
            Data = null
        };
    }
}