using Continental.Api.DataAccess;
using Continental.Api.DTOs.Compras;
using Continental.Api.Models.DataModels;
using Microsoft.EntityFrameworkCore;

namespace Continental.Api.Services.Compras;

public class CompraService : ICompraService
{
    private readonly ContinentalContext _context;

    public CompraService(
        ContinentalContext context
    )
    {
        _context = context;
    }

    public async Task<IReadOnlyCollection<CompraResponseDto>>
    GetAllAsync()
    {
        return await _context.Compras
            .AsNoTracking()
            .OrderByDescending(compra => compra.Fecha)
            .Select(compra => new CompraResponseDto
            {
                IdCompra = compra.IdCompra,
                IdProveedor = compra.IdProveedor,
                Proveedor =
                    compra.Proveedor.RazonSocial,
                IdUsuario = compra.IdUsuario,
                Usuario = compra.Usuario.Nombres,
                Fecha = compra.Fecha,
                Total = compra.Total,
                Estado = compra.Estado,
                Observacion = compra.Observacion,
                Detalles = compra.Detalles
                    .Select(detalle =>
                        new CompraDetalleResponseDto
                        {
                            IdCompraDetalle =
                                detalle.IdCompraDetalle,

                            IdProducto =
                                detalle.IdProducto,

                            Producto =
                                detalle.Producto.Nombre,

                            CodigoBarras =
                                detalle.Producto.CodigoBarras,

                            Cantidad =
                                detalle.Cantidad,

                            CostoUnitario =
                                detalle.CostoUnitario,

                            Subtotal =
                                detalle.Subtotal
                        })
                    .ToList()
            })
            .ToListAsync();
    }

    public async Task<CompraResponseDto?> GetByIdAsync(
        long idCompra
    )
    {
        return await _context.Compras
            .AsNoTracking()
            .Where(compra =>
                compra.IdCompra == idCompra)
            .Select(compra => new CompraResponseDto
            {
                IdCompra = compra.IdCompra,
                IdProveedor = compra.IdProveedor,
                Proveedor =
                    compra.Proveedor.RazonSocial,
                IdUsuario = compra.IdUsuario,
                Usuario = compra.Usuario.Nombres,
                Fecha = compra.Fecha,
                Total = compra.Total,
                Estado = compra.Estado,
                Observacion = compra.Observacion,
                Detalles = compra.Detalles
                    .Select(detalle =>
                        new CompraDetalleResponseDto
                        {
                            IdCompraDetalle =
                                detalle.IdCompraDetalle,

                            IdProducto =
                                detalle.IdProducto,

                            Producto =
                                detalle.Producto.Nombre,

                            CodigoBarras =
                                detalle.Producto.CodigoBarras,

                            Cantidad =
                                detalle.Cantidad,

                            CostoUnitario =
                                detalle.CostoUnitario,

                            Subtotal =
                                detalle.Subtotal
                        })
                    .ToList()
            })
            .SingleOrDefaultAsync();
    }

    public async Task<CompraResult> CreateAsync(
        CreateCompraDto request,
        long idUsuario
    )
    {
        if (request.Detalles.Count == 0)
        {
            return CompraResult.Fail(
                "La compra debe contener al menos un producto.",
                CompraError.InvalidDetails
            );
        }

        if (request.Detalles.Any(detalle =>
                detalle.Cantidad <= 0 ||
                detalle.CostoUnitario < 0))
        {
            return CompraResult.Fail(
                "Las cantidades deben ser mayores que cero " +
                "y los costos no pueden ser negativos.",
                CompraError.InvalidDetails
            );
        }

        var repeatedProduct = request.Detalles
            .GroupBy(detalle => detalle.IdProducto)
            .Any(group => group.Count() > 1);

        if (repeatedProduct)
        {
            return CompraResult.Fail(
                "Un producto no puede repetirse en la compra.",
                CompraError.InvalidDetails
            );
        }

        var validProvider = await _context.Proveedores
            .AnyAsync(proveedor =>
                proveedor.IdProveedor ==
                request.IdProveedor &&
                proveedor.Activo
            );

        if (!validProvider)
        {
            return CompraResult.Fail(
                "El proveedor no existe o está inactivo.",
                CompraError.InvalidProvider
            );
        }

        var productIds = request.Detalles
            .Select(detalle => detalle.IdProducto)
            .ToList();

        var products = await _context.Productos
            .Where(producto =>
                productIds.Contains(producto.IdProducto) &&
                producto.Activo)
            .ToListAsync();

        if (products.Count != productIds.Count)
        {
            return CompraResult.Fail(
                "Uno o más productos no existen " +
                "o se encuentran inactivos.",
                CompraError.InvalidProduct
            );
        }

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            var compra = new Compra
            {
                IdProveedor = request.IdProveedor,
                IdUsuario = idUsuario,
                Fecha = DateTime.UtcNow,
                Estado = "REGISTRADA",
                Observacion =
                    NormalizeOptionalText(
                        request.Observacion
                    )
            };

            foreach (var detailRequest in request.Detalles)
            {
                var product = products.Single(producto =>
                    producto.IdProducto ==
                    detailRequest.IdProducto
                );

                var subtotal = Math.Round(
                    detailRequest.Cantidad *
                    detailRequest.CostoUnitario,
                    2,
                    MidpointRounding.AwayFromZero
                );

                compra.Detalles.Add(
                    new CompraDetalle
                    {
                        IdProducto =
                            product.IdProducto,

                        Cantidad =
                            detailRequest.Cantidad,

                        CostoUnitario =
                            detailRequest.CostoUnitario,

                        Subtotal =
                            subtotal
                    }
                );

                product.StockActual +=
                    detailRequest.Cantidad;

                product.PrecioCompra =
                    detailRequest.CostoUnitario;
            }

            compra.Total = compra.Detalles
                .Sum(detalle => detalle.Subtotal);

            await _context.Compras.AddAsync(compra);
            await _context.SaveChangesAsync();

            foreach (var detail in compra.Detalles)
            {
                var product = products.Single(producto =>
                    producto.IdProducto ==
                    detail.IdProducto
                );

                var movement =
                    new MovimientoInventario
                    {
                        IdProducto =
                            detail.IdProducto,

                        IdUsuario =
                            idUsuario,

                        Tipo = "COMPRA",

                        ReferenciaId =
                            compra.IdCompra,

                        Entrada =
                            detail.Cantidad,

                        Salida = 0,

                        Saldo =
                            product.StockActual,

                        Motivo =
                            $"Entrada por compra " +
                            $"N.° {compra.IdCompra}",

                        Fecha =
                            DateTime.UtcNow
                    };

                await _context
                    .MovimientosInventario
                    .AddAsync(movement);
            }

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            var response = await GetByIdAsync(
                compra.IdCompra
            );

            return CompraResult.Ok(
                response!,
                "Compra registrada correctamente."
            );
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private static string? NormalizeOptionalText(
        string? value
    )
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}