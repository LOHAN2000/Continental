using Continental.Api.Services.Lotes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Continental.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/lotes")]
public class LotesController : ControllerBase
{
    private readonly ILoteService _loteService;

    public LotesController(
        ILoteService loteService
    )
    {
        _loteService = loteService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] long? idProducto = null,
        [FromQuery] bool onlyAvailable = false
    )
    {
        var batches = await _loteService
            .GetAllAsync(
                idProducto,
                onlyAvailable
            );

        return Ok(new
        {
            data = batches
        });
    }

    [HttpGet("{idLote:long}")]
    public async Task<IActionResult> GetById(
        long idLote
    )
    {
        var batch = await _loteService
            .GetByIdAsync(idLote);

        if (batch is null)
        {
            return NotFound(new
            {
                message = "El lote no existe."
            });
        }

        return Ok(new
        {
            data = batch
        });
    }
}