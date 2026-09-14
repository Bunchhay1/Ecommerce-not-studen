using System.ComponentModel.DataAnnotations;
using PaymentService.Models.Enums;

namespace PaymentService.DTOs;

public class CreatePaymentRequest
{
    [Required]
    public string OrderId { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string Currency { get; set; } = "USD";

    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.CARD;

    public string? Provider { get; set; }

    public string? CardBrand { get; set; }

    public string? CardLast4 { get; set; }

    public string? PaymentMethodToken { get; set; }

    public string? IdempotencyKey { get; set; }
}
