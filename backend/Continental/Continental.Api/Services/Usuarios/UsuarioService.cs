using Continental.Api.DataAccess;
using Continental.Api.DTOs.Usuarios;
using Continental.Api.Models.DataModels;
using Microsoft.EntityFrameworkCore;

namespace Continental.Api.Services.Usuarios;

public class UsuarioService : IUsuarioService
{
    private const string OwnerRole = "PROPIETARIO";

    private readonly ContinentalContext _context;

    public UsuarioService(
        ContinentalContext context
    )
    {
        _context = context;
    }

    public async Task<IReadOnlyCollection<UsuarioResponseDto>>
    GetAllAsync(
        string? search = null,
        bool includeInactive = false
    )
    {
        var query = _context.Usuarios
            .AsNoTracking()
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(usuario =>
                usuario.Activo
            );
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search
                .Trim()
                .ToLower();

            query = query.Where(usuario =>
                usuario.Nombres
                    .ToLower()
                    .Contains(normalizedSearch) ||
                usuario.Correo
                    .ToLower()
                    .Contains(normalizedSearch)
            );
        }

        return await query
            .OrderBy(usuario => usuario.Nombres)
            .Select(usuario =>
                new UsuarioResponseDto
                {
                    IdUsuario =
                        usuario.IdUsuario,

                    IdRol =
                        usuario.IdRol,

                    Rol =
                        usuario.Rol.Nombre,

                    Nombres =
                        usuario.Nombres,

                    Correo =
                        usuario.Correo,

                    Activo =
                        usuario.Activo,

                    CreatedAt =
                        usuario.CreatedAt,

                    UpdatedAt =
                        usuario.UpdatedAt
                }
            )
            .ToListAsync();
    }

    public async Task<UsuarioResponseDto?> GetByIdAsync(
        long idUsuario
    )
    {
        return await _context.Usuarios
            .AsNoTracking()
            .Where(usuario =>
                usuario.IdUsuario == idUsuario
            )
            .Select(usuario =>
                new UsuarioResponseDto
                {
                    IdUsuario =
                        usuario.IdUsuario,

                    IdRol =
                        usuario.IdRol,

                    Rol =
                        usuario.Rol.Nombre,

                    Nombres =
                        usuario.Nombres,

                    Correo =
                        usuario.Correo,

                    Activo =
                        usuario.Activo,

                    CreatedAt =
                        usuario.CreatedAt,

                    UpdatedAt =
                        usuario.UpdatedAt
                }
            )
            .SingleOrDefaultAsync();
    }

    public async Task<IReadOnlyCollection<RolResponseDto>>
    GetRolesAsync()
    {
        return await _context.Roles
            .AsNoTracking()
            .Where(rol => rol.Activo)
            .OrderBy(rol => rol.Nombre)
            .Select(rol =>
                new RolResponseDto
                {
                    IdRol =
                        rol.IdRol,

                    Nombre =
                        rol.Nombre,

                    Descripcion =
                        rol.Descripcion,

                    Activo =
                        rol.Activo
                }
            )
            .ToListAsync();
    }

    public async Task<UsuarioResult> CreateAsync(
        CreateUsuarioDto request
    )
    {
        var roleIsValid = await _context.Roles
            .AnyAsync(rol =>
                rol.IdRol == request.IdRol &&
                rol.Activo
            );

        if (!roleIsValid)
        {
            return UsuarioResult.Fail(
                "El rol seleccionado no existe o está inactivo.",
                UsuarioError.InvalidRole
            );
        }

        var normalizedEmail = NormalizeEmail(
            request.Correo
        );

        var emailExists = await _context.Usuarios
            .AnyAsync(usuario =>
                usuario.Correo == normalizedEmail
            );

        if (emailExists)
        {
            return UsuarioResult.Fail(
                "El correo ya está registrado.",
                UsuarioError.DuplicateEmail
            );
        }

        var user = new Usuario
        {
            IdRol = request.IdRol,

            Nombres =
                request.Nombres.Trim(),

            Correo =
                normalizedEmail,

            PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(
                    request.Password
                ),

            Activo = true
        };

        await _context.Usuarios.AddAsync(user);
        await _context.SaveChangesAsync();

        var response = await GetByIdAsync(
            user.IdUsuario
        );

        return UsuarioResult.Ok(
            response,
            "Usuario registrado correctamente."
        );
    }

    public async Task<UsuarioResult> UpdateAsync(
        long idUsuario,
        UpdateUsuarioDto request
    )
    {
        var user = await _context.Usuarios
            .Include(usuario => usuario.Rol)
            .SingleOrDefaultAsync(usuario =>
                usuario.IdUsuario == idUsuario
            );

        if (user is null)
        {
            return UsuarioResult.Fail(
                "El usuario no existe.",
                UsuarioError.NotFound
            );
        }

        var role = await _context.Roles
            .SingleOrDefaultAsync(rol =>
                rol.IdRol == request.IdRol &&
                rol.Activo
            );

        if (role is null)
        {
            return UsuarioResult.Fail(
                "El rol seleccionado no existe o está inactivo.",
                UsuarioError.InvalidRole
            );
        }

        var normalizedEmail = NormalizeEmail(
            request.Correo
        );

        var emailExists = await _context.Usuarios
            .AnyAsync(otherUser =>
                otherUser.IdUsuario != idUsuario &&
                otherUser.Correo ==
                normalizedEmail
            );

        if (emailExists)
        {
            return UsuarioResult.Fail(
                "El correo ya está registrado.",
                UsuarioError.DuplicateEmail
            );
        }

        if (user.Rol.Nombre == OwnerRole &&
            role.Nombre != OwnerRole)
        {
            var activeOwners =
                await _context.Usuarios
                    .CountAsync(usuario =>
                        usuario.Activo &&
                        usuario.Rol.Nombre ==
                        OwnerRole
                    );

            if (activeOwners <= 1)
            {
                return UsuarioResult.Fail(
                    "No se puede cambiar el rol del único " +
                    "propietario activo.",
                    UsuarioError.LastActiveOwner
                );
            }
        }

        user.IdRol = role.IdRol;
        user.Nombres = request.Nombres.Trim();
        user.Correo = normalizedEmail;

        await _context.SaveChangesAsync();

        var response = await GetByIdAsync(idUsuario);

        return UsuarioResult.Ok(
            response,
            "Usuario actualizado correctamente."
        );
    }

    public async Task<UsuarioResult> ChangeStatusAsync(
        long idUsuario,
        bool activo,
        long currentUserId
    )
    {
        var user = await _context.Usuarios
            .Include(usuario => usuario.Rol)
            .SingleOrDefaultAsync(usuario =>
                usuario.IdUsuario == idUsuario
            );

        if (user is null)
        {
            return UsuarioResult.Fail(
                "El usuario no existe.",
                UsuarioError.NotFound
            );
        }

        if (!activo &&
            idUsuario == currentUserId)
        {
            return UsuarioResult.Fail(
                "No puede desactivar su propia cuenta.",
                UsuarioError.LastActiveOwner
            );
        }

        if (!activo &&
            user.Rol.Nombre == OwnerRole)
        {
            var activeOwners =
                await _context.Usuarios
                    .CountAsync(usuario =>
                        usuario.Activo &&
                        usuario.Rol.Nombre ==
                        OwnerRole
                    );

            if (activeOwners <= 1)
            {
                return UsuarioResult.Fail(
                    "No se puede desactivar al único " +
                    "propietario activo.",
                    UsuarioError.LastActiveOwner
                );
            }
        }

        user.Activo = activo;

        await _context.SaveChangesAsync();

        var response = await GetByIdAsync(idUsuario);

        var message = activo
            ? "Usuario activado correctamente."
            : "Usuario desactivado correctamente.";

        return UsuarioResult.Ok(
            response,
            message
        );
    }

    public async Task<UsuarioResult> ResetPasswordAsync(
        long idUsuario,
        ResetPasswordDto request
    )
    {
        var user = await _context.Usuarios
            .SingleOrDefaultAsync(usuario =>
                usuario.IdUsuario == idUsuario
            );

        if (user is null)
        {
            return UsuarioResult.Fail(
                "El usuario no existe.",
                UsuarioError.NotFound
            );
        }

        user.PasswordHash =
            BCrypt.Net.BCrypt.HashPassword(
                request.NuevaPassword
            );

        await _context.SaveChangesAsync();

        var response = await GetByIdAsync(idUsuario);

        return UsuarioResult.Ok(
            response,
            "Contraseña restablecida correctamente."
        );
    }

    private static string NormalizeEmail(
        string email
    )
    {
        return email
            .Trim()
            .ToLowerInvariant();
    }
}