using Continental.Api.DTOs.Ajustes;

namespace Continental.Api.Services.Ajustes;

public enum AjusteInventarioError
{
    None,
    ProductNotFound,
    InvalidType,
    InvalidQuantity,
    InsufficientStock
}

public class AjusteInventarioResult
{
    public bool Success { get; private set; }

    public string Message { get; private set; } = string.Empty;

    public AjusteInventarioError Error { get; private set; }

    public AjusteInventarioResponseDto? Data { get; private set; }

    public static AjusteInventarioResult Ok(
        AjusteInventarioResponseDto data,
        string message
    )
    {
        return new AjusteInventarioResult
        {
            Success = true,
            Message = message,
            Error = AjusteInventarioError.None,
            Data = data
        };
    }

    public static AjusteInventarioResult Fail(
        string message,
        AjusteInventarioError error
    )
    {
        return new AjusteInventarioResult
        {
            Success = false,
            Message = message,
            Error = error
        };
    }
}