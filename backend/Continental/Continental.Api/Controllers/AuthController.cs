using Continental.Api.DTOs.Auth;
using Continental.Api.Services.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Continental.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(
        IAuthService authService
    )
    {
        _authService = authService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequestDto request
    )
    {
        var result = await _authService
            .LoginAsync(request);

        if (!result.Success)
        {
            return Unauthorized(new
            {
                message = result.Message
            });
        }

        return Ok(new
        {
            message = result.Message,
            data = result.Data
        });
    }

    [Authorize]
    [HttpGet("session")]
    public IActionResult GetSession()
    {
        var userId = User.FindFirst(
            System.Security.Claims.ClaimTypes.NameIdentifier
        )?.Value;

        var names = User.FindFirst(
            System.Security.Claims.ClaimTypes.Name
        )?.Value;

        var email = User.FindFirst(
            System.Security.Claims.ClaimTypes.Email
        )?.Value;

        var role = User.FindFirst(
            System.Security.Claims.ClaimTypes.Role
        )?.Value;

        return Ok(new
        {
            idUsuario = userId,
            nombres = names,
            correo = email,
            rol = role
        });
    }
}