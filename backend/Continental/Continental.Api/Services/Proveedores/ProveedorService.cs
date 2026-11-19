using Continental.Api.DataAccess;
using Continental.Api.DTOs.Proveedores;
using Continental.Api.Models.DataModels;
using Microsoft.EntityFrameworkCore;

namespace Continental.Api.Services.Proveedores;

public class ProveedorService : IProveedorService
{
    private readonly ContinentalContext _context;

    public ProveedorService(
        ContinentalContext context
    )
    {
        _context = context;
    }

    public async Task<IReadOnlyCollection<ProveedorResponseDto>>
    GetAllAsync(
        string? search = null,
        bool includeInactive = false
    )
    {
        var query = _context.Proveedores
            .AsNoTracking()
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(proveedor =>
                proveedor.Activo
            );
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search
                .Trim()
                .ToLower();

            query = query.Where(proveedor =>
                proveedor.Documento
                    .ToLower()
                    .Contains(normalizedSearch) ||
                proveedor.RazonSocial
                    .ToLower()
                    .Contains(normalizedSearch)
            );
        }

        return await query
            .OrderBy(proveedor =>
                proveedor.RazonSocial)
            .Select(proveedor =>
                ToResponse(proveedor))
            .ToListAsync();
    }

    public async Task<ProveedorResponseDto?> GetByIdAsync(
        long idProveedor
    )
    {
        return await _context.Proveedores
            .AsNoTracking()
            .Where(proveedor =>
                proveedor.IdProveedor == idProveedor
            )
            .Select(proveedor =>
                ToResponse(proveedor))
            .SingleOrDefaultAsync();
    }

    public async Task<ProveedorResult> CreateAsync(
        CreateProveedorDto request
    )
    {
        var documento = NormalizeRequiredText(
            request.Documento
        );

        var documentExists = await _context.Proveedores
            .AnyAsync(proveedor =>
                proveedor.Documento == documento
            );

        if (documentExists)
        {
            return ProveedorResult.Fail(
                "El documento ya está registrado.",
                ProveedorError.DuplicateDocument
            );
        }

        var proveedor = new Proveedor
        {
            Documento = documento,

            RazonSocial = NormalizeRequiredText(
                request.RazonSocial
            ),

            Telefono = NormalizeOptionalText(
                request.Telefono
            ),

            Correo = NormalizeEmail(
                request.Correo
            ),

            Direccion = NormalizeOptionalText(
                request.Direccion
            ),

            Activo = true
        };

        await _context.Proveedores.AddAsync(proveedor);
        await _context.SaveChangesAsync();

        return ProveedorResult.Ok(
            ToResponse(proveedor),
            "Proveedor registrado correctamente."
        );
    }

    public async Task<ProveedorResult> UpdateAsync(
        long idProveedor,
        UpdateProveedorDto request
    )
    {
        var proveedor = await _context.Proveedores
            .SingleOrDefaultAsync(proveedor =>
                proveedor.IdProveedor == idProveedor
            );

        if (proveedor is null)
        {
            return ProveedorResult.Fail(
                "El proveedor no existe.",
                ProveedorError.NotFound
            );
        }

        var documento = NormalizeRequiredText(
            request.Documento
        );

        var duplicateDocument =
            await _context.Proveedores
                .AnyAsync(otherProvider =>
                    otherProvider.IdProveedor !=
                    idProveedor &&
                    otherProvider.Documento ==
                    documento
                );

        if (duplicateDocument)
        {
            return ProveedorResult.Fail(
                "El documento ya está registrado.",
                ProveedorError.DuplicateDocument
            );
        }

        proveedor.Documento = documento;

        proveedor.RazonSocial =
            NormalizeRequiredText(
                request.RazonSocial
            );

        proveedor.Telefono =
            NormalizeOptionalText(
                request.Telefono
            );

        proveedor.Correo =
            NormalizeEmail(
                request.Correo
            );

        proveedor.Direccion =
            NormalizeOptionalText(
                request.Direccion
            );

        await _context.SaveChangesAsync();

        return ProveedorResult.Ok(
            ToResponse(proveedor),
            "Proveedor actualizado correctamente."
        );
    }

    public async Task<ProveedorResult> ChangeStatusAsync(
        long idProveedor,
        bool activo
    )
    {
        var proveedor = await _context.Proveedores
            .SingleOrDefaultAsync(proveedor =>
                proveedor.IdProveedor == idProveedor
            );

        if (proveedor is null)
        {
            return ProveedorResult.Fail(
                "El proveedor no existe.",
                ProveedorError.NotFound
            );
        }

        proveedor.Activo = activo;

        await _context.SaveChangesAsync();

        var message = activo
            ? "Proveedor activado correctamente."
            : "Proveedor desactivado correctamente.";

        return ProveedorResult.Ok(
            ToResponse(proveedor),
            message
        );
    }

    private static ProveedorResponseDto ToResponse(
        Proveedor proveedor
    )
    {
        return new ProveedorResponseDto
        {
            IdProveedor =
                proveedor.IdProveedor,

            Documento =
                proveedor.Documento,

            RazonSocial =
                proveedor.RazonSocial,

            Telefono =
                proveedor.Telefono,

            Correo =
                proveedor.Correo,

            Direccion =
                proveedor.Direccion,

            Activo =
                proveedor.Activo,

            CreatedAt =
                proveedor.CreatedAt,

            UpdatedAt =
                proveedor.UpdatedAt
        };
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

    private static string? NormalizeEmail(
        string? email
    )
    {
        return string.IsNullOrWhiteSpace(email)
            ? null
            : email.Trim().ToLowerInvariant();
    }
}