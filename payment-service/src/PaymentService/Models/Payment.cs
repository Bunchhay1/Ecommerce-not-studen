using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PaymentService.Models.Enums;

namespace PaymentService.Models;

[Table("payments")]
public class Payment
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(50)]
    [Column("payment_number")]
    public string PaymentNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("order_id")]
    public string OrderId { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("user_id")]
    public string UserId { get; set; } = string.Empty;

    [Column("amount", TypeName = "numeric(12,2)")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(10)]
    [Column("currency")]
    public string Currency { get; set; } = "USD";

    [Required]
    [Column("payment_method")]
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.CARD;

    [Required]
    [Column("status")]
    public PaymentStatus Status { get; set; } = PaymentStatus.PENDING;

    [MaxLength(50)]
    [Column("provider")]
    public string Provider { get; set; } = "MOCK";

    [MaxLength(255)]
    [Column("provider_payment_id")]
    public string? ProviderPaymentId { get; set; }

    [MaxLength(50)]
    [Column("card_brand")]
    public string? CardBrand { get; set; }

    [MaxLength(4)]
    [Column("card_last4")]
    public string? CardLast4 { get; set; }

    [MaxLength(100)]
    [Column("failure_code")]
    public string? FailureCode { get; set; }

    [MaxLength(500)]
    [Column("failure_message")]
    public string? FailureMessage { get; set; }

    [Column("refunded_amount", TypeName = "numeric(12,2)")]
    public decimal RefundedAmount { get; set; } = 0.00m;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("paid_at")]
    public DateTime? PaidAt { get; set; }

    [Column("failed_at")]
    public DateTime? FailedAt { get; set; }

    public ICollection<Refund> Refunds { get; set; } = new List<Refund>();
}
