using Continental.Api.Services.Inventario;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Continental.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/inventario")]
public class InventarioController : ControllerBase
{
    private readonly IInventarioService
        _inventarioService;

    public InventarioController(
        IInventarioService inventarioService
    )
    {
        _inventarioService = inventarioService;
    }

    [HttpGet]
    public async Task<IActionResult> GetInventory(
        [FromQuery] string? search = null,
        [FromQuery] long? idCategoria = null,
        [FromQuery] string? estado = null,
        [FromQuery] bool includeInactive = false
    )
    {
        var inventory = await _inventarioService
            .GetInventoryAsync(
                search,
                idCategoria,
                estado,
                includeInactive
            );

        return Ok(new
        {
            data = inventory
        });
    }

    [HttpGet("resumen")]
    public async Task<IActionResult> GetSummary()
    {
        var summary = await _inventarioService
            .GetSummaryAsync();

        return Ok(new
        {
            data = summary
        });
    }

    [HttpGet("movimientos")]
    public async Task<IActionResult> GetRecentMovements(
        [FromQuery] int limit = 20
    )
    {
        var movements = await _inventarioService
            .GetRecentMovementsAsync(limit);

        return Ok(new
        {
            data = movements
        });
    }

    [HttpGet("{idProducto:long}/kardex")]
    public async Task<IActionResult> GetKardex(
        long idProducto,
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
                    "La fecha inicial no puede ser " +
                    "posterior a la fecha final."
            });
        }

        var kardex = await _inventarioService
            .GetKardexAsync(
                idProducto,
                fechaInicio,
                fechaFin
            );

        if (kardex is null)
        {
            return NotFound(new
            {
                message = "El producto no existe."
            });
        }

        return Ok(new
        {
            data = kardex
        });
    }
}