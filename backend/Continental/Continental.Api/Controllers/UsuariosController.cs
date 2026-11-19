using System.Security.Claims;
using Continental.Api.DTOs.Usuarios;
using Continental.Api.Services.Usuarios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Continental.Api.Controllers;

[ApiController]
[Authorize(Roles = "PROPIETARIO")]
[Route("api/usuarios")]
public class UsuariosController : ControllerBase
{
    private readonly IUsuarioService _usuarioService;

    public UsuariosController(
        IUsuarioService usuarioService
    )
    {
        _usuarioService = usuarioService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] bool includeInactive = false
    )
    {
        var users = await _usuarioService
            .GetAllAsync(
                search,
                includeInactive
            );

        return Ok(new
        {
            data = users
        });
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _usuarioService
            .GetRolesAsync();

        return Ok(new
        {
            data = roles
        });
    }

    [HttpGet("{idUsuario:long}")]
    public async Task<IActionResult> GetById(
        long idUsuario
    )
    {
        var user = await _usuarioService
            .GetByIdAsync(idUsuario);

        if (user is null)
        {
            return NotFound(new
            {
                message = "El usuario no existe."
            });
        }

        return Ok(new
        {
            data = user
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateUsuarioDto request
    )
    {
        var result = await _usuarioService
            .CreateAsync(request);

        if (!result.Success)
        {
            return MapError(result);
        }

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                idUsuario =
                result.Data!.IdUsuario
            },
            new
            {
                message = result.Message,
                data = result.Data
            }
        );
    }

    [HttpPut("{idUsuario:long}")]
    public async Task<IActionResult> Update(
        long idUsuario,
        [FromBody] UpdateUsuarioDto request
    )
    {
        var result = await _usuarioService
            .UpdateAsync(
                idUsuario,
                request
            );

        if (!result.Success)
        {
            return MapError(result);
        }

        return Ok(new
        {
            message = result.Message,
            data = result.Data
        });
    }

    [HttpPatch("{idUsuario:long}/estado")]
    public async Task<IActionResult> ChangeStatus(
        long idUsuario,
        [FromQuery] bool activo
    )
    {
        var currentUserIdClaim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

        if (!long.TryParse(
                currentUserIdClaim,
                out var currentUserId))
        {
            return Unauthorized(new
            {
                message =
                    "No se pudo identificar al usuario."
            });
        }

        var result = await _usuarioService
            .ChangeStatusAsync(
                idUsuario,
                activo,
                currentUserId
            );

        if (!result.Success)
        {
            return MapError(result);
        }

        return Ok(new
        {
            message = result.Message,
            data = result.Data
        });
    }

    [HttpPatch("{idUsuario:long}/password")]
    public async Task<IActionResult> ResetPassword(
        long idUsuario,
        [FromBody] ResetPasswordDto request
    )
    {
        var result = await _usuarioService
            .ResetPasswordAsync(
                idUsuario,
                request
            );

        if (!result.Success)
        {
            return MapError(result);
        }

        return Ok(new
        {
            message = result.Message
        });
    }

    private IActionResult MapError(
        UsuarioResult result
    )
    {
        return result.Error switch
        {
            UsuarioError.NotFound =>
                NotFound(new
                {
                    message = result.Message
                }),

            UsuarioError.DuplicateEmail =>
                Conflict(new
                {
                    message = result.Message
                }),

            UsuarioError.InvalidRole =>
                BadRequest(new
                {
                    message = result.Message
                }),

            UsuarioError.LastActiveOwner =>
                Conflict(new
                {
                    message = result.Message
                }),

            UsuarioError.InvalidPassword =>
                BadRequest(new
                {
                    message = result.Message
                }),

            _ => BadRequest(new
            {
                message = result.Message
            })
        };
    }
}