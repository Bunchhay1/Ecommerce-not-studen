using Microsoft.EntityFrameworkCore;
using PaymentService.Data;
using PaymentService.Kafka;
using PaymentService.Models.Enums;

namespace PaymentService.Outbox;

public class OutboxPublisherService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<OutboxPublisherService> _logger;

    public OutboxPublisherService(IServiceProvider serviceProvider, ILogger<OutboxPublisherService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Outbox Publisher Background Service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingOutboxEventsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing outbox events.");
            }

            await Task.Delay(2000, stoppingToken);
        }
    }

    private async Task ProcessPendingOutboxEventsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PaymentDbContext>();
        var producer = scope.ServiceProvider.GetRequiredService<IPaymentEventProducer>();

        var pendingEvents = await dbContext.OutboxEvents
            .Where(e => e.Status == OutboxStatus.PENDING)
            .OrderBy(e => e.CreatedAt)
            .Take(50)
            .ToListAsync(cancellationToken);

        if (!pendingEvents.Any()) return;

        foreach (var evt in pendingEvents)
        {
            try
            {
                await producer.PublishEventAsync(evt.EventType, evt.AggregateId, evt.Payload);
                evt.Status = OutboxStatus.PUBLISHED;
                evt.PublishedAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish outbox event {EventId}", evt.Id);
                evt.Status = OutboxStatus.FAILED;
                evt.ErrorMessage = ex.Message;
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
