using Confluent.Kafka;

namespace PaymentService.Kafka;

public class PaymentEventProducer : IPaymentEventProducer, IDisposable
{
    private readonly IProducer<string, string>? _producer;
    private readonly string _topic;
    private readonly ILogger<PaymentEventProducer> _logger;

    public PaymentEventProducer(IConfiguration configuration, ILogger<PaymentEventProducer> logger)
    {
        _logger = logger;
        _topic = configuration["Kafka:Topic"] ?? "payment.events";
        string? bootstrapServers = configuration["Kafka:BootstrapServers"];

        if (!string.IsNullOrWhiteSpace(bootstrapServers))
        {
            try
            {
                var config = new ProducerConfig
                {
                    BootstrapServers = bootstrapServers,
                    Acks = Acks.All,
                    MessageTimeoutMs = 5000
                };
                _producer = new ProducerBuilder<string, string>(config).Build();
                _logger.LogInformation("Connected Kafka producer to {BootstrapServers} for topic {Topic}", bootstrapServers, _topic);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to initialize Kafka producer. Running in simulated mode.");
            }
        }
    }

    public async Task PublishEventAsync(string eventType, string aggregateId, string payload)
    {
        _logger.LogInformation("Publishing Kafka event {EventType} for aggregate {AggregateId} to {Topic}", eventType, aggregateId, _topic);
        if (_producer != null)
        {
            try
            {
                await _producer.ProduceAsync(_topic, new Message<string, string>
                {
                    Key = aggregateId,
                    Value = payload,
                    Headers = new Headers { { "eventType", System.Text.Encoding.UTF8.GetBytes(eventType) } }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kafka produce error for event {EventType}", eventType);
                throw;
            }
        }
    }

    public void Dispose()
    {
        _producer?.Flush(TimeSpan.FromSeconds(5));
        _producer?.Dispose();
    }
}
