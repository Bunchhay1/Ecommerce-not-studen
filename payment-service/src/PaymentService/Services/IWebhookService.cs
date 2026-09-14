using PaymentService.DTOs;

namespace PaymentService.Services;

public interface IWebhookService
{
    Task<bool> ProcessStripeWebhookAsync(string payload, string signature);
    Task<bool> ProcessPayPalWebhookAsync(string payload, string signature);
}
