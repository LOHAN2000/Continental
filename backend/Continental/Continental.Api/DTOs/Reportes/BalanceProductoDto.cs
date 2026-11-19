namespace Continental.Api.DTOs.Reportes;

public class BalanceProductoDto
{
    public long IdProducto { get; set; }

    public string Producto { get; set; } = string.Empty;

    public decimal CantidadVendida { get; set; }

    public decimal Ingresos { get; set; }

    public decimal CostoHistorico { get; set; }

    public decimal MargenBrutoEstimado { get; set; }
}