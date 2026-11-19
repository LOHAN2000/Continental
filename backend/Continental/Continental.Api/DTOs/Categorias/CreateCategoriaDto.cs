using System.ComponentModel.DataAnnotations;

namespace Continental.Api.DTOs.Categorias;

public class CreateCategoriaDto
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(
        80,
        ErrorMessage = "El nombre no puede superar 80 caracteres."
    )]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(
        200,
        ErrorMessage =
        "La descripción no puede superar 200 caracteres."
    )]
    public string? Descripcion { get; set; }
}