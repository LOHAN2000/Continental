using Continental.Api.DTOs.Proveedores;
using Continental.Api.Services.Proveedores;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Continental.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/proveedores")]
public class ProveedoresController : ControllerBase
{
    private readonly IProveedorService _proveedorService;

    public ProveedoresController(
        IProveedorService proveedorService
    )
    {
        _proveedorService = proveedorService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] bool includeInactive = false
    )
    {
        var providers = await _proveedorService
            .GetAllAsync(search, includeInactive);

        return Ok(new
        {
            data = providers
        });
    }

    [HttpGet("{idProveedor:long}")]
    public async Task<IActionResult> GetById(
        long idProveedor
    )
    {
        var provider = await _proveedorService
            .GetByIdAsync(idProveedor);

        if (provider is null)
        {
            return NotFound(new
            {
                message = "El proveedor no existe."
            });
        }

        return Ok(new
        {
            data = provider
        });
    }

    [Authorize(Roles = "PROPIETARIO")]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateProveedorDto request
    )
    {
        var result = await _proveedorService
            .CreateAsync(request);

        if (!result.Success)
        {
            return MapError(result);
        }

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                idProveedor =
                result.Data!.IdProveedor
            },
            new
            {
                message = result.Message,
                data = result.Data
            }
        );
    }

    [Authorize(Roles = "PROPIETARIO")]
    [HttpPut("{idProveedor:long}")]
    public async Task<IActionResult> Update(
        long idProveedor,
        [FromBody] UpdateProveedorDto request
    )
    {
        var result = await _proveedorService
            .UpdateAsync(idProveedor, request);

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

    [Authorize(Roles = "PROPIETARIO")]
    [HttpPatch("{idProveedor:long}/estado")]
    public async Task<IActionResult> ChangeStatus(
        long idProveedor,
        [FromQuery] bool activo
    )
    {
        var result = await _proveedorService
            .ChangeStatusAsync(
                idProveedor,
                activo
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

    private IActionResult MapError(
        ProveedorResult result
    )
    {
        return result.Error switch
        {
            ProveedorError.NotFound =>
                NotFound(new
                {
                    message = result.Message
                }),

            ProveedorError.DuplicateDocument =>
                Conflict(new
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
}