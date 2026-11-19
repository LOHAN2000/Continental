using Continental.Api.DataAccess;
using Continental.Api.DTOs.Ventas;
using Continental.Api.Models.DataModels;
using Microsoft.EntityFrameworkCore;

namespace Continental.Api.Services.Ventas;

public class VentaService : IVentaService
{
    private readonly ContinentalContext _context;

    public VentaService(
        ContinentalContext context
    )
    {
        _context = context;
    }

    public async Task<IReadOnlyCollection<VentaResponseDto>>
    GetAllAsync(
        DateTime? fechaInicio = null,
        DateTime? fechaFin = null
    )
    {
        var query = _context.Ventas
            .AsNoTracking()
            .Include(venta => venta.Usuario)
            .Include(venta => venta.Detalles)
            .ThenInclude(detalle => detalle.Producto)
            .Include(venta => venta.Detalles)
            .ThenInclude(detalle => detalle.Lote)
            .AsSplitQuery()
            .AsQueryable();

        if (fechaInicio.HasValue)
        {
            var startDate =
                fechaInicio.Value.ToUniversalTime();

            query = query.Where(venta =>
                venta.Fecha >= startDate
            );
        }

        if (fechaFin.HasValue)
        {
            var endDate = fechaFin.Value
                .Date
                .AddDays(1)
                .ToUniversalTime();

            query = query.Where(venta =>
                venta.Fecha < endDate
            );
        }

        var sales = await query
            .OrderByDescending(venta => venta.Fecha)
            .ToListAsync();

        return sales
            .Select(ToResponse)
            .ToList();
    }

    public async Task<VentaResponseDto?> GetByIdAsync(
        long idVenta
    )
    {
        var sale = await _context.Ventas
            .AsNoTracking()
            .Include(venta => venta.Usuario)
            .Include(venta => venta.Detalles)
            .ThenInclude(detalle => detalle.Producto)
            .Include(venta => venta.Detalles)
            .ThenInclude(detalle => detalle.Lote)
            .AsSplitQuery()
            .SingleOrDefaultAsync(venta =>
                venta.IdVenta == idVenta
            );

        return sale is null
            ? null
            : ToResponse(sale);
    }

    public async Task<VentaResult> CreateAsync(
        CreateVentaDto request,
        long idUsuario
    )
    {
        if (request.Detalles.Count == 0)
        {
            return VentaResult.Fail(
                "La venta debe contener al menos un producto.",
                VentaError.InvalidDetails
            );
        }

        if (request.Detalles.Any(detalle =>
                detalle.Cantidad <= 0))
        {
            return VentaResult.Fail(
                "Todas las cantidades deben ser mayores que cero.",
                VentaError.InvalidDetails
            );
        }

        var repeatedProduct = request.Detalles
            .GroupBy(detalle => detalle.IdProducto)
            .Any(group => group.Count() > 1);

        if (repeatedProduct)
        {
            return VentaResult.Fail(
                "Un producto no puede repetirse en la venta.",
                VentaError.InvalidDetails
            );
        }

        var productIds = request.Detalles
            .Select(detalle => detalle.IdProducto)
            .ToList();

        var products = await _context.Productos
            .Include(producto => producto.Lotes)
            .Where(producto =>
                productIds.Contains(producto.IdProducto) &&
                producto.Activo)
            .ToListAsync();

        if (products.Count != productIds.Count)
        {
            return VentaResult.Fail(
                "Uno o más productos no existen o están inactivos.",
                VentaError.InvalidProduct
            );
        }

        foreach (var detailRequest in request.Detalles)
        {
            var product = products.Single(producto =>
                producto.IdProducto ==
                detailRequest.IdProducto
            );

            if (detailRequest.Cantidad >
                product.StockActual)
            {
                return VentaResult.Fail(
                    $"Stock insuficiente para {product.Nombre}. " +
                    $"Disponible: {product.StockActual}.",
                    VentaError.InsufficientStock
                );
            }

            if (product.ControlaVencimiento)
            {
                var availableBatchStock = product.Lotes
                    .Where(lote =>
                        lote.Activo &&
                        lote.CantidadDisponible > 0 &&
                        lote.FechaVencimiento >=
                        DateOnly.FromDateTime(
                            DateTime.UtcNow
                        )
                    )
                    .Sum(lote =>
                        lote.CantidadDisponible
                    );

                if (availableBatchStock <
                    detailRequest.Cantidad)
                {
                    return VentaResult.Fail(
                        $"Los lotes vigentes de {product.Nombre} " +
                        $"no tienen cantidad suficiente. " +
                        $"Disponible en lotes: {availableBatchStock}.",
                        VentaError.InsufficientBatchStock
                    );
                }
            }
        }

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            var sale = new Venta
            {
                IdUsuario = idUsuario,
                Fecha = DateTime.UtcNow,
                Estado = "REGISTRADA",
                Observacion = NormalizeOptionalText(
                    request.Observacion
                )
            };

            foreach (var detailRequest in request.Detalles)
            {
                var product = products.Single(producto =>
                    producto.IdProducto ==
                    detailRequest.IdProducto
                );

                if (product.ControlaVencimiento)
                {
                    AddBatchDetails(
                        sale,
                        product,
                        detailRequest.Cantidad
                    );
                }
                else
                {
                    sale.Detalles.Add(
                        CreateSaleDetail(
                            product,
                            null,
                            detailRequest.Cantidad
                        )
                    );
                }

                product.StockActual -=
                    detailRequest.Cantidad;
            }

            sale.Total = sale.Detalles.Sum(
                detalle => detalle.Subtotal
            );

            await _context.Ventas.AddAsync(sale);
            await _context.SaveChangesAsync();

            foreach (var detailRequest in request.Detalles)
            {
                var product = products.Single(producto =>
                    producto.IdProducto ==
                    detailRequest.IdProducto
                );

                var movement =
                    new MovimientoInventario
                    {
                        IdProducto =
                            product.IdProducto,

                        IdUsuario =
                            idUsuario,

                        Tipo = "VENTA",

                        ReferenciaId =
                            sale.IdVenta,

                        Entrada = 0,

                        Salida =
                            detailRequest.Cantidad,

                        Saldo =
                            product.StockActual,

                        Motivo =
                            $"Salida por venta N.° " +
                            $"{sale.IdVenta}",

                        Fecha =
                            DateTime.UtcNow
                    };

                await _context.MovimientosInventario
                    .AddAsync(movement);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            var response = await GetByIdAsync(
                sale.IdVenta
            );

            return VentaResult.Ok(
                response!,
                "Venta registrada correctamente."
            );
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private static void AddBatchDetails(
        Venta sale,
        Producto product,
        decimal requestedQuantity
    )
    {
        var remainingQuantity = requestedQuantity;

        var validBatches = product.Lotes
            .Where(lote =>
                lote.Activo &&
                lote.CantidadDisponible > 0 &&
                lote.FechaVencimiento >=
                DateOnly.FromDateTime(
                    DateTime.UtcNow
                )
            )
            .OrderBy(lote =>
                lote.FechaVencimiento)
            .ThenBy(lote =>
                lote.IdLote)
            .ToList();

        foreach (var batch in validBatches)
        {
            if (remainingQuantity <= 0)
            {
                break;
            }

            var consumedQuantity = Math.Min(
                batch.CantidadDisponible,
                remainingQuantity
            );

            sale.Detalles.Add(
                CreateSaleDetail(
                    product,
                    batch,
                    consumedQuantity
                )
            );

            batch.CantidadDisponible -=
                consumedQuantity;

            if (batch.CantidadDisponible <= 0)
            {
                batch.CantidadDisponible = 0;
                batch.Activo = false;
            }

            remainingQuantity -= consumedQuantity;
        }

        if (remainingQuantity > 0)
        {
            throw new InvalidOperationException(
                "No fue posible completar el consumo de lotes."
            );
        }
    }

    private static VentaDetalle CreateSaleDetail(
        Producto product,
        Lote? batch,
        decimal quantity
    )
    {
        var subtotal = Math.Round(
            quantity * product.PrecioVenta,
            2,
            MidpointRounding.AwayFromZero
        );

        return new VentaDetalle
        {
            IdProducto = product.IdProducto,
            IdLote = batch?.IdLote,
            Cantidad = quantity,
            PrecioUnitario = product.PrecioVenta,
            CostoHistoricoUnitario =
                product.PrecioCompra,
            Subtotal = subtotal
        };
    }

    private static VentaResponseDto ToResponse(
        Venta venta
    )
    {
        var details = venta.Detalles
            .Select(detalle =>
            {
                var historicalCost = Math.Round(
                    detalle.Cantidad *
                    detalle.CostoHistoricoUnitario,
                    2,
                    MidpointRounding.AwayFromZero
                );

                return new VentaDetalleResponseDto
                {
                    IdVentaDetalle =
                        detalle.IdVentaDetalle,

                    IdProducto =
                        detalle.IdProducto,

                    Producto =
                        detalle.Producto.Nombre,

                    CodigoBarras =
                        detalle.Producto.CodigoBarras,

                    IdLote =
                        detalle.IdLote,

                    CodigoLote =
                        detalle.Lote != null
                            ? detalle.Lote.CodigoLote
                            : null,

                    Cantidad =
                        detalle.Cantidad,

                    PrecioUnitario =
                        detalle.PrecioUnitario,

                    CostoHistoricoUnitario =
                        detalle.CostoHistoricoUnitario,

                    Subtotal =
                        detalle.Subtotal,

                    CostoHistoricoTotal =
                        historicalCost,

                    MargenBrutoEstimado =
                        detalle.Subtotal -
                        historicalCost
                };
            })
            .ToList();

        var totalHistoricalCost = details.Sum(
            detail => detail.CostoHistoricoTotal
        );

        return new VentaResponseDto
        {
            IdVenta = venta.IdVenta,
            IdUsuario = venta.IdUsuario,
            Usuario = venta.Usuario.Nombres,
            Fecha = venta.Fecha,
            Total = venta.Total,

            CostoHistoricoTotal =
                totalHistoricalCost,

            MargenBrutoEstimado =
                venta.Total -
                totalHistoricalCost,

            Estado = venta.Estado,
            Observacion = venta.Observacion,
            Detalles = details
        };
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