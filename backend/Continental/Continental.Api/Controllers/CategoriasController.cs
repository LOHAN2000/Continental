using Continental.Api.DTOs.Categorias;
using Continental.Api.Services.Categorias;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Continental.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/categorias")]
public class CategoriasController : ControllerBase
{
    private readonly ICategoriaService _categoriaService;

    public CategoriasController(
        ICategoriaService categoriaService
    )
    {
        _categoriaService = categoriaService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool includeInactive = false
    )
    {
        var categories = await _categoriaService
            .GetAllAsync(includeInactive);

        return Ok(new
        {
            data = categories
        });
    }

    [HttpGet("{idCategoria:long}")]
    public async Task<IActionResult> GetById(
        long idCategoria
    )
    {
        var category = await _categoriaService
            .GetByIdAsync(idCategoria);

        if (category is null)
        {
            return NotFound(new
            {
                message = "La categoría no existe."
            });
        }

        return Ok(new
        {
            data = category
        });
    }

    [Authorize(Roles = "PROPIETARIO")]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateCategoriaDto request
    )
    {
        var result = await _categoriaService
            .CreateAsync(request);

        if (!result.Success)
        {
            return Conflict(new
            {
                message = result.Message
            });
        }

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                idCategoria =
                result.Data!.IdCategoria
            },
            new
            {
                message = result.Message,
                data = result.Data
            }
        );
    }

    [Authorize(Roles = "PROPIETARIO")]
    [HttpPut("{idCategoria:long}")]
    public async Task<IActionResult> Update(
        long idCategoria,
        [FromBody] UpdateCategoriaDto request
    )
    {
        var result = await _categoriaService
            .UpdateAsync(idCategoria, request);

        if (!result.Success)
        {
            return BadRequest(new
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

    [Authorize(Roles = "PROPIETARIO")]
    [HttpPatch("{idCategoria:long}/estado")]
    public async Task<IActionResult> ChangeStatus(
        long idCategoria,
        [FromQuery] bool activo
    )
    {
        var result = await _categoriaService
            .ChangeStatusAsync(
                idCategoria,
                activo
            );

        if (!result.Success)
        {
            return NotFound(new
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
}