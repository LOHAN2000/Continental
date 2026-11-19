using Continental.Api.DTOs.Categorias;

namespace Continental.Api.Services.Categorias;

public class CategoriaResult
{
    public bool Success { get; private set; }

    public string Message { get; private set; } = string.Empty;

    public CategoriaResponseDto? Data { get; private set; }

    public static CategoriaResult Ok(
        CategoriaResponseDto data,
        string message
    )
    {
        return new CategoriaResult
        {
            Success = true,
            Message = message,
            Data = data
        };
    }

    public static CategoriaResult Fail(string message)
    {
        return new CategoriaResult
        {
            Success = false,
            Message = message
        };
    }
}