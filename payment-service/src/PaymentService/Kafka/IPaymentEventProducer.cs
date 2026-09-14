namespace PaymentService.Kafka;

public interface IPaymentEventProducer
{
    Task PublishEventAsync(string eventType, string aggregateId, string payload);
}
