using Continental.Api.DataAccess;
using Continental.Api.DTOs.Reportes;
using Microsoft.EntityFrameworkCore;

namespace Continental.Api.Services.Reportes;

public class ReporteService : IReporteService
{
    private readonly ContinentalContext _context;

    public ReporteService(
        ContinentalContext context
    )
    {
        _context = context;
    }

    public async Task<DashboardResponseDto>
    GetDashboardAsync(
        DateTime? fechaInicio = null,
        DateTime? fechaFin = null
    )
    {
        var currentDate = DateTime.UtcNow;

        var startDate = fechaInicio.HasValue
            ? ToUtcStart(fechaInicio.Value)
            : new DateTime(
                currentDate.Year,
                currentDate.Month,
                1,
                0,
                0,
                0,
                DateTimeKind.Utc
            );

        var endDateExclusive = fechaFin.HasValue
            ? ToUtcEndExclusive(fechaFin.Value)
            : currentDate.Date
                .AddDays(1)
                .ToUniversalTime();

        var products = _context.Productos
            .AsNoTracking()
            .Where(producto => producto.Activo);

        var sales = _context.Ventas
            .AsNoTracking()
            .Where(venta =>
                venta.Estado == "REGISTRADA" &&
                venta.Fecha >= startDate &&
                venta.Fecha < endDateExclusive
            );

        var saleDetails = _context.VentaDetalles
            .AsNoTracking()
            .Where(detalle =>
                detalle.Venta.Estado == "REGISTRADA" &&
                detalle.Venta.Fecha >= startDate &&
                detalle.Venta.Fecha < endDateExclusive
            );

        var ingresos = await sales
            .SumAsync(venta =>
                (decimal?)venta.Total
            ) ?? 0;

        var costoHistorico = await saleDetails
            .SumAsync(detalle =>
                (decimal?)(
                    detalle.Cantidad *
                    detalle.CostoHistoricoUnitario
                )
            ) ?? 0;

        var today = DateOnly.FromDateTime(
            currentDate
        );

        var expirationLimit = today.AddDays(30);

        var criticalProducts = await products
            .Where(producto =>
                producto.StockActual <=
                producto.StockMinimo
            )
            .OrderBy(producto =>
                producto.StockActual)
            .ThenBy(producto =>
                producto.Nombre)
            .Take(10)
            .Select(producto =>
                new ProductoCriticoDto
                {
                    IdProducto =
                        producto.IdProducto,

                    CodigoBarras =
                        producto.CodigoBarras,

                    Producto =
                        producto.Nombre,

                    StockActual =
                        producto.StockActual,

                    StockMinimo =
                        producto.StockMinimo,

                    Estado =
                        producto.StockActual <= 0
                            ? "SIN_STOCK"
                            : "STOCK_MINIMO"
                }
            )
            .ToListAsync();

        var recentSalesData = await sales
            .OrderByDescending(venta =>
                venta.Fecha)
            .Take(10)
            .Select(venta => new
            {
                venta.IdVenta,
                venta.Fecha,
                Usuario =
                    venta.Usuario.Nombres,
                venta.Total,

                CostoHistorico =
                    venta.Detalles.Sum(detalle =>
                        detalle.Cantidad *
                        detalle.CostoHistoricoUnitario
                    )
            })
            .ToListAsync();

        var recentSales = recentSalesData
            .Select(venta =>
                new VentaRecienteDto
                {
                    IdVenta =
                        venta.IdVenta,

                    Fecha =
                        venta.Fecha,

                    Usuario =
                        venta.Usuario,

                    Total =
                        venta.Total,

                    MargenBrutoEstimado =
                        venta.Total -
                        venta.CostoHistorico
                }
            )
            .ToList();

        return new DashboardResponseDto
        {
            FechaInicio = startDate,

            FechaFin =
                endDateExclusive.AddTicks(-1),

            ProductosActivos =
                await products.CountAsync(),

            ProductosSinStock =
                await products.CountAsync(producto =>
                    producto.StockActual <= 0
                ),

            ProductosConStockMinimo =
                await products.CountAsync(producto =>
                    producto.StockActual > 0 &&
                    producto.StockActual <=
                    producto.StockMinimo
                ),

            LotesProximosAVencer =
                await _context.Lotes
                    .AsNoTracking()
                    .CountAsync(lote =>
                        lote.Activo &&
                        lote.CantidadDisponible > 0 &&
                        lote.FechaVencimiento >= today &&
                        lote.FechaVencimiento <=
                        expirationLimit
                    ),

            AlertasNoLeidas =
                await _context.Alertas
                    .AsNoTracking()
                    .CountAsync(alerta =>
                        alerta.Activa &&
                        !alerta.Leida
                    ),

            CantidadVentas =
                await sales.CountAsync(),

            IngresosPorVentas =
                ingresos,

            CostoHistoricoVendido =
                costoHistorico,

            MargenBrutoEstimado =
                ingresos - costoHistorico,

            ValorInventarioCosto =
                await products.SumAsync(producto =>
                    producto.StockActual *
                    producto.PrecioCompra
                ),

            ValorInventarioVenta =
                await products.SumAsync(producto =>
                    producto.StockActual *
                    producto.PrecioVenta
                ),

            ProductosCriticos =
                criticalProducts,

            VentasRecientes =
                recentSales
        };
    }

    public async Task<BalanceFinancieroDto>
    GetBalanceAsync(
        DateTime fechaInicio,
        DateTime fechaFin
    )
    {
        var startDate = ToUtcStart(fechaInicio);

        var endDateExclusive =
            ToUtcEndExclusive(fechaFin);

        var saleDetailsQuery =
            _context.VentaDetalles
                .AsNoTracking()
                .Where(detalle =>
                    detalle.Venta.Estado ==
                    "REGISTRADA" &&
                    detalle.Venta.Fecha >=
                    startDate &&
                    detalle.Venta.Fecha <
                    endDateExclusive
                );

        var products = await saleDetailsQuery
            .GroupBy(detalle => new
            {
                detalle.IdProducto,
                detalle.Producto.Nombre
            })
            .Select(group =>
                new BalanceProductoDto
                {
                    IdProducto =
                        group.Key.IdProducto,

                    Producto =
                        group.Key.Nombre,

                    CantidadVendida =
                        group.Sum(detalle =>
                            detalle.Cantidad
                        ),

                    Ingresos =
                        group.Sum(detalle =>
                            detalle.Subtotal
                        ),

                    CostoHistorico =
                        group.Sum(detalle =>
                            detalle.Cantidad *
                            detalle
                                .CostoHistoricoUnitario
                        ),

                    MargenBrutoEstimado =
                        group.Sum(detalle =>
                            detalle.Subtotal -
                            (
                                detalle.Cantidad *
                                detalle
                                    .CostoHistoricoUnitario
                            )
                        )
                }
            )
            .OrderByDescending(producto =>
                producto.Ingresos)
            .ToListAsync();

        var ingresos = products.Sum(producto =>
            producto.Ingresos
        );

        var costoHistorico = products.Sum(producto =>
            producto.CostoHistorico
        );

        var margen = ingresos - costoHistorico;

        var cantidadVentas =
            await _context.Ventas
                .AsNoTracking()
                .CountAsync(venta =>
                    venta.Estado == "REGISTRADA" &&
                    venta.Fecha >= startDate &&
                    venta.Fecha < endDateExclusive
                );

        return new BalanceFinancieroDto
        {
            FechaInicio = startDate,

            FechaFin =
                endDateExclusive.AddTicks(-1),

            CantidadVentas =
                cantidadVentas,

            IngresosPorVentas =
                ingresos,

            CostoHistoricoVendido =
                costoHistorico,

            MargenBrutoEstimado =
                margen,

            PorcentajeMargenBruto =
                ingresos > 0
                    ? Math.Round(
                        margen / ingresos * 100,
                        2,
                        MidpointRounding.AwayFromZero
                    )
                    : 0,

            Productos =
                products
        };
    }

    public async Task<IReadOnlyCollection<
        ProductoMasVendidoDto
    >> GetTopProductsAsync(
        DateTime fechaInicio,
        DateTime fechaFin,
        int limit = 10
    )
    {
        limit = Math.Clamp(limit, 1, 100);

        var startDate = ToUtcStart(fechaInicio);

        var endDateExclusive =
            ToUtcEndExclusive(fechaFin);

        return await _context.VentaDetalles
            .AsNoTracking()
            .Where(detalle =>
                detalle.Venta.Estado ==
                "REGISTRADA" &&
                detalle.Venta.Fecha >=
                startDate &&
                detalle.Venta.Fecha <
                endDateExclusive
            )
            .GroupBy(detalle => new
            {
                detalle.IdProducto,
                detalle.Producto.Nombre,
                detalle.Producto.CodigoBarras
            })
            .Select(group =>
                new ProductoMasVendidoDto
                {
                    IdProducto =
                        group.Key.IdProducto,

                    Producto =
                        group.Key.Nombre,

                    CodigoBarras =
                        group.Key.CodigoBarras,

                    CantidadVendida =
                        group.Sum(detalle =>
                            detalle.Cantidad
                        ),

                    ImporteVendido =
                        group.Sum(detalle =>
                            detalle.Subtotal
                        )
                }
            )
            .OrderByDescending(producto =>
                producto.CantidadVendida)
            .Take(limit)
            .ToListAsync();
    }

    private static DateTime ToUtcStart(
        DateTime value
    )
    {
        return DateTime.SpecifyKind(
            value.Date,
            DateTimeKind.Utc
        );
    }

    private static DateTime ToUtcEndExclusive(
        DateTime value
    )
    {
        return DateTime.SpecifyKind(
            value.Date.AddDays(1),
            DateTimeKind.Utc
        );
    }
}