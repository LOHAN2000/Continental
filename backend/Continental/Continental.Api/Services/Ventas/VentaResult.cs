using Continental.Api.DTOs.Ventas;

namespace Continental.Api.Services.Ventas;

public enum VentaError
{
    None,
    NotFound,
    InvalidDetails,
    InvalidProduct,
    InsufficientStock,
    InsufficientBatchStock
}

public class VentaResult
{
    public bool Success { get; private set; }

    public string Message { get; private set; } = string.Empty;

    public VentaError Error { get; private set; }

    public VentaResponseDto? Data { get; private set; }

    public static VentaResult Ok(
        VentaResponseDto data,
        string message
    )
    {
        return new VentaResult
        {
            Success = true,
            Message = message,
            Error = VentaError.None,
            Data = data
        };
    }

    public static VentaResult Fail(
        string message,
        VentaError error
    )
    {
        return new VentaResult
        {
            Success = false,
            Message = message,
            Error = error
        };
    }
}