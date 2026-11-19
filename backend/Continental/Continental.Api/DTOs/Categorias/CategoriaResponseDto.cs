namespace Continental.Api.DTOs.Categorias;

public class CategoriaResponseDto
{
    public long IdCategoria { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public bool Activo { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}