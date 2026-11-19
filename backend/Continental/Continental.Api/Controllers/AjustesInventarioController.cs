using System.Security.Claims;
using Continental.Api.DTOs.Ajustes;
using Continental.Api.Services.Ajustes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Continental.Api.Controllers;

[ApiController]
[Authorize(Roles = "PROPIETARIO")]
[Route("api/ajustes-inventario")]
public class AjustesInventarioController : ControllerBase
{
    private readonly IAjusteInventarioService
        _ajusteService;

    public AjustesInventarioController(
        IAjusteInventarioService ajusteService
    )
    {
        _ajusteService = ajusteService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] long? idProducto = null,
        [FromQuery] int limit = 50
    )
    {
        var adjustments = await _ajusteService
            .GetAllAsync(idProducto, limit);

        return Ok(new
        {
            data = adjustments
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateAjusteInventarioDto request
    )
    {
        var userIdClaim = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (!long.TryParse(
                userIdClaim,
                out var idUsuario))
        {
            return Unauthorized(new
            {
                message =
                    "No se pudo identificar al usuario."
            });
        }

        var result = await _ajusteService
            .CreateAsync(request, idUsuario);

        if (!result.Success)
        {
            return result.Error switch
            {
                AjusteInventarioError.ProductNotFound =>
                    NotFound(new
                    {
                        message = result.Message
                    }),

                AjusteInventarioError.InsufficientStock =>
                    Conflict(new
                    {
                        message = result.Message
                    }),

                AjusteInventarioError.InvalidType =>
                    BadRequest(new
                    {
                        message = result.Message
                    }),

                AjusteInventarioError.InvalidQuantity =>
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

        return Ok(new
        {
            message = result.Message,
            data = result.Data
        });
    }
}