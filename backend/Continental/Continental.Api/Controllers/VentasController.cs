using System.Security.Claims;
using Continental.Api.DTOs.Ventas;
using Continental.Api.Services.Ventas;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Continental.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/ventas")]
public class VentasController : ControllerBase
{
    private readonly IVentaService _ventaService;

    public VentasController(
        IVentaService ventaService
    )
    {
        _ventaService = ventaService;
    }

    [Authorize(Roles = "PROPIETARIO")]
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] DateTime? fechaInicio = null,
        [FromQuery] DateTime? fechaFin = null
    )
    {
        if (fechaInicio.HasValue &&
            fechaFin.HasValue &&
            fechaInicio.Value.Date >
            fechaFin.Value.Date)
        {
            return BadRequest(new
            {
                message =
                    "La fecha inicial no puede ser posterior " +
                    "a la fecha final."
            });
        }

        var sales = await _ventaService
            .GetAllAsync(fechaInicio, fechaFin);

        return Ok(new
        {
            data = sales
        });
    }

    [Authorize(Roles = "PROPIETARIO")]
    [HttpGet("{idVenta:long}")]
    public async Task<IActionResult> GetById(
        long idVenta
    )
    {
        var sale = await _ventaService
            .GetByIdAsync(idVenta);

        if (sale is null)
        {
            return NotFound(new
            {
                message = "La venta no existe."
            });
        }

        return Ok(new
        {
            data = sale
        });
    }

    [Authorize(Roles = "PROPIETARIO,CAJERO")]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateVentaDto request
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

        var result = await _ventaService
            .CreateAsync(request, idUsuario);

        if (!result.Success)
        {
            return result.Error switch
            {
                VentaError.InvalidProduct =>
                    BadRequest(new
                    {
                        message = result.Message
                    }),

                VentaError.InvalidDetails =>
                    BadRequest(new
                    {
                        message = result.Message
                    }),

                VentaError.InsufficientStock =>
                    Conflict(new
                    {
                        message = result.Message
                    }),

                VentaError.InsufficientBatchStock =>
                    Conflict(new
                    {
                        message = result.Message
                    }),

                _ => BadRequest(new
                {
                    message = result.Message
                })
            };
        }

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                idVenta = result.Data!.IdVenta
            },
            new
            {
                message = result.Message,
                data = result.Data
            }
        );
    }
}