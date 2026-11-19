using Continental.Api.DTOs.Alertas;

namespace Continental.Api.Services.Alertas;

public interface IAlertaService
{
    Task GenerateAsync();

    Task<IReadOnlyCollection<AlertaResponseDto>>
    GetAllAsync(
        string? tipo = null,
        bool? leida = null,
        bool includeInactive = false
    );

    Task<AlertaResponseDto?> GetByIdAsync(
        long idAlerta
    );

    Task<bool> MarkAsReadAsync(
        long idAlerta
    );

    Task<ResumenAlertasDto> GetSummaryAsync();
}