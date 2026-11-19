using Continental.Api.DataAccess;
using Continental.Api.DTOs.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Continental.Api.Services.Auth;

public class AuthService : IAuthService
{
    private readonly ContinentalContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(
        ContinentalContext context,
        IConfiguration configuration
    )
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResult> LoginAsync(
        LoginRequestDto request
    )
    {
        var normalizedEmail = request.Correo
            .Trim()
            .ToLowerInvariant();

        var user = await _context.Usuarios
            .AsNoTracking()
            .Include(usuario => usuario.Rol)
            .SingleOrDefaultAsync(usuario =>
                usuario.Correo == normalizedEmail
            );

        if (user is null ||
            !user.Activo ||
            !user.Rol.Activo)
        {
            return AuthResult.Fail(
                "Correo o contraseña incorrectos."
            );
        }

        var passwordIsValid =
            BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash
            );

        if (!passwordIsValid)
        {
            return AuthResult.Fail(
                "Correo o contraseña incorrectos."
            );
        }

        var expirationMinutes = _configuration
            .GetValue<int>(
                "JwtSettings:ExpirationMinutes"
            );

        if (expirationMinutes <= 0)
        {
            expirationMinutes = 480;
        }

        var expiration = DateTime.UtcNow
            .AddMinutes(expirationMinutes);

        var token = GenerateToken(
            user.IdUsuario,
            user.Nombres,
            user.Correo,
            user.Rol.Nombre,
            expiration
        );

        var response = new LoginResponseDto
        {
            Token = token,
            Expiration = expiration,
            Usuario = new UserSessionDto
            {
                IdUsuario = user.IdUsuario,
                Nombres = user.Nombres,
                Correo = user.Correo,
                Rol = user.Rol.Nombre
            }
        };

        return AuthResult.Ok(response);
    }

    private string GenerateToken(
        long userId,
        string names,
        string email,
        string role,
        DateTime expiration
    )
    {
        var jwtSection = _configuration
            .GetSection("JwtSettings");

        var jwtKey = jwtSection["Key"];

        if (string.IsNullOrWhiteSpace(jwtKey))
        {
            throw new InvalidOperationException(
                "No se encontró la clave JWT."
            );
        }

        var claims = new List<Claim>
        {
            new(
                JwtRegisteredClaimNames.Sub,
                userId.ToString()
            ),
            new(
                JwtRegisteredClaimNames.Email,
                email
            ),
            new(
                ClaimTypes.NameIdentifier,
                userId.ToString()
            ),
            new(
                ClaimTypes.Name,
                names
            ),
            new(
                ClaimTypes.Email,
                email
            ),
            new(
                ClaimTypes.Role,
                role
            )
        };

        var securityKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey)
        );

        var credentials = new SigningCredentials(
            securityKey,
            SecurityAlgorithms.HmacSha256
        );

        var token = new JwtSecurityToken(
            issuer: jwtSection["Issuer"],
            audience: jwtSection["Audience"],
            claims: claims,
            expires: expiration,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }
}