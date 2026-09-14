using PaymentService.DTOs;

namespace PaymentService.Providers;

public interface IPaymentProvider
{
    string ProviderName { get; }

    Task<PaymentResult> CreatePaymentAsync(CreatePaymentRequest request, decimal trustedAmount, string orderNumber);

    Task<PaymentResult> GetPaymentAsync(string providerPaymentId);

    Task<RefundResult> RefundAsync(string providerPaymentId, decimal amount, string currency, string? reason);

    Task<bool> VerifyWebhookAsync(string payload, string signature);
}
