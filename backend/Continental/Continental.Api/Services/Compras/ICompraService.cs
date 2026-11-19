using Continental.Api.DTOs.Compras;

namespace Continental.Api.Services.Compras;

public interface ICompraService
{
    Task<IReadOnlyCollection<CompraResponseDto>>
    GetAllAsync();

    Task<CompraResponseDto?> GetByIdAsync(
        long idCompra
    );

    Task<CompraResult> CreateAsync(
        CreateCompraDto request,
        long idUsuario
    );
}