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

        var currentDate = DateOnly.FromDateTime(
            DateTime.UtcNow
        );

        var invalidExpiration = request.Detalles.Any(
            detalle =>
                detalle.FechaVencimiento.HasValue &&
                detalle.FechaVencimiento.Value <= currentDate
        );

        if (invalidExpiration)
        {
            return CompraResult.Fail(
                "La fecha de vencimiento debe ser posterior " +
                "a la fecha actual.",
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

        foreach (var detailRequest in request.Detalles)
        {
            var product = products.Single(producto =>
                producto.IdProducto ==
                detailRequest.IdProducto
            );

            if (product.ControlaVencimiento)
            {
                if (string.IsNullOrWhiteSpace(
                        detailRequest.CodigoLote) ||
                    !detailRequest.FechaVencimiento.HasValue)
                {
                    return CompraResult.Fail(
                        $"El producto {product.Nombre} requiere " +
                        "código de lote y fecha de vencimiento.",
                        CompraError.InvalidDetails
                    );
                }
            }
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

                var purchaseDetail = new CompraDetalle
                {
                    IdProducto =
                        product.IdProducto,

                    Cantidad =
                        detailRequest.Cantidad,

                    CostoUnitario =
                        detailRequest.CostoUnitario,

                    Subtotal =
                        subtotal
                };

                compra.Detalles.Add(purchaseDetail);

                product.StockActual +=
                    detailRequest.Cantidad;

                product.PrecioCompra =
                    detailRequest.CostoUnitario;
            }

            compra.Total = compra.Detalles
                .Sum(detalle => detalle.Subtotal);

            await _context.Compras.AddAsync(compra);
            await _context.SaveChangesAsync();

            foreach (var detailRequest in request.Detalles)
            {
                if (string.IsNullOrWhiteSpace(
                        detailRequest.CodigoLote) ||
                    !detailRequest.FechaVencimiento.HasValue)
                {
                    continue;
                }

                var purchaseDetail = compra.Detalles
                    .Single(detalle =>
                        detalle.IdProducto ==
                        detailRequest.IdProducto
                    );

                var lotCode = detailRequest.CodigoLote
                    .Trim();

                var duplicateLot = await _context.Lotes
                    .AnyAsync(lote =>
                        lote.IdProducto ==
                        detailRequest.IdProducto &&
                        lote.CodigoLote == lotCode
                    );

                if (duplicateLot)
                {
                    await transaction.RollbackAsync();

                    return CompraResult.Fail(
                        $"El lote {lotCode} ya está registrado " +
                        "para el producto seleccionado.",
                        CompraError.InvalidDetails
                    );
                }

                var batch = new Lote
                {
                    IdProducto =
                        detailRequest.IdProducto,

                    IdCompraDetalle =
                        purchaseDetail.IdCompraDetalle,

                    CodigoLote =
                        lotCode,

                    CantidadInicial =
                        detailRequest.Cantidad,

                    CantidadDisponible =
                        detailRequest.Cantidad,

                    FechaVencimiento =
                        detailRequest.FechaVencimiento.Value,

                    Activo = true
                };

                await _context.Lotes.AddAsync(batch);
            }

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