using Continental.Api.Models.DataModels;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Continental.Api.DataAccess;

public static class DbInitializer
{
    private const string PropietarioRole = "PROPIETARIO";
    private const string CajeroRole = "CAJERO";

    public static async Task InitializeAsync(
        ContinentalContext context,
        IConfiguration configuration
    )
    {
        await context.Database.MigrateAsync();

        await CreateRolesAsync(context);

        await CreateAdministratorAsync(
            context,
            configuration
        );
    }

    private static async Task CreateRolesAsync(
        ContinentalContext context
    )
    {
        var requiredRoles = new[]
        {
            new Rol
            {
                Nombre = PropietarioRole,
                Descripcion =
                    "Administra el catálogo, inventario, ventas, " +
                    "alertas y reportes."
            },
            new Rol
            {
                Nombre = CajeroRole,
                Descripcion =
                    "Registra ventas y consulta productos."
            }
        };

        foreach (var requiredRole in requiredRoles)
        {
            var roleExists = await context.Roles
                .AnyAsync(rol =>
                    rol.Nombre == requiredRole.Nombre
                );

            if (!roleExists)
            {
                await context.Roles.AddAsync(requiredRole);
            }
        }

        await context.SaveChangesAsync();
    }

    private static async Task CreateAdministratorAsync(
        ContinentalContext context,
        IConfiguration configuration
    )
    {
        var nombres = configuration["SeedAdmin:Nombres"];
        var correo = configuration["SeedAdmin:Correo"];
        var password = configuration["SeedAdmin:Password"];

        if (string.IsNullOrWhiteSpace(nombres) ||
            string.IsNullOrWhiteSpace(correo) ||
            string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        correo = correo.Trim().ToLowerInvariant();

        var administratorExists = await context.Usuarios
            .AnyAsync(usuario =>
                usuario.Correo == correo
            );

        if (administratorExists)
        {
            return;
        }

        var propietarioRole = await context.Roles
            .SingleAsync(rol =>
                rol.Nombre == PropietarioRole
            );

        var administrator = new Usuario
        {
            IdRol = propietarioRole.IdRol,
            Nombres = nombres.Trim(),
            Correo = correo,
            PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(password),
            Activo = true
        };

        await context.Usuarios.AddAsync(administrator);
        await context.SaveChangesAsync();
    }
}