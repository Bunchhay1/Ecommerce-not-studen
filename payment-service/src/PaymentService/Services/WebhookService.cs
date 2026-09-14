using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PaymentService.Cache;
using PaymentService.Data;
using PaymentService.DTOs;
using PaymentService.Models;
using PaymentService.Models.Enums;
using PaymentService.Providers;

namespace PaymentService.Services;

public class WebhookService : IWebhookService
{
    private readonly PaymentDbContext _context;
    private readonly IEnumerable<IPaymentProvider> _providers;
    private readonly IRedisCacheService _cache;
    private readonly ILogger<WebhookService> _logger;

    public WebhookService(
        PaymentDbContext context,
        IEnumerable<IPaymentProvider> providers,
        IRedisCacheService cache,
        ILogger<WebhookService> logger)
    {
        _context = context;
        _providers = providers;
        _cache = cache;
        _logger = logger;
    }

    public async Task<bool> ProcessStripeWebhookAsync(string payload, string signature)
    {
        _logger.LogInformation("Processing Stripe webhook...");
        var provider = _providers.FirstOrDefault(p => p.ProviderName == "STRIPE")
                       ?? _providers.First(p => p.ProviderName == "MOCK");

        bool isValid = await provider.VerifyWebhookAsync(payload, signature);
        if (!isValid)
        {
            _logger.LogWarning("Invalid Stripe webhook signature.");
            return false;
        }

        using var doc = JsonDocument.Parse(payload);
        var root = doc.RootElement;
        string eventId = root.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? Guid.NewGuid().ToString() : Guid.NewGuid().ToString();
        string eventType = root.TryGetProperty("type", out var typeProp) ? typeProp.GetString() ?? "unknown" : "unknown";

        // Idempotency check
        var existingEvent = await _context.WebhookEvents.FirstOrDefaultAsync(w => w.Provider == "STRIPE" && w.EventId == eventId);
        if (existingEvent != null && existingEvent.Processed)
        {
            _logger.LogInformation("Duplicate Stripe webhook event {EventId} ignored.", eventId);
            return true;
        }

        if (existingEvent == null)
        {
            existingEvent = new WebhookEvent
            {
                Id = Guid.NewGuid(),
                Provider = "STRIPE",
                EventId = eventId,
                EventType = eventType,
                Payload = payload,
                Processed = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.WebhookEvents.Add(existingEvent);
        }

        // Process payment status update
        string? providerPaymentId = null;
        if (root.TryGetProperty("data", out var dataProp) && dataProp.TryGetProperty("object", out var objProp))
        {
            if (objProp.TryGetProperty("id", out var piIdProp))
            {
                providerPaymentId = piIdProp.GetString();
            }
        }

        if (!string.IsNullOrEmpty(providerPaymentId))
        {
            var payment = await _context.Payments.FirstOrDefaultAsync(p => p.ProviderPaymentId == providerPaymentId);
            if (payment != null)
            {
                if (eventType.Contains("succeeded", StringComparison.OrdinalIgnoreCase))
                {
                    payment.Status = PaymentStatus.SUCCEEDED;
                    payment.PaidAt = DateTime.UtcNow;
                }
                else if (eventType.Contains("failed", StringComparison.OrdinalIgnoreCase))
                {
                    payment.Status = PaymentStatus.FAILED;
                    payment.FailedAt = DateTime.UtcNow;
                }
                payment.UpdatedAt = DateTime.UtcNow;

                string outboxType = payment.Status == PaymentStatus.SUCCEEDED ? "PaymentSucceeded" : "PaymentFailed";
                _context.OutboxEvents.Add(new OutboxEvent
                {
                    Id = Guid.NewGuid(),
                    AggregateType = "Payment",
                    AggregateId = payment.Id.ToString(),
                    EventType = outboxType,
                    Payload = JsonSerializer.Serialize(new
                    {
                        eventId = Guid.NewGuid(),
                        eventType = outboxType,
                        paymentId = payment.Id,
                        paymentNumber = payment.PaymentNumber,
                        orderId = payment.OrderId,
                        userId = payment.UserId,
                        amount = payment.Amount,
                        status = payment.Status.ToString(),
                        timestamp = DateTime.UtcNow
                    }),
                    Status = OutboxStatus.PENDING,
                    CreatedAt = DateTime.UtcNow
                });

                await _cache.RemoveAsync($"payment:{payment.Id}");
                await _cache.RemoveAsync($"payment:order:{payment.OrderId}");
            }
        }

        existingEvent.Processed = true;
        existingEvent.ProcessedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ProcessPayPalWebhookAsync(string payload, string signature)
    {
        _logger.LogInformation("Processing PayPal webhook...");
        var provider = _providers.FirstOrDefault(p => p.ProviderName == "PAYPAL")
                       ?? _providers.First(p => p.ProviderName == "MOCK");

        bool isValid = await provider.VerifyWebhookAsync(payload, signature);
        if (!isValid)
        {
            _logger.LogWarning("Invalid PayPal webhook signature.");
            return false;
        }

        using var doc = JsonDocument.Parse(payload);
        var root = doc.RootElement;
        string eventId = root.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? Guid.NewGuid().ToString() : Guid.NewGuid().ToString();
        string eventType = root.TryGetProperty("event_type", out var typeProp) ? typeProp.GetString() ?? "unknown" : "unknown";

        var existingEvent = await _context.WebhookEvents.FirstOrDefaultAsync(w => w.Provider == "PAYPAL" && w.EventId == eventId);
        if (existingEvent != null && existingEvent.Processed)
        {
            _logger.LogInformation("Duplicate PayPal webhook event {EventId} ignored.", eventId);
            return true;
        }

        if (existingEvent == null)
        {
            existingEvent = new WebhookEvent
            {
                Id = Guid.NewGuid(),
                Provider = "PAYPAL",
                EventId = eventId,
                EventType = eventType,
                Payload = payload,
                Processed = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.WebhookEvents.Add(existingEvent);
        }

        existingEvent.Processed = true;
        existingEvent.ProcessedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }
}
