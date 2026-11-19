using Continental.Api.DTOs.Productos;

namespace Continental.Api.Services.Productos;

public enum ProductoError
{
    None,
    NotFound,
    DuplicateBarcode,
    InvalidCategory
}

public class ProductoResult
{
    public bool Success { get; private set; }

    public string Message { get; private set; } = string.Empty;

    public ProductoError Error { get; private set; }

    public ProductoResponseDto? Data { get; private set; }

    public static ProductoResult Ok(
        ProductoResponseDto data,
        string message
    )
    {
        return new ProductoResult
        {
            Success = true,
            Message = message,
            Error = ProductoError.None,
            Data = data
        };
    }

    public static ProductoResult Fail(
        string message,
        ProductoError error
    )
    {
        return new ProductoResult
        {
            Success = false,
            Message = message,
            Error = error
        };
    }
}