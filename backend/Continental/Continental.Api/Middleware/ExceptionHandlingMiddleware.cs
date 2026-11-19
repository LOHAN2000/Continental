using System.Diagnostics;
using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Continental.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;

    private readonly ILogger<ExceptionHandlingMiddleware>
        _logger;

    private readonly IWebHostEnvironment
        _environment;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IWebHostEnvironment environment
    )
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(
        HttpContext context
    )
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            await HandleExceptionAsync(
                context,
                exception
            );
        }
    }

    private async Task HandleExceptionAsync(
        HttpContext context,
        Exception exception
    )
    {
        var traceId =
            Activity.Current?.Id ??
            context.TraceIdentifier;

        _logger.LogError(
            exception,
            "Error no controlado. TraceId: {TraceId}",
            traceId
        );

        var response = GetErrorResponse(
            exception,
            traceId
        );

        context.Response.StatusCode =
            response.StatusCode;

        context.Response.ContentType =
            "application/json";

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy =
                JsonNamingPolicy.CamelCase
        };

        await context.Response.WriteAsync(
            JsonSerializer.Serialize(
                response.Body,
                jsonOptions
            )
        );
    }

    private ErrorResponse GetErrorResponse(
        Exception exception,
        string traceId
    )
    {
        if (exception is DbUpdateException
            dbUpdateException)
        {
            return BuildDatabaseError(
                dbUpdateException,
                traceId
            );
        }

        if (exception is PostgresException
            postgresException)
        {
            return BuildPostgresError(
                postgresException,
                traceId
            );
        }

        if (exception is TimeoutException)
        {
            return new ErrorResponse(
                StatusCodes.Status504GatewayTimeout,
                new
                {
                    message =
                        "La operación superó el tiempo " +
                        "máximo de espera.",

                    traceId
                }
            );
        }

        return new ErrorResponse(
            StatusCodes.Status500InternalServerError,
            new
            {
                message =
                    "Ocurrió un error inesperado " +
                    "al procesar la solicitud.",

                traceId,

                detail = _environment.IsDevelopment()
                    ? exception.Message
                    : null
            }
        );
    }

    private static ErrorResponse BuildDatabaseError(
        DbUpdateException exception,
        string traceId
    )
    {
        if (exception.InnerException is
            PostgresException postgresException)
        {
            return BuildPostgresError(
                postgresException,
                traceId
            );
        }

        return new ErrorResponse(
            StatusCodes.Status500InternalServerError,
            new
            {
                message =
                    "No fue posible guardar los cambios " +
                    "en la base de datos.",

                traceId
            }
        );
    }

    private static ErrorResponse BuildPostgresError(
        PostgresException exception,
        string traceId
    )
    {
        return exception.SqlState switch
        {
            PostgresErrorCodes.UniqueViolation =>
                new ErrorResponse(
                    StatusCodes.Status409Conflict,
                    new
                    {
                        message =
                            "Ya existe un registro con " +
                            "los mismos datos únicos.",

                        traceId
                    }
                ),

            PostgresErrorCodes.ForeignKeyViolation =>
                new ErrorResponse(
                    StatusCodes.Status409Conflict,
                    new
                    {
                        message =
                            "La operación no puede realizarse " +
                            "porque el registro está relacionado " +
                            "con otros datos.",

                        traceId
                    }
                ),

            PostgresErrorCodes.NotNullViolation =>
                new ErrorResponse(
                    StatusCodes.Status400BadRequest,
                    new
                    {
                        message =
                            "Falta información obligatoria " +
                            "para completar la operación.",

                        traceId
                    }
                ),

            PostgresErrorCodes.CheckViolation =>
                new ErrorResponse(
                    StatusCodes.Status400BadRequest,
                    new
                    {
                        message =
                            "Los datos no cumplen las reglas " +
                            "establecidas.",

                        traceId
                    }
                ),

            _ =>
                new ErrorResponse(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Ocurrió un error al acceder " +
                            "a la base de datos.",

                        traceId
                    }
                )
        };
    }

    private sealed record ErrorResponse(
        int StatusCode,
        object Body
    );
}