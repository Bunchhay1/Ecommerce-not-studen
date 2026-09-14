using PaymentService.Models;

namespace PaymentService.DTOs;

public class RefundResponse
{
    public Guid Id { get; set; }
    public string RefundNumber { get; set; } = string.Empty;
    public Guid PaymentId { get; set; }
    public string OrderId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string? Reason { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ProviderRefundId { get; set; }
    public string? FailureMessage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public static RefundResponse FromEntity(Refund refund)
    {
        return new RefundResponse
        {
            Id = refund.Id,
            RefundNumber = refund.RefundNumber,
            PaymentId = refund.PaymentId,
            OrderId = refund.OrderId,
            Amount = refund.Amount,
            Currency = refund.Currency,
            Reason = refund.Reason,
            Status = refund.Status.ToString(),
            ProviderRefundId = refund.ProviderRefundId,
            FailureMessage = refund.FailureMessage,
            CreatedAt = refund.CreatedAt,
            UpdatedAt = refund.UpdatedAt,
            CompletedAt = refund.CompletedAt
        };
    }
}
