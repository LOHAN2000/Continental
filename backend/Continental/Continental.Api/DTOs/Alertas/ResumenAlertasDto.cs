namespace Continental.Api.DTOs.Alertas;

public class ResumenAlertasDto
{
    public int TotalActivas { get; set; }

    public int StockMinimo { get; set; }

    public int ProximosVencimientos { get; set; }

    public int NoLeidas { get; set; }
}