using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PaymentService.Models;

[Table("payment_idempotency")]
public class PaymentIdempotency
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(255)]
    [Column("idempotency_key")]
    public string IdempotencyKey { get; set; } = string.Empty;

    [MaxLength(100)]
    [Column("user_id")]
    public string UserId { get; set; } = string.Empty;

    [MaxLength(100)]
    [Column("order_id")]
    public string OrderId { get; set; } = string.Empty;

    [MaxLength(255)]
    [Column("request_hash")]
    public string RequestHash { get; set; } = string.Empty;

    [Column("payment_id")]
    public Guid PaymentId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
