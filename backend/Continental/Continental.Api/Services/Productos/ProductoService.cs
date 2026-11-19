using Continental.Api.DataAccess;
using Continental.Api.DTOs.Productos;
using Continental.Api.Models.DataModels;
using Microsoft.EntityFrameworkCore;

namespace Continental.Api.Services.Productos;

public class ProductoService : IProductoService
{
    private readonly ContinentalContext _context;

    public ProductoService(
        ContinentalContext context
    )
    {
        _context = context;
    }

    public async Task<IReadOnlyCollection<ProductoResponseDto>>
    GetAllAsync(
        string? search = null,
        long? idCategoria = null,
        bool includeInactive = false
    )
    {
        var query = _context.Productos
            .AsNoTracking()
            .Include(producto => producto.Categoria)
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

        return await query
            .OrderBy(producto => producto.Nombre)
            .Select(producto =>
                new ProductoResponseDto
                {
                    IdProducto =
                        producto.IdProducto,

                    IdCategoria =
                        producto.IdCategoria,

                    Categoria =
                        producto.Categoria.Nombre,

                    CodigoBarras =
                        producto.CodigoBarras,

                    Nombre =
                        producto.Nombre,

                    Descripcion =
                        producto.Descripcion,

                    PrecioCompra =
                        producto.PrecioCompra,

                    PrecioVenta =
                        producto.PrecioVenta,

                    StockActual =
                        producto.StockActual,

                    StockMinimo =
                        producto.StockMinimo,

                    ControlaVencimiento =
                        producto.ControlaVencimiento,

                    Activo =
                        producto.Activo,

                    EstadoStock =
                        producto.StockActual <= 0
                            ? "SIN_STOCK"
                            : producto.StockActual <=
                              producto.StockMinimo
                                ? "STOCK_MINIMO"
                                : "DISPONIBLE",

                    CreatedAt =
                        producto.CreatedAt,

                    UpdatedAt =
                        producto.UpdatedAt
                }
            )
            .ToListAsync();
    }

    public async Task<ProductoResponseDto?> GetByIdAsync(
        long idProducto
    )
    {
        return await _context.Productos
            .AsNoTracking()
            .Where(producto =>
                producto.IdProducto == idProducto
            )
            .Select(producto =>
                new ProductoResponseDto
                {
                    IdProducto =
                        producto.IdProducto,

                    IdCategoria =
                        producto.IdCategoria,

                    Categoria =
                        producto.Categoria.Nombre,

                    CodigoBarras =
                        producto.CodigoBarras,

                    Nombre =
                        producto.Nombre,

                    Descripcion =
                        producto.Descripcion,

                    PrecioCompra =
                        producto.PrecioCompra,

                    PrecioVenta =
                        producto.PrecioVenta,

                    StockActual =
                        producto.StockActual,

                    StockMinimo =
                        producto.StockMinimo,

                    ControlaVencimiento =
                        producto.ControlaVencimiento,

                    Activo =
                        producto.Activo,

                    EstadoStock =
                        producto.StockActual <= 0
                            ? "SIN_STOCK"
                            : producto.StockActual <=
                              producto.StockMinimo
                                ? "STOCK_MINIMO"
                                : "DISPONIBLE",

                    CreatedAt =
                        producto.CreatedAt,

                    UpdatedAt =
                        producto.UpdatedAt
                }
            )
            .SingleOrDefaultAsync();
    }

    public async Task<ProductoResponseDto?>
    GetByBarcodeAsync(
        string codigoBarras
    )
    {
        var normalizedBarcode = codigoBarras.Trim();

        return await _context.Productos
            .AsNoTracking()
            .Where(producto =>
                producto.CodigoBarras ==
                normalizedBarcode &&
                producto.Activo
            )
            .Select(producto =>
                new ProductoResponseDto
                {
                    IdProducto =
                        producto.IdProducto,

                    IdCategoria =
                        producto.IdCategoria,

                    Categoria =
                        producto.Categoria.Nombre,

                    CodigoBarras =
                        producto.CodigoBarras,

                    Nombre =
                        producto.Nombre,

                    Descripcion =
                        producto.Descripcion,

                    PrecioCompra =
                        producto.PrecioCompra,

                    PrecioVenta =
                        producto.PrecioVenta,

                    StockActual =
                        producto.StockActual,

                    StockMinimo =
                        producto.StockMinimo,

                    ControlaVencimiento =
                        producto.ControlaVencimiento,

                    Activo =
                        producto.Activo,

                    EstadoStock =
                        producto.StockActual <= 0
                            ? "SIN_STOCK"
                            : producto.StockActual <=
                              producto.StockMinimo
                                ? "STOCK_MINIMO"
                                : "DISPONIBLE",

                    CreatedAt =
                        producto.CreatedAt,

                    UpdatedAt =
                        producto.UpdatedAt
                }
            )
            .SingleOrDefaultAsync();
    }

    public async Task<ProductoResult> CreateAsync(
        CreateProductoDto request
    )
    {
        var codigoBarras =
            NormalizeRequiredText(request.CodigoBarras);

        var categoriaValida =
            await _context.Categorias
                .AnyAsync(categoria =>
                    categoria.IdCategoria ==
                    request.IdCategoria &&
                    categoria.Activo
                );

        if (!categoriaValida)
        {
            return ProductoResult.Fail(
                "La categoría seleccionada no existe " +
                "o se encuentra inactiva.",
                ProductoError.InvalidCategory
            );
        }

        var codigoDuplicado =
            await _context.Productos
                .AnyAsync(producto =>
                    producto.CodigoBarras ==
                    codigoBarras
                );

        if (codigoDuplicado)
        {
            return ProductoResult.Fail(
                "El código de barras ya está registrado.",
                ProductoError.DuplicateBarcode
            );
        }

        var producto = new Producto
        {
            IdCategoria =
                request.IdCategoria,

            CodigoBarras =
                codigoBarras,

            Nombre =
                NormalizeRequiredText(request.Nombre),

            Descripcion =
                NormalizeOptionalText(
                    request.Descripcion
                ),

            PrecioCompra =
                request.PrecioCompra,

            PrecioVenta =
                request.PrecioVenta,

            StockActual = 0,

            StockMinimo =
                request.StockMinimo,

            ControlaVencimiento =
                request.ControlaVencimiento,

            Activo = true
        };

        await _context.Productos.AddAsync(producto);
        await _context.SaveChangesAsync();

        var response = await GetByIdAsync(
            producto.IdProducto
        );

        return ProductoResult.Ok(
            response!,
            "Producto registrado correctamente."
        );
    }

    public async Task<ProductoResult> UpdateAsync(
        long idProducto,
        UpdateProductoDto request
    )
    {
        var producto = await _context.Productos
            .SingleOrDefaultAsync(producto =>
                producto.IdProducto == idProducto
            );

        if (producto is null)
        {
            return ProductoResult.Fail(
                "El producto no existe.",
                ProductoError.NotFound
            );
        }

        var categoriaValida =
            await _context.Categorias
                .AnyAsync(categoria =>
                    categoria.IdCategoria ==
                    request.IdCategoria &&
                    categoria.Activo
                );

        if (!categoriaValida)
        {
            return ProductoResult.Fail(
                "La categoría seleccionada no existe " +
                "o se encuentra inactiva.",
                ProductoError.InvalidCategory
            );
        }

        var codigoBarras =
            NormalizeRequiredText(request.CodigoBarras);

        var codigoDuplicado =
            await _context.Productos
                .AnyAsync(otherProduct =>
                    otherProduct.IdProducto !=
                    idProducto &&
                    otherProduct.CodigoBarras ==
                    codigoBarras
                );

        if (codigoDuplicado)
        {
            return ProductoResult.Fail(
                "El código de barras ya está registrado.",
                ProductoError.DuplicateBarcode
            );
        }

        producto.IdCategoria =
            request.IdCategoria;

        producto.CodigoBarras =
            codigoBarras;

        producto.Nombre =
            NormalizeRequiredText(request.Nombre);

        producto.Descripcion =
            NormalizeOptionalText(
                request.Descripcion
            );

        producto.PrecioCompra =
            request.PrecioCompra;

        producto.PrecioVenta =
            request.PrecioVenta;

        producto.StockMinimo =
            request.StockMinimo;

        producto.ControlaVencimiento =
            request.ControlaVencimiento;

        await _context.SaveChangesAsync();

        var response = await GetByIdAsync(idProducto);

        return ProductoResult.Ok(
            response!,
            "Producto actualizado correctamente."
        );
    }

    public async Task<ProductoResult> ChangeStatusAsync(
        long idProducto,
        bool activo
    )
    {
        var producto = await _context.Productos
            .SingleOrDefaultAsync(producto =>
                producto.IdProducto == idProducto
            );

        if (producto is null)
        {
            return ProductoResult.Fail(
                "El producto no existe.",
                ProductoError.NotFound
            );
        }

        producto.Activo = activo;

        await _context.SaveChangesAsync();

        var response = await GetByIdAsync(idProducto);

        var message = activo
            ? "Producto activado correctamente."
            : "Producto desactivado correctamente.";

        return ProductoResult.Ok(
            response!,
            message
        );
    }

    private static string NormalizeRequiredText(
        string value
    )
    {
        return value.Trim();
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