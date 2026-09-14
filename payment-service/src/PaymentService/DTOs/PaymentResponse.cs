using PaymentService.Models;
using PaymentService.Models.Enums;

namespace PaymentService.DTOs;

public class PaymentResponse
{
    public Guid Id { get; set; }
    public string PaymentNumber { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string PaymentMethod { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string? ProviderPaymentId { get; set; }
    public string? CardBrand { get; set; }
    public string? CardLast4 { get; set; }
    public decimal RefundedAmount { get; set; }
    public string? FailureCode { get; set; }
    public string? FailureMessage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? FailedAt { get; set; }
    public List<RefundResponse> Refunds { get; set; } = new();

    public static PaymentResponse FromEntity(Payment payment)
    {
        return new PaymentResponse
        {
            Id = payment.Id,
            PaymentNumber = payment.PaymentNumber,
            OrderId = payment.OrderId,
            UserId = payment.UserId,
            Amount = payment.Amount,
            Currency = payment.Currency,
            PaymentMethod = payment.PaymentMethod.ToString(),
            Status = payment.Status.ToString(),
            Provider = payment.Provider,
            ProviderPaymentId = payment.ProviderPaymentId,
            CardBrand = payment.CardBrand,
            CardLast4 = payment.CardLast4,
            RefundedAmount = payment.RefundedAmount,
            FailureCode = payment.FailureCode,
            FailureMessage = payment.FailureMessage,
            CreatedAt = payment.CreatedAt,
            UpdatedAt = payment.UpdatedAt,
            PaidAt = payment.PaidAt,
            FailedAt = payment.FailedAt,
            Refunds = payment.Refunds?.Select(RefundResponse.FromEntity).ToList() ?? new()
        };
    }
}
