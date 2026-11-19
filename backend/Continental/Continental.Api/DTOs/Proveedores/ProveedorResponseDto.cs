namespace Continental.Api.DTOs.Proveedores;

public class ProveedorResponseDto
{
    public long IdProveedor { get; set; }

    public string Documento { get; set; } = string.Empty;

    public string RazonSocial { get; set; } = string.Empty;

    public string? Telefono { get; set; }

    public string? Correo { get; set; }

    public string? Direccion { get; set; }

    public bool Activo { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}