using Continental.Api.DTOs.Productos;
using Continental.Api.Services.Productos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Continental.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/productos")]
public class ProductosController : ControllerBase
{
    private readonly IProductoService _productoService;

    public ProductosController(
        IProductoService productoService
    )
    {
        _productoService = productoService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] long? idCategoria = null,
        [FromQuery] bool includeInactive = false
    )
    {
        var products = await _productoService
            .GetAllAsync(
                search,
                idCategoria,
                includeInactive
            );

        return Ok(new
        {
            data = products
        });
    }

    [HttpGet("{idProducto:long}")]
    public async Task<IActionResult> GetById(
        long idProducto
    )
    {
        var product = await _productoService
            .GetByIdAsync(idProducto);

        if (product is null)
        {
            return NotFound(new
            {
                message = "El producto no existe."
            });
        }

        return Ok(new
        {
            data = product
        });
    }

    [HttpGet("codigo/{codigoBarras}")]
    public async Task<IActionResult> GetByBarcode(
        string codigoBarras
    )
    {
        var product = await _productoService
            .GetByBarcodeAsync(codigoBarras);

        if (product is null)
        {
            return NotFound(new
            {
                message =
                    "No se encontró un producto activo " +
                    "con ese código."
            });
        }

        return Ok(new
        {
            data = product
        });
    }

    [Authorize(Roles = "PROPIETARIO")]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateProductoDto request
    )
    {
        var result = await _productoService
            .CreateAsync(request);

        if (!result.Success)
        {
            return MapError(result);
        }

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                idProducto =
                result.Data!.IdProducto
            },
            new
            {
                message = result.Message,
                data = result.Data
            }
        );
    }

    [Authorize(Roles = "PROPIETARIO")]
    [HttpPut("{idProducto:long}")]
    public async Task<IActionResult> Update(
        long idProducto,
        [FromBody] UpdateProductoDto request
    )
    {
        var result = await _productoService
            .UpdateAsync(idProducto, request);

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
    [HttpPatch("{idProducto:long}/estado")]
    public async Task<IActionResult> ChangeStatus(
        long idProducto,
        [FromQuery] bool activo
    )
    {
        var result = await _productoService
            .ChangeStatusAsync(
                idProducto,
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
        ProductoResult result
    )
    {
        return result.Error switch
        {
            ProductoError.NotFound =>
                NotFound(new
                {
                    message = result.Message
                }),

            ProductoError.DuplicateBarcode =>
                Conflict(new
                {
                    message = result.Message
                }),

            ProductoError.InvalidCategory =>
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
}