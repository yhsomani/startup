using System.Net;
using System.Text.Json;

namespace TalentSphere.API.Middleware;

/// <summary>
/// API Response Envelope
/// Standard response format for all API endpoints.
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public ApiError? Error { get; set; }
    public ApiMeta Meta { get; set; } = new();
    public string? Message { get; set; }

    public static ApiResponse<T> SuccessResponse(T data, string? message = null)
    {
        return new ApiResponse<T>
        {
            Success = true,
            Data = data,
            Error = null,
            Message = message
        };
    }

    public static ApiResponse<T> ErrorResponse(string code, string message, object? details = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Data = default,
            Error = new ApiError
            {
                Code = code,
                Message = message,
                Details = details
            }
        };
    }
}

public class ApiError
{
    public string Code { get; set; } = "";
    public string Message { get; set; } = "";
    public object? Details { get; set; }
}

public class ApiMeta
{
    public string RequestId { get; set; } = Guid.NewGuid().ToString();
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("O");
    public string Service { get; set; } = "dotnet-backend";
}

/// <summary>
/// Correlation ID Middleware
/// Ensures every request has a correlation ID for distributed tracing.
/// </summary>
public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<CorrelationIdMiddleware> _logger;
    
    private const string RequestIdHeader = "X-Request-ID";
    private const string CorrelationIdHeader = "X-Correlation-ID";

    public CorrelationIdMiddleware(RequestDelegate next, ILogger<CorrelationIdMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Get or generate correlation ID
        var correlationId = context.Request.Headers[RequestIdHeader].FirstOrDefault()
            ?? context.Request.Headers[CorrelationIdHeader].FirstOrDefault()
            ?? Guid.NewGuid().ToString();

        // Add to response headers
        context.Response.Headers.Append(RequestIdHeader, correlationId);
        
        // Store in Items for access elsewhere
        context.Items["CorrelationId"] = correlationId;

        var startTime = DateTime.UtcNow;
        var path = context.Request.Path;
        
        // Log request (skip health checks)
        if (!path.StartsWithSegments("/health") && !path.StartsWithSegments("/metrics"))
        {
            _logger.LogInformation("REQUEST | {Method} {Path} | correlationId={CorrelationId}",
                context.Request.Method, path, correlationId);
        }

        try
        {
            await _next(context);
        }
        finally
        {
            var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;
            context.Response.Headers.Append("X-Response-Time", $"{duration:F2}ms");

            // Log response (skip health checks)
            if (!path.StartsWithSegments("/health") && !path.StartsWithSegments("/metrics"))
            {
                _logger.LogInformation("RESPONSE | {Method} {Path} | status={StatusCode} | duration={Duration:F2}ms | correlationId={CorrelationId}",
                    context.Request.Method, path, context.Response.StatusCode, duration, correlationId);
            }
        }
    }
}

/// <summary>
/// Global Exception Handler Middleware
/// Catches all unhandled exceptions and returns standardized error responses.
/// </summary>
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
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
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var correlationId = context.Items["CorrelationId"]?.ToString() ?? Guid.NewGuid().ToString();
        
        _logger.LogError(exception, "Unhandled exception [correlationId={CorrelationId}]: {Message}",
            correlationId, exception.Message);

        var (statusCode, errorCode, message) = exception switch
        {
            ArgumentException _ => (HttpStatusCode.BadRequest, "VALIDATION_ERROR", exception.Message),
            UnauthorizedAccessException _ => (HttpStatusCode.Unauthorized, "UNAUTHORIZED", "Authentication required"),
            KeyNotFoundException _ => (HttpStatusCode.NotFound, "NOT_FOUND", exception.Message),
            InvalidOperationException _ => (HttpStatusCode.Conflict, "CONFLICT", exception.Message),
            _ => (HttpStatusCode.InternalServerError, "INTERNAL_ERROR", $"An unexpected error occurred. Reference: {correlationId}")
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = new ApiResponse<object>
        {
            Success = false,
            Data = null,
            Error = new ApiError
            {
                Code = errorCode,
                Message = message
            },
            Meta = new ApiMeta
            {
                RequestId = correlationId
            }
        };

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }
}

/// <summary>
/// Extension methods for middleware registration
/// </summary>
public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseCorrelationId(this IApplicationBuilder app)
    {
        return app.UseMiddleware<CorrelationIdMiddleware>();
    }

    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
    {
        return app.UseMiddleware<GlobalExceptionMiddleware>();
    }
}
