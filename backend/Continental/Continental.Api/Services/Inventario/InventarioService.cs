using Continental.Api.DataAccess;
using Continental.Api.DTOs.Inventario;
using Microsoft.EntityFrameworkCore;

namespace Continental.Api.Services.Inventario;

public class InventarioService : IInventarioService
{
    private readonly ContinentalContext _context;

    public InventarioService(
        ContinentalContext context
    )
    {
        _context = context;
    }

    public async Task<IReadOnlyCollection<InventarioResponseDto>>
    GetInventoryAsync(
        string? search = null,
        long? idCategoria = null,
        string? estado = null,
        bool includeInactive = false
    )
    {
        var query = _context.Productos
            .AsNoTracking()
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(producto =>
                producto.Activo
            );
        }

        if (idCategoria.HasValue)
        {
            query = query.Where(producto =>
                producto.IdCategoria ==
                idCategoria.Value
            );
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search
                .Trim()
                .ToLower();

            query = query.Where(producto =>
                producto.Nombre
                    .ToLower()
                    .Contains(normalizedSearch) ||
                producto.CodigoBarras
                    .ToLower()
                    .Contains(normalizedSearch)
            );
        }

        if (!string.IsNullOrWhiteSpace(estado))
        {
            var normalizedState = estado
                .Trim()
                .ToUpperInvariant();

            query = normalizedState switch
            {
                "SIN_STOCK" =>
                    query.Where(producto =>
                        producto.StockActual <= 0
                    ),

                "STOCK_MINIMO" =>
                    query.Where(producto =>
                        producto.StockActual > 0 &&
                        producto.StockActual <=
                        producto.StockMinimo
                    ),

                "DISPONIBLE" =>
                    query.Where(producto =>
                        producto.StockActual >
                        producto.StockMinimo
                    ),

                _ => query
            };
        }

        return await query
            .OrderBy(producto => producto.Nombre)
            .Select(producto =>
                new InventarioResponseDto
                {
                    IdProducto =
                        producto.IdProducto,

                    CodigoBarras =
                        producto.CodigoBarras,

                    Producto =
                        producto.Nombre,

                    IdCategoria =
                        producto.IdCategoria,

                    Categoria =
                        producto.Categoria.Nombre,

                    StockActual =
                        producto.StockActual,

                    StockMinimo =
                        producto.StockMinimo,

                    EstadoStock =
                        producto.StockActual <= 0
                            ? "SIN_STOCK"
                            : producto.StockActual <=
                              producto.StockMinimo
                                ? "STOCK_MINIMO"
                                : "DISPONIBLE",

                    ControlaVencimiento =
                        producto.ControlaVencimiento,

                    CantidadEnLotes =
                        producto.Lotes
                            .Where(lote =>
                                lote.Activo &&
                                lote.CantidadDisponible > 0
                            )
                            .Sum(lote =>
                                lote.CantidadDisponible
                            ),

                    ProximoVencimiento =
                        producto.Lotes
                            .Where(lote =>
                                lote.Activo &&
                                lote.CantidadDisponible > 0
                            )
                            .OrderBy(lote =>
                                lote.FechaVencimiento
                            )
                            .Select(lote =>
                                (DateOnly?)
                                lote.FechaVencimiento
                            )
                            .FirstOrDefault(),

                    Activo =
                        producto.Activo
                }
            )
            .ToListAsync();
    }

    public async Task<KardexProductoDto?> GetKardexAsync(
        long idProducto,
        DateTime? fechaInicio = null,
        DateTime? fechaFin = null
    )
    {
        var product = await _context.Productos
            .AsNoTracking()
            .Where(producto =>
                producto.IdProducto == idProducto
            )
            .Select(producto => new
            {
                producto.IdProducto,
                producto.CodigoBarras,
                producto.Nombre,
                producto.StockActual
            })
            .SingleOrDefaultAsync();

        if (product is null)
        {
            return null;
        }

        var movementsQuery =
            _context.MovimientosInventario
                .AsNoTracking()
                .Where(movimiento =>
                    movimiento.IdProducto ==
                    idProducto
                );

        if (fechaInicio.HasValue)
        {
            var startDate =
                fechaInicio.Value.ToUniversalTime();

            movementsQuery = movementsQuery
                .Where(movimiento =>
                    movimiento.Fecha >= startDate
                );
        }

        if (fechaFin.HasValue)
        {
            var endDate = fechaFin.Value
                .Date
                .AddDays(1)
                .ToUniversalTime();

            movementsQuery = movementsQuery
                .Where(movimiento =>
                    movimiento.Fecha < endDate
                );
        }

        var movements = await movementsQuery
            .OrderByDescending(movimiento =>
                movimiento.Fecha)
            .Select(movimiento =>
                new MovimientoInventarioResponseDto
                {
                    IdMovimiento =
                        movimiento.IdMovimiento,

                    IdProducto =
                        movimiento.IdProducto,

                    Producto =
                        movimiento.Producto.Nombre,

                    CodigoBarras =
                        movimiento.Producto.CodigoBarras,

                    IdUsuario =
                        movimiento.IdUsuario,

                    Usuario =
                        movimiento.Usuario.Nombres,

                    Tipo =
                        movimiento.Tipo,

                    ReferenciaId =
                        movimiento.ReferenciaId,

                    Entrada =
                        movimiento.Entrada,

                    Salida =
                        movimiento.Salida,

                    Saldo =
                        movimiento.Saldo,

                    Motivo =
                        movimiento.Motivo,

                    Fecha =
                        movimiento.Fecha
                }
            )
            .ToListAsync();

        return new KardexProductoDto
        {
            IdProducto =
                product.IdProducto,

            CodigoBarras =
                product.CodigoBarras,

            Producto =
                product.Nombre,

            StockActual =
                product.StockActual,

            Movimientos =
                movements
        };
    }

    public async Task<IReadOnlyCollection<
        MovimientoInventarioResponseDto
    >> GetRecentMovementsAsync(
        int limit = 20
    )
    {
        limit = Math.Clamp(limit, 1, 100);

        return await _context.MovimientosInventario
            .AsNoTracking()
            .OrderByDescending(movimiento =>
                movimiento.Fecha)
            .Take(limit)
            .Select(movimiento =>
                new MovimientoInventarioResponseDto
                {
                    IdMovimiento =
                        movimiento.IdMovimiento,

                    IdProducto =
                        movimiento.IdProducto,

                    Producto =
                        movimiento.Producto.Nombre,

                    CodigoBarras =
                        movimiento.Producto.CodigoBarras,

                    IdUsuario =
                        movimiento.IdUsuario,

                    Usuario =
                        movimiento.Usuario.Nombres,

                    Tipo =
                        movimiento.Tipo,

                    ReferenciaId =
                        movimiento.ReferenciaId,

                    Entrada =
                        movimiento.Entrada,

                    Salida =
                        movimiento.Salida,

                    Saldo =
                        movimiento.Saldo,

                    Motivo =
                        movimiento.Motivo,

                    Fecha =
                        movimiento.Fecha
                }
            )
            .ToListAsync();
    }

    public async Task<ResumenInventarioDto>
    GetSummaryAsync()
    {
        var activeProducts = _context.Productos
            .AsNoTracking()
            .Where(producto => producto.Activo);

        return new ResumenInventarioDto
        {
            TotalProductosActivos =
                await activeProducts.CountAsync(),

            ProductosSinStock =
                await activeProducts.CountAsync(
                    producto =>
                        producto.StockActual <= 0
                ),

            ProductosConStockMinimo =
                await activeProducts.CountAsync(
                    producto =>
                        producto.StockActual > 0 &&
                        producto.StockActual <=
                        producto.StockMinimo
                ),

            ProductosDisponibles =
                await activeProducts.CountAsync(
                    producto =>
                        producto.StockActual >
                        producto.StockMinimo
                ),

            UnidadesDisponibles =
                await activeProducts.SumAsync(
                    producto =>
                        producto.StockActual
                ),

            ValorInventarioCosto =
                await activeProducts.SumAsync(
                    producto =>
                        producto.StockActual *
                        producto.PrecioCompra
                ),

            ValorInventarioVenta =
                await activeProducts.SumAsync(
                    producto =>
                        producto.StockActual *
                        producto.PrecioVenta
                )
        };
    }
}