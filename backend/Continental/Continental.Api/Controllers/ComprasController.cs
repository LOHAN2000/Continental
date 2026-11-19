using System.Security.Claims;
using Continental.Api.DTOs.Compras;
using Continental.Api.Services.Compras;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Continental.Api.Controllers;

[ApiController]
[Authorize(Roles = "PROPIETARIO")]
[Route("api/compras")]
public class ComprasController : ControllerBase
{
    private readonly ICompraService _compraService;

    public ComprasController(
        ICompraService compraService
    )
    {
        _compraService = compraService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var purchases = await _compraService
            .GetAllAsync();

        return Ok(new
        {
            data = purchases
        });
    }

    [HttpGet("{idCompra:long}")]
    public async Task<IActionResult> GetById(
        long idCompra
    )
    {
        var purchase = await _compraService
            .GetByIdAsync(idCompra);

        if (purchase is null)
        {
            return NotFound(new
            {
                message = "La compra no existe."
            });
        }

        return Ok(new
        {
            data = purchase
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateCompraDto request
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

        var result = await _compraService
            .CreateAsync(request, idUsuario);

        if (!result.Success)
        {
            return result.Error switch
            {
                CompraError.InvalidProvider =>
                    BadRequest(new
                    {
                        message = result.Message
                    }),

                CompraError.InvalidProduct =>
                    BadRequest(new
                    {
                        message = result.Message
                    }),

                CompraError.InvalidDetails =>
                    BadRequest(new
                    {
                        message = result.Message
                    }),

                _ =>
                    BadRequest(new
                    {
                        message = result.Message
                    })
            };
        }

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                idCompra =
                result.Data!.IdCompra
            },
            new
            {
                message = result.Message,
                data = result.Data
            }
        );
    }
}