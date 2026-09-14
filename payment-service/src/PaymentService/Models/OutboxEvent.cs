using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PaymentService.Models.Enums;

namespace PaymentService.Models;

[Table("outbox_events")]
public class OutboxEvent
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    [Column("aggregate_type")]
    public string AggregateType { get; set; } = "Payment";

    [Required]
    [MaxLength(100)]
    [Column("aggregate_id")]
    public string AggregateId { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("event_type")]
    public string EventType { get; set; } = string.Empty;

    [Required]
    [Column("payload", TypeName = "text")]
    public string Payload { get; set; } = string.Empty;

    [Required]
    [Column("status")]
    public OutboxStatus Status { get; set; } = OutboxStatus.PENDING;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("published_at")]
    public DateTime? PublishedAt { get; set; }

    [MaxLength(500)]
    [Column("error_message")]
    public string? ErrorMessage { get; set; }
}
