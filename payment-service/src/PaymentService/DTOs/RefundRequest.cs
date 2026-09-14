using System.ComponentModel.DataAnnotations;

namespace PaymentService.DTOs;

public class RefundRequest
{
    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Refund amount must be greater than 0")]
    public decimal Amount { get; set; }

    public string? Reason { get; set; }
}
