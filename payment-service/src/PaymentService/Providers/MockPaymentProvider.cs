using PaymentService.DTOs;
using PaymentService.Models.Enums;

namespace PaymentService.Providers;

public class MockPaymentProvider : IPaymentProvider
{
    public string ProviderName => "MOCK";

    public Task<PaymentResult> CreatePaymentAsync(CreatePaymentRequest request, decimal trustedAmount, string orderNumber)
    {
        // Mock gateway authorization
        string providerPaymentId = $"mock_pi_{Guid.NewGuid().ToString("N")[..16]}";
        
        return Task.FromResult(new PaymentResult
        {
            Success = true,
            ProviderPaymentId = providerPaymentId,
            Status = PaymentStatus.SUCCEEDED,
            CardBrand = request.CardBrand ?? "VISA",
            CardLast4 = request.CardLast4 ?? "4242"
        });
    }

    public Task<PaymentResult> GetPaymentAsync(string providerPaymentId)
    {
        return Task.FromResult(new PaymentResult
        {
            Success = true,
            ProviderPaymentId = providerPaymentId,
            Status = PaymentStatus.SUCCEEDED,
            CardBrand = "VISA",
            CardLast4 = "4242"
        });
    }

    public Task<RefundResult> RefundAsync(string providerPaymentId, decimal amount, string currency, string? reason)
    {
        string providerRefundId = $"mock_re_{Guid.NewGuid().ToString("N")[..16]}";
        return Task.FromResult(new RefundResult
        {
            Success = true,
            ProviderRefundId = providerRefundId,
            Status = RefundStatus.SUCCEEDED
        });
    }

    public Task<bool> VerifyWebhookAsync(string payload, string signature)
    {
        // Mock verification: valid if signature is non-empty or equals mock secret
        return Task.FromResult(!string.IsNullOrWhiteSpace(signature));
    }
}
