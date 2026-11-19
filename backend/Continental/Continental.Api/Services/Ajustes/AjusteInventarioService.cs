using Continental.Api.DataAccess;
using Continental.Api.DTOs.Ajustes;
using Continental.Api.Models.DataModels;
using Microsoft.EntityFrameworkCore;

namespace Continental.Api.Services.Ajustes;

public class AjusteInventarioService
    : IAjusteInventarioService
{
    private readonly ContinentalContext _context;

    public AjusteInventarioService(
        ContinentalContext context
    )
    {
        _context = context;
    }

    public async Task<AjusteInventarioResult> CreateAsync(
        CreateAjusteInventarioDto request,
        long idUsuario
    )
    {
        if (request.Cantidad <= 0)
        {
            return AjusteInventarioResult.Fail(
                "La cantidad debe ser mayor que cero.",
                AjusteInventarioError.InvalidQuantity
            );
        }

        var normalizedType = request.Tipo
            .Trim()
            .ToUpperInvariant();

        if (normalizedType != "ENTRADA" &&
            normalizedType != "SALIDA")
        {
            return AjusteInventarioResult.Fail(
                "El tipo debe ser ENTRADA o SALIDA.",
                AjusteInventarioError.InvalidType
            );
        }

        var product = await _context.Productos
            .SingleOrDefaultAsync(producto =>
                producto.IdProducto == request.IdProducto &&
                producto.Activo
            );

        if (product is null)
        {
            return AjusteInventarioResult.Fail(
                "El producto no existe o está inactivo.",
                AjusteInventarioError.ProductNotFound
            );
        }

        var stockAnterior = product.StockActual;

        if (normalizedType == "SALIDA" &&
            request.Cantidad > stockAnterior)
        {
            return AjusteInventarioResult.Fail(
                $"No existe stock suficiente. " +
                $"Stock disponible: {stockAnterior}.",
                AjusteInventarioError.InsufficientStock
            );
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            if (normalizedType == "ENTRADA")
            {
                product.StockActual += request.Cantidad;
            }
            else
            {
                product.StockActual -= request.Cantidad;
            }

            var movement = new MovimientoInventario
            {
                IdProducto = product.IdProducto,
                IdUsuario = idUsuario,

                Tipo = normalizedType == "ENTRADA"
                    ? "AJUSTE_ENTRADA"
                    : "AJUSTE_SALIDA",

                ReferenciaId = null,

                Entrada = normalizedType == "ENTRADA"
                    ? request.Cantidad
                    : 0,

                Salida = normalizedType == "SALIDA"
                    ? request.Cantidad
                    : 0,

                Saldo = product.StockActual,

                Motivo = request.Motivo.Trim(),

                Fecha = DateTime.UtcNow
            };

            await _context.MovimientosInventario
                .AddAsync(movement);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            var response =
                new AjusteInventarioResponseDto
                {
                    IdMovimiento = movement.IdMovimiento,
                    IdProducto = product.IdProducto,
                    Producto = product.Nombre,
                    CodigoBarras = product.CodigoBarras,
                    IdUsuario = idUsuario,
                    Usuario = string.Empty,
                    Tipo = movement.Tipo,
                    Cantidad = request.Cantidad,
                    StockAnterior = stockAnterior,
                    StockActual = product.StockActual,
                    Motivo = movement.Motivo!,
                    Fecha = movement.Fecha
                };

            var userName = await _context.Usuarios
                .AsNoTracking()
                .Where(usuario =>
                    usuario.IdUsuario == idUsuario
                )
                .Select(usuario => usuario.Nombres)
                .SingleAsync();

            response.Usuario = userName;

            return AjusteInventarioResult.Ok(
                response,
                "Ajuste de inventario registrado correctamente."
            );
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<IReadOnlyCollection<
        AjusteInventarioResponseDto
    >> GetAllAsync(
        long? idProducto = null,
        int limit = 50
    )
    {
        limit = Math.Clamp(limit, 1, 100);

        var query = _context.MovimientosInventario
            .AsNoTracking()
            .Where(movimiento =>
                movimiento.Tipo == "AJUSTE_ENTRADA" ||
                movimiento.Tipo == "AJUSTE_SALIDA"
            );

        if (idProducto.HasValue)
        {
            query = query.Where(movimiento =>
                movimiento.IdProducto ==
                idProducto.Value
            );
        }

        return await query
            .OrderByDescending(movimiento =>
                movimiento.Fecha)
            .Take(limit)
            .Select(movimiento =>
                new AjusteInventarioResponseDto
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

                    Cantidad =
                        movimiento.Entrada > 0
                            ? movimiento.Entrada
                            : movimiento.Salida,

                    StockAnterior =
                        movimiento.Tipo ==
                        "AJUSTE_ENTRADA"
                            ? movimiento.Saldo -
                              movimiento.Entrada
                            : movimiento.Saldo +
                              movimiento.Salida,

                    StockActual =
                        movimiento.Saldo,

                    Motivo =
                        movimiento.Motivo ?? string.Empty,

                    Fecha =
                        movimiento.Fecha
                }
            )
            .ToListAsync();
    }
}