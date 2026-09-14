using System.Net;
using System.Text.Json;
using PaymentService.DTOs;
using PaymentService.Exceptions;

namespace PaymentService.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception during request processing.");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, errorCode) = exception switch
        {
            PaymentNotFoundException => (HttpStatusCode.NotFound, "PAYMENT_NOT_FOUND"),
            KeyNotFoundException => (HttpStatusCode.NotFound, "RESOURCE_NOT_FOUND"),
            InvalidPaymentStatusException => (HttpStatusCode.BadRequest, "INVALID_PAYMENT_STATUS"),
            DuplicatePaymentException => (HttpStatusCode.Conflict, "DUPLICATE_PAYMENT"),
            PaymentProviderException => (HttpStatusCode.BadGateway, "PAYMENT_PROVIDER_ERROR"),
            UnauthorizedAccessException => (HttpStatusCode.Forbidden, "UNAUTHORIZED_PAYMENT_ACCESS"),
            InvalidOperationException => (HttpStatusCode.BadRequest, "INVALID_OPERATION"),
            ArgumentException => (HttpStatusCode.BadRequest, "INVALID_ARGUMENT"),
            _ => (HttpStatusCode.InternalServerError, "INTERNAL_SERVER_ERROR")
        };

        context.Response.StatusCode = (int)statusCode;

        var response = ApiResponse<object>.Fail(exception.Message, errorCode);
        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        return context.Response.WriteAsync(json);
    }
}
