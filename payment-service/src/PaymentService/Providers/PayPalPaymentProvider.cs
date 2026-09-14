using PaymentService.DTOs;
using PaymentService.Models.Enums;

namespace PaymentService.Providers;

public class PayPalPaymentProvider : IPaymentProvider
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<PayPalPaymentProvider> _logger;

    public PayPalPaymentProvider(IConfiguration configuration, ILogger<PayPalPaymentProvider> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public string ProviderName => "PAYPAL";

    public Task<PaymentResult> CreatePaymentAsync(CreatePaymentRequest request, decimal trustedAmount, string orderNumber)
    {
        _logger.LogInformation("Creating PayPal order for order {OrderNumber} with amount {Amount}", orderNumber, trustedAmount);

        string providerPaymentId = $"PAYPAL-ORDER-{Guid.NewGuid().ToString("N")[..16].ToUpper()}";

        return Task.FromResult(new PaymentResult
        {
            Success = true,
            ProviderPaymentId = providerPaymentId,
            Status = PaymentStatus.SUCCEEDED,
            CardBrand = "PAYPAL",
            CardLast4 = "WALLET"
        });
    }

    public Task<PaymentResult> GetPaymentAsync(string providerPaymentId)
    {
        return Task.FromResult(new PaymentResult
        {
            Success = true,
            ProviderPaymentId = providerPaymentId,
            Status = PaymentStatus.SUCCEEDED,
            CardBrand = "PAYPAL",
            CardLast4 = "WALLET"
        });
    }

    public Task<RefundResult> RefundAsync(string providerPaymentId, decimal amount, string currency, string? reason)
    {
        string providerRefundId = $"PAYPAL-REFUND-{Guid.NewGuid().ToString("N")[..16].ToUpper()}";
        return Task.FromResult(new RefundResult
        {
            Success = true,
            ProviderRefundId = providerRefundId,
            Status = RefundStatus.SUCCEEDED
        });
    }

    public Task<bool> VerifyWebhookAsync(string payload, string signature)
    {
        return Task.FromResult(!string.IsNullOrWhiteSpace(signature));
    }
}
