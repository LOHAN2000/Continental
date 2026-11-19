using Continental.Api.DTOs.Compras;

namespace Continental.Api.Services.Compras;

public enum CompraError
{
    None,
    NotFound,
    InvalidProvider,
    InvalidProduct,
    InvalidDetails
}

public class CompraResult
{
    public bool Success { get; private set; }

    public string Message { get; private set; } = string.Empty;

    public CompraError Error { get; private set; }

    public CompraResponseDto? Data { get; private set; }

    public static CompraResult Ok(
        CompraResponseDto data,
        string message
    )
    {
        return new CompraResult
        {
            Success = true,
            Message = message,
            Error = CompraError.None,
            Data = data
        };
    }

    public static CompraResult Fail(
        string message,
        CompraError error
    )
    {
        return new CompraResult
        {
            Success = false,
            Message = message,
            Error = error
        };
    }
}