namespace PaymentService.Models.Enums;

public enum PaymentStatus
{
    PENDING,
    PROCESSING,
    SUCCEEDED,
    FAILED,
    CANCELLED,
    REFUND_PENDING,
    PARTIALLY_REFUNDED,
    REFUNDED,
    EXPIRED
}
