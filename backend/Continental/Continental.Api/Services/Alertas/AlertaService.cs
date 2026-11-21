using Continental.Api.DataAccess;
using Continental.Api.DTOs.Alertas;
using Continental.Api.Models.DataModels;
using Microsoft.EntityFrameworkCore;

namespace Continental.Api.Services.Alertas;

public class AlertaService : IAlertaService
{
    private const string StockMinimumType =
        "STOCK_MINIMO";

    private const string ExpirationType =
        "PROXIMO_VENCIMIENTO";

    private readonly ContinentalContext _context;

    public AlertaService(
        ContinentalContext context
    )
    {
        _context = context;
    }

    public async Task GenerateAsync()
    {
        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        await _context.Database.ExecuteSqlRawAsync(
            "SELECT pg_advisory_xact_lock(847263159)"
        );

        await GenerateStockAlertsAsync();
        await GenerateExpirationAlertsAsync();
        await CloseResolvedAlertsAsync();

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
    }

    public async Task<IReadOnlyCollection<AlertaResponseDto>>
    GetAllAsync(
        string? tipo = null,
        bool? leida = null,
        bool includeInactive = false
    )
    {
        var query = _context.Alertas
            .AsNoTracking()
            .Include(alerta => alerta.Producto)
            .Include(alerta => alerta.Lote)
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(alerta =>
                alerta.Activa
            );
        }

        if (!string.IsNullOrWhiteSpace(tipo))
        {
            var normalizedType = tipo
                .Trim()
                .ToUpperInvariant();

            query = query.Where(alerta =>
                alerta.Tipo == normalizedType
            );
        }

        if (leida.HasValue)
        {
            query = query.Where(alerta =>
                alerta.Leida == leida.Value
            );
        }

        var alerts = await query
            .OrderBy(alerta => alerta.Leida)
            .ThenByDescending(alerta =>
                alerta.CreatedAt)
            .ToListAsync();

        return alerts
            .Select(ToResponse)
            .ToList();
    }

    public async Task<AlertaResponseDto?> GetByIdAsync(
        long idAlerta
    )
    {
        var alert = await _context.Alertas
            .AsNoTracking()
            .Include(alerta => alerta.Producto)
            .Include(alerta => alerta.Lote)
            .SingleOrDefaultAsync(alerta =>
                alerta.IdAlerta == idAlerta
            );

        return alert is null
            ? null
            : ToResponse(alert);
    }

    public async Task<bool> MarkAsReadAsync(
        long idAlerta
    )
    {
        var alert = await _context.Alertas
            .SingleOrDefaultAsync(alerta =>
                alerta.IdAlerta == idAlerta
            );

        if (alert is null)
        {
            return false;
        }

        alert.Leida = true;

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<ResumenAlertasDto>
    GetSummaryAsync()
    {
        var activeAlerts = _context.Alertas
            .AsNoTracking()
            .Where(alerta => alerta.Activa);

        return new ResumenAlertasDto
        {
            TotalActivas =
                await activeAlerts.CountAsync(),

            StockMinimo =
                await activeAlerts.CountAsync(
                    alerta =>
                        alerta.Tipo ==
                        StockMinimumType
                ),

            ProximosVencimientos =
                await activeAlerts.CountAsync(
                    alerta =>
                        alerta.Tipo ==
                        ExpirationType
                ),

            NoLeidas =
                await activeAlerts.CountAsync(
                    alerta => !alerta.Leida
                )
        };
    }

    private async Task GenerateStockAlertsAsync()
    {
        var criticalProducts = await _context.Productos
            .Where(producto =>
                producto.Activo &&
                producto.StockActual <=
                producto.StockMinimo
            )
            .ToListAsync();

        foreach (var product in criticalProducts)
        {
            var alertExists = await _context.Alertas
                .AnyAsync(alerta =>
                    alerta.IdProducto ==
                    product.IdProducto &&
                    alerta.IdLote == null &&
                    alerta.Tipo ==
                    StockMinimumType &&
                    alerta.Activa
                );

            if (alertExists)
            {
                continue;
            }

            var alert = new Alerta
            {
                IdProducto =
                    product.IdProducto,

                IdLote = null,

                Tipo =
                    StockMinimumType,

                Mensaje =
                    $"El producto {product.Nombre} " +
                    $"tiene stock {product.StockActual} " +
                    $"y su mínimo es " +
                    $"{product.StockMinimo}.",

                Leida = false,
                Activa = true
            };

            await _context.Alertas.AddAsync(alert);
        }
    }

    private async Task GenerateExpirationAlertsAsync()
    {
        var today = DateOnly.FromDateTime(
            DateTime.UtcNow
        );

        var alertLimit = today.AddDays(30);

        var expiringBatches = await _context.Lotes
            .Include(lote => lote.Producto)
            .Where(lote =>
                lote.Activo &&
                lote.CantidadDisponible > 0 &&
                lote.FechaVencimiento >= today &&
                lote.FechaVencimiento <= alertLimit
            )
            .ToListAsync();

        foreach (var batch in expiringBatches)
        {
            var alertExists = await _context.Alertas
                .AnyAsync(alerta =>
                    alerta.IdProducto ==
                    batch.IdProducto &&
                    alerta.IdLote ==
                    batch.IdLote &&
                    alerta.Tipo ==
                    ExpirationType &&
                    alerta.Activa
                );

            if (alertExists)
            {
                continue;
            }

            var alert = new Alerta
            {
                IdProducto =
                    batch.IdProducto,

                IdLote =
                    batch.IdLote,

                Tipo =
                    ExpirationType,

                Mensaje =
                    $"El lote {batch.CodigoLote} de " +
                    $"{batch.Producto.Nombre} vence el " +
                    $"{batch.FechaVencimiento:dd/MM/yyyy}.",

                Leida = false,
                Activa = true
            };

            await _context.Alertas.AddAsync(alert);
        }
    }

    private async Task CloseResolvedAlertsAsync()
    {
        var stockAlerts = await _context.Alertas
            .Include(alerta => alerta.Producto)
            .Where(alerta =>
                alerta.Tipo == StockMinimumType &&
                alerta.Activa
            )
            .ToListAsync();

        foreach (var alert in stockAlerts)
        {
            if (!alert.Producto.Activo ||
                alert.Producto.StockActual >
                alert.Producto.StockMinimo)
            {
                alert.Activa = false;
            }
        }

        var expirationAlerts = await _context.Alertas
            .Include(alerta => alerta.Lote)
            .Where(alerta =>
                alerta.Tipo == ExpirationType &&
                alerta.Activa
            )
            .ToListAsync();

        foreach (var alert in expirationAlerts)
        {
            if (alert.Lote is null ||
                !alert.Lote.Activo ||
                alert.Lote.CantidadDisponible <= 0)
            {
                alert.Activa = false;
            }
        }
    }

    private static AlertaResponseDto ToResponse(
        Alerta alerta
    )
    {
        return new AlertaResponseDto
        {
            IdAlerta =
                alerta.IdAlerta,

            IdProducto =
                alerta.IdProducto,

            Producto =
                alerta.Producto?.Nombre
                ?? "Producto no disponible",

            CodigoBarras =
                alerta.Producto?.CodigoBarras
                ?? string.Empty,

            IdLote =
                alerta.IdLote,

            CodigoLote =
                alerta.Lote?.CodigoLote,

            Tipo =
                alerta.Tipo,

            Mensaje =
                alerta.Mensaje,

            StockActual =
                alerta.Producto?.StockActual
                ?? 0,

            StockMinimo =
                alerta.Producto?.StockMinimo
                ?? 0,

            FechaVencimiento =
                alerta.Lote?.FechaVencimiento,

            Leida =
                alerta.Leida,

            Activa =
                alerta.Activa,

            CreatedAt =
                alerta.CreatedAt
        };
    }
}