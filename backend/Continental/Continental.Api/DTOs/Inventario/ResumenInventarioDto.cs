namespace Continental.Api.DTOs.Inventario;

public class ResumenInventarioDto
{
    public int TotalProductosActivos { get; set; }

    public int ProductosSinStock { get; set; }

    public int ProductosConStockMinimo { get; set; }

    public int ProductosDisponibles { get; set; }

    public decimal UnidadesDisponibles { get; set; }

    public decimal ValorInventarioCosto { get; set; }

    public decimal ValorInventarioVenta { get; set; }
}