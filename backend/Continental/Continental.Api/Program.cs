using Continental.Api.DataAccess;
using Continental.Api.Services.Auth;
using Continental.Api.Services.Ajustes;
using Continental.Api.Services.Alertas;
using Continental.Api.Services.Categorias;
using Continental.Api.Services.Compras;
using Continental.Api.Services.Inventario;
using Continental.Api.Services.Lotes;
using Continental.Api.Services.Productos;
using Continental.Api.Services.Proveedores;
using Continental.Api.Services.Reportes;
using Continental.Api.Services.Ventas;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

const string connectionStringName = "DefaultConnection";

var connectionString = builder.Configuration
    .GetConnectionString(connectionStringName);

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "No se encontró la cadena de conexión DefaultConnection."
    );
}

builder.Services.AddDbContext<ContinentalContext>(options =>
{
    options.UseNpgsql(connectionString);
});

builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddScoped<ICategoriaService, CategoriaService>();

builder.Services.AddScoped<IProductoService, ProductoService>();

builder.Services.AddScoped<IProveedorService, ProveedorService>();

builder.Services.AddScoped<ICompraService, CompraService>();

builder.Services.AddScoped<ILoteService, LoteService>();

builder.Services.AddScoped<IInventarioService, InventarioService>();

builder.Services.AddScoped<IAjusteInventarioService, AjusteInventarioService>();

builder.Services.AddScoped<IVentaService, VentaService>();

builder.Services.AddScoped<IAlertaService, AlertaService>();

builder.Services.AddScoped<IReporteService, ReporteService>();

var jwtSection = builder.Configuration
    .GetSection("JwtSettings");

var jwtKey = jwtSection["Key"];

if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException(
        "No se encontró la clave JWT."
    );
}

var key = Encoding.UTF8.GetBytes(jwtKey);

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultChallengeScheme =
            JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer =
                    jwtSection["Issuer"],

                ValidAudience =
                    jwtSection["Audience"],

                IssuerSigningKey =
                    new SymmetricSecurityKey(key),

                ClockSkew = TimeSpan.Zero
            };
    });

builder.Services.AddAuthorization();

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "Continental API",
            Version = "v1",
            Description =
                "API para la gestión de productos, " +
                "compras, inventario, ventas, " +
                "alertas y reportes."
        }
    );

    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description =
                "Ingrese el token JWT."
        }
    );

    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference =
                        new OpenApiReference
                        {
                            Type =
                                ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                },
                Array.Empty<string>()
            }
        }
    );
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    var context = services
        .GetRequiredService<ContinentalContext>();

    await DbInitializer.InitializeAsync(
        context,
        builder.Configuration
    );
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();