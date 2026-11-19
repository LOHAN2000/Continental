using Continental.Api.DTOs.Proveedores;

namespace Continental.Api.Services.Proveedores;

public enum ProveedorError
{
    None,
    NotFound,
    DuplicateDocument
}

public class ProveedorResult
{
    public bool Success { get; private set; }

    public string Message { get; private set; } = string.Empty;

    public ProveedorError Error { get; private set; }

    public ProveedorResponseDto? Data { get; private set; }

    public static ProveedorResult Ok(
        ProveedorResponseDto data,
        string message
    )
    {
        return new ProveedorResult
        {
            Success = true,
            Message = message,
            Error = ProveedorError.None,
            Data = data
        };
    }

    public static ProveedorResult Fail(
        string message,
        ProveedorError error
    )
    {
        return new ProveedorResult
        {
            Success = false,
            Message = message,
            Error = error
        };
    }
}