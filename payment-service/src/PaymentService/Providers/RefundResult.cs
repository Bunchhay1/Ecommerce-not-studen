using PaymentService.Models.Enums;

namespace PaymentService.Providers;

public class RefundResult
{
    public bool Success { get; set; }
    public string? ProviderRefundId { get; set; }
    public RefundStatus Status { get; set; }
    public string? FailureMessage { get; set; }
}
