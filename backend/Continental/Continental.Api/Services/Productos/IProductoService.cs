using Continental.Api.DTOs.Productos;

namespace Continental.Api.Services.Productos;

public interface IProductoService
{
    Task<IReadOnlyCollection<ProductoResponseDto>>
    GetAllAsync(
        string? search = null,
        long? idCategoria = null,
        bool includeInactive = false
    );

    Task<ProductoResponseDto?> GetByIdAsync(
        long idProducto
    );

    Task<ProductoResponseDto?> GetByBarcodeAsync(
        string codigoBarras
    );

    Task<ProductoResult> CreateAsync(
        CreateProductoDto request
    );

    Task<ProductoResult> UpdateAsync(
        long idProducto,
        UpdateProductoDto request
    );

    Task<ProductoResult> ChangeStatusAsync(
        long idProducto,
        bool activo
    );
}