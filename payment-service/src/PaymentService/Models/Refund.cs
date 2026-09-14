using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PaymentService.Models.Enums;

namespace PaymentService.Models;

[Table("refunds")]
public class Refund
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(50)]
    [Column("refund_number")]
    public string RefundNumber { get; set; } = string.Empty;

    [Required]
    [Column("payment_id")]
    public Guid PaymentId { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("order_id")]
    public string OrderId { get; set; } = string.Empty;

    [Column("amount", TypeName = "numeric(12,2)")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(10)]
    [Column("currency")]
    public string Currency { get; set; } = "USD";

    [MaxLength(255)]
    [Column("reason")]
    public string? Reason { get; set; }

    [Required]
    [Column("status")]
    public RefundStatus Status { get; set; } = RefundStatus.PENDING;

    [MaxLength(255)]
    [Column("provider_refund_id")]
    public string? ProviderRefundId { get; set; }

    [MaxLength(500)]
    [Column("failure_message")]
    public string? FailureMessage { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }

    [ForeignKey("PaymentId")]
    public Payment? Payment { get; set; }
}
