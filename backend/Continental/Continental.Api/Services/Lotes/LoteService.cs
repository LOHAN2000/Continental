using Continental.Api.DataAccess;
using Continental.Api.DTOs.Lotes;
using Microsoft.EntityFrameworkCore;

namespace Continental.Api.Services.Lotes;

public class LoteService : ILoteService
{
    private readonly ContinentalContext _context;

    public LoteService(
        ContinentalContext context
    )
    {
        _context = context;
    }

    public async Task<IReadOnlyCollection<LoteResponseDto>>
    GetAllAsync(
        long? idProducto = null,
        bool onlyAvailable = false
    )
    {
        var query = _context.Lotes
            .AsNoTracking()
            .AsQueryable();

        if (idProducto.HasValue)
        {
            query = query.Where(lote =>
                lote.IdProducto ==
                idProducto.Value
            );
        }

        if (onlyAvailable)
        {
            query = query.Where(lote =>
                lote.Activo &&
                lote.CantidadDisponible > 0
            );
        }

        var today = DateOnly.FromDateTime(
            DateTime.UtcNow
        );

        return await query
            .OrderBy(lote =>
                lote.FechaVencimiento)
            .Select(lote =>
                new LoteResponseDto
                {
                    IdLote = lote.IdLote,
                    IdProducto =
                        lote.IdProducto,
                    Producto =
                        lote.Producto.Nombre,
                    CodigoBarras =
                        lote.Producto.CodigoBarras,
                    CodigoLote =
                        lote.CodigoLote,
                    CantidadInicial =
                        lote.CantidadInicial,
                    CantidadDisponible =
                        lote.CantidadDisponible,
                    FechaVencimiento =
                        lote.FechaVencimiento,
                    DiasParaVencer =
                        lote.FechaVencimiento
                            .DayNumber -
                        today.DayNumber,
                    Estado =
                        lote.CantidadDisponible <= 0
                            ? "AGOTADO"
                            : lote.FechaVencimiento <
                              today
                                ? "VENCIDO"
                                : lote.FechaVencimiento
                                      .DayNumber -
                                  today.DayNumber <= 30
                                    ? "PROXIMO_VENCER"
                                    : "VIGENTE",
                    Activo = lote.Activo
                }
            )
            .ToListAsync();
    }

    public async Task<LoteResponseDto?> GetByIdAsync(
        long idLote
    )
    {
        var today = DateOnly.FromDateTime(
            DateTime.UtcNow
        );

        return await _context.Lotes
            .AsNoTracking()
            .Where(lote =>
                lote.IdLote == idLote
            )
            .Select(lote =>
                new LoteResponseDto
                {
                    IdLote = lote.IdLote,
                    IdProducto =
                        lote.IdProducto,
                    Producto =
                        lote.Producto.Nombre,
                    CodigoBarras =
                        lote.Producto.CodigoBarras,
                    CodigoLote =
                        lote.CodigoLote,
                    CantidadInicial =
                        lote.CantidadInicial,
                    CantidadDisponible =
                        lote.CantidadDisponible,
                    FechaVencimiento =
                        lote.FechaVencimiento,
                    DiasParaVencer =
                        lote.FechaVencimiento
                            .DayNumber -
                        today.DayNumber,
                    Estado =
                        lote.CantidadDisponible <= 0
                            ? "AGOTADO"
                            : lote.FechaVencimiento <
                              today
                                ? "VENCIDO"
                                : lote.FechaVencimiento
                                      .DayNumber -
                                  today.DayNumber <= 30
                                    ? "PROXIMO_VENCER"
                                    : "VIGENTE",
                    Activo = lote.Activo
                }
            )
            .SingleOrDefaultAsync();
    }
}