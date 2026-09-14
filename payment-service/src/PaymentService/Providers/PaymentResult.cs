using PaymentService.Models.Enums;

namespace PaymentService.Providers;

public class PaymentResult
{
    public bool Success { get; set; }
    public string? ProviderPaymentId { get; set; }
    public PaymentStatus Status { get; set; }
    public string? CardBrand { get; set; }
    public string? CardLast4 { get; set; }
    public string? FailureCode { get; set; }
    public string? FailureMessage { get; set; }
}
