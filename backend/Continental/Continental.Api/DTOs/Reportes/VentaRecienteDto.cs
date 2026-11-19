namespace Continental.Api.DTOs.Reportes;

public class VentaRecienteDto
{
    public long IdVenta { get; set; }

    public DateTime Fecha { get; set; }

    public string Usuario { get; set; } = string.Empty;

    public decimal Total { get; set; }

    public decimal MargenBrutoEstimado { get; set; }
}