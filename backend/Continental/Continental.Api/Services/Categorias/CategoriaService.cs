using Continental.Api.DataAccess;
using Continental.Api.DTOs.Categorias;
using Continental.Api.Models.DataModels;
using Microsoft.EntityFrameworkCore;

namespace Continental.Api.Services.Categorias;

public class CategoriaService : ICategoriaService
{
    private readonly ContinentalContext _context;

    public CategoriaService(
        ContinentalContext context
    )
    {
        _context = context;
    }

    public async Task<IReadOnlyCollection<CategoriaResponseDto>>
    GetAllAsync(
        bool includeInactive = false
    )
    {
        var query = _context.Categorias
            .AsNoTracking();

        if (!includeInactive)
        {
            query = query.Where(categoria =>
                categoria.Activo
            );
        }

        return await query
            .OrderBy(categoria => categoria.Nombre)
            .Select(categoria => ToResponse(categoria))
            .ToListAsync();
    }

    public async Task<CategoriaResponseDto?> GetByIdAsync(
        long idCategoria
    )
    {
        return await _context.Categorias
            .AsNoTracking()
            .Where(categoria =>
                categoria.IdCategoria == idCategoria
            )
            .Select(categoria => ToResponse(categoria))
            .SingleOrDefaultAsync();
    }

    public async Task<CategoriaResult> CreateAsync(
        CreateCategoriaDto request
    )
    {
        var normalizedName = NormalizeName(request.Nombre);

        var exists = await _context.Categorias
            .AnyAsync(categoria =>
                categoria.Nombre.ToLower() ==
                normalizedName.ToLower()
            );

        if (exists)
        {
            return CategoriaResult.Fail(
                "Ya existe una categoría con ese nombre."
            );
        }

        var category = new Categoria
        {
            Nombre = normalizedName,
            Descripcion = NormalizeOptionalText(
                request.Descripcion
            ),
            Activo = true
        };

        await _context.Categorias.AddAsync(category);
        await _context.SaveChangesAsync();

        return CategoriaResult.Ok(
            ToResponse(category),
            "Categoría registrada correctamente."
        );
    }

    public async Task<CategoriaResult> UpdateAsync(
        long idCategoria,
        UpdateCategoriaDto request
    )
    {
        var category = await _context.Categorias
            .SingleOrDefaultAsync(categoria =>
                categoria.IdCategoria == idCategoria
            );

        if (category is null)
        {
            return CategoriaResult.Fail(
                "La categoría no existe."
            );
        }

        var normalizedName = NormalizeName(request.Nombre);

        var duplicateExists = await _context.Categorias
            .AnyAsync(categoria =>
                categoria.IdCategoria != idCategoria &&
                categoria.Nombre.ToLower() ==
                normalizedName.ToLower()
            );

        if (duplicateExists)
        {
            return CategoriaResult.Fail(
                "Ya existe otra categoría con ese nombre."
            );
        }

        category.Nombre = normalizedName;
        category.Descripcion =
            NormalizeOptionalText(request.Descripcion);

        await _context.SaveChangesAsync();

        return CategoriaResult.Ok(
            ToResponse(category),
            "Categoría actualizada correctamente."
        );
    }

    public async Task<CategoriaResult> ChangeStatusAsync(
        long idCategoria,
        bool activo
    )
    {
        var category = await _context.Categorias
            .SingleOrDefaultAsync(categoria =>
                categoria.IdCategoria == idCategoria
            );

        if (category is null)
        {
            return CategoriaResult.Fail(
                "La categoría no existe."
            );
        }

        category.Activo = activo;

        await _context.SaveChangesAsync();

        var message = activo
            ? "Categoría activada correctamente."
            : "Categoría desactivada correctamente.";

        return CategoriaResult.Ok(
            ToResponse(category),
            message
        );
    }

    private static CategoriaResponseDto ToResponse(
        Categoria category
    )
    {
        return new CategoriaResponseDto
        {
            IdCategoria = category.IdCategoria,
            Nombre = category.Nombre,
            Descripcion = category.Descripcion,
            Activo = category.Activo,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt
        };
    }

    private static string NormalizeName(string value)
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