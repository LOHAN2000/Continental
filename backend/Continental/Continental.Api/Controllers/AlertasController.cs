using Continental.Api.Services.Alertas;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Continental.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/alertas")]
public class AlertasController : ControllerBase
{
    private readonly IAlertaService _alertaService;

    public AlertasController(
        IAlertaService alertaService
    )
    {
        _alertaService = alertaService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? tipo = null,
        [FromQuery] bool? leida = null,
        [FromQuery] bool includeInactive = false
    )
    {
        await _alertaService.GenerateAsync();

        var alerts = await _alertaService
            .GetAllAsync(
                tipo,
                leida,
                includeInactive
            );

        return Ok(new
        {
            data = alerts
        });
    }

    [HttpGet("resumen")]
    public async Task<IActionResult> GetSummary()
    {
        await _alertaService.GenerateAsync();

        var summary = await _alertaService
            .GetSummaryAsync();

        return Ok(new
        {
            data = summary
        });
    }

    [HttpGet("{idAlerta:long}")]
    public async Task<IActionResult> GetById(
        long idAlerta
    )
    {
        var alert = await _alertaService
            .GetByIdAsync(idAlerta);

        if (alert is null)
        {
            return NotFound(new
            {
                message = "La alerta no existe."
            });
        }

        return Ok(new
        {
            data = alert
        });
    }

    [HttpPatch("{idAlerta:long}/leer")]
    public async Task<IActionResult> MarkAsRead(
        long idAlerta
    )
    {
        var updated = await _alertaService
            .MarkAsReadAsync(idAlerta);

        if (!updated)
        {
            return NotFound(new
            {
                message = "La alerta no existe."
            });
        }

        return Ok(new
        {
            message =
                "Alerta marcada como leída."
        });
    }

    [Authorize(Roles = "PROPIETARIO")]
    [HttpPost("generar")]
    public async Task<IActionResult> Generate()
    {
        await _alertaService.GenerateAsync();

        return Ok(new
        {
            message =
                "Revisión de alertas completada."
        });
    }
}