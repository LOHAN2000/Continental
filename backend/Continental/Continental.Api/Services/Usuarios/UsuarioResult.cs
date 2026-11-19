using Continental.Api.DTOs.Usuarios;

namespace Continental.Api.Services.Usuarios;

public enum UsuarioError
{
    None,
    NotFound,
    DuplicateEmail,
    InvalidRole,
    LastActiveOwner,
    InvalidPassword
}

public class UsuarioResult
{
    public bool Success { get; private set; }

    public string Message { get; private set; } = string.Empty;

    public UsuarioError Error { get; private set; }

    public UsuarioResponseDto? Data { get; private set; }

    public static UsuarioResult Ok(
        UsuarioResponseDto? data,
        string message
    )
    {
        return new UsuarioResult
        {
            Success = true,
            Message = message,
            Error = UsuarioError.None,
            Data = data
        };
    }

    public static UsuarioResult Fail(
        string message,
        UsuarioError error
    )
    {
        return new UsuarioResult
        {
            Success = false,
            Message = message,
            Error = error
        };
    }
}