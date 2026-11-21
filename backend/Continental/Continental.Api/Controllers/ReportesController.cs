using Continental.Api.Services.Reportes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Continental.Api.Controllers;

[ApiController]
[Authorize(Roles = "PROPIETARIO")]
[Route("api/reportes")]
public class ReportesController : ControllerBase
{
    private readonly IReporteService
        _reporteService;

    public ReportesController(
        IReporteService reporteService
    )
    {
        _reporteService = reporteService;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(
        [FromQuery] DateTime? fechaInicio = null,
        [FromQuery] DateTime? fechaFin = null
    )
    {
        if (HasInvalidRange(
                fechaInicio,
                fechaFin))
        {
            return BadRequest(new
            {
                message =
                    "La fecha inicial no puede ser " +
                    "posterior a la fecha final."
            });
        }

        var dashboard = await _reporteService
            .GetDashboardAsync(
                fechaInicio,
                fechaFin
            );

        return Ok(new
        {
            data = dashboard
        });
    }

    [HttpGet("balance")]
    public async Task<IActionResult> GetBalance(
        [FromQuery] DateTime fechaInicio,
        [FromQuery] DateTime fechaFin
    )
    {
        if (fechaInicio == default ||
            fechaFin == default)
        {
            return BadRequest(new
            {
                message =
                    "Las fechas de inicio y fin " +
                    "son obligatorias."
            });
        }

        if (fechaInicio.Date > fechaFin.Date)
        {
            return BadRequest(new
            {
                message =
                    "La fecha inicial no puede ser " +
                    "posterior a la fecha final."
            });
        }

        var balance = await _reporteService
            .GetBalanceAsync(
                fechaInicio,
                fechaFin
            );

        return Ok(new
        {
            data = balance
        });
    }

    [HttpGet("productos-mas-vendidos")]
    public async Task<IActionResult> GetTopProducts(
        [FromQuery] DateTime fechaInicio,
        [FromQuery] DateTime fechaFin,
        [FromQuery] int limit = 10
    )
    {
        if (fechaInicio == default ||
            fechaFin == default)
        {
            return BadRequest(new
            {
                message =
                    "Las fechas de inicio y fin " +
                    "son obligatorias."
            });
        }

        if (fechaInicio.Date > fechaFin.Date)
        {
            return BadRequest(new
            {
                message =
                    "La fecha inicial no puede ser " +
                    "posterior a la fecha final."
            });
        }

        var products = await _reporteService
            .GetTopProductsAsync(
                fechaInicio,
                fechaFin,
                limit
            );

        return Ok(new
        {
            data = products
        });
    }

    private static bool HasInvalidRange(
        DateTime? fechaInicio,
        DateTime? fechaFin
    )
    {
        return fechaInicio.HasValue &&
               fechaFin.HasValue &&
               fechaInicio.Value.Date >
               fechaFin.Value.Date;
    }
}