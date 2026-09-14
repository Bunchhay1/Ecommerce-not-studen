using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PaymentService.Cache;
using PaymentService.Data;
using PaymentService.DTOs;
using PaymentService.Exceptions;
using PaymentService.Models;
using PaymentService.Models.Enums;
using PaymentService.Providers;

namespace PaymentService.Services;

public class RefundService : IRefundService
{
    private readonly PaymentDbContext _context;
    private readonly IEnumerable<IPaymentProvider> _providers;
    private readonly IRedisCacheService _cache;
    private readonly ILogger<RefundService> _logger;

    public RefundService(
        PaymentDbContext context,
        IEnumerable<IPaymentProvider> providers,
        IRedisCacheService cache,
        ILogger<RefundService> logger)
    {
        _context = context;
        _providers = providers;
        _cache = cache;
        _logger = logger;
    }

    private IPaymentProvider GetProvider(string providerName)
    {
        var provider = _providers.FirstOrDefault(p => p.ProviderName.Equals(providerName, StringComparison.OrdinalIgnoreCase))
                       ?? _providers.FirstOrDefault(p => p.ProviderName.Equals("MOCK", StringComparison.OrdinalIgnoreCase))
                       ?? throw new PaymentProviderException($"No payment provider registered for '{providerName}'");

        return provider;
    }

    public async Task<RefundResponse> ProcessRefundAsync(Guid paymentId, RefundRequest request, string userId, bool isAdmin)
    {
        _logger.LogInformation("Processing refund of {Amount} for payment {PaymentId}", request.Amount, paymentId);

        var payment = await _context.Payments
            .Include(p => p.Refunds)
            .FirstOrDefaultAsync(p => p.Id == paymentId)
            ?? throw new PaymentNotFoundException(paymentId);

        if (!isAdmin && payment.UserId != userId && userId != "anonymousUser")
        {
            throw new UnauthorizedAccessException("You do not have permission to refund this payment.");
        }

        if (payment.Status != PaymentStatus.SUCCEEDED && payment.Status != PaymentStatus.PARTIALLY_REFUNDED)
        {
            throw new InvalidPaymentStatusException($"Cannot refund payment with status '{payment.Status}'. Only SUCCEEDED or PARTIALLY_REFUNDED payments can be refunded.");
        }

        decimal availableRefundable = payment.Amount - payment.RefundedAmount;
        if (request.Amount > availableRefundable)
        {
            throw new InvalidOperationException($"Refund amount of {request.Amount} exceeds remaining refundable amount of {availableRefundable}.");
        }

        string datePrefix = DateTime.UtcNow.ToString("yyyyMMdd");
        string randomSuffix = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        string refundNumber = $"REF-{datePrefix}-{randomSuffix}";

        var provider = GetProvider(payment.Provider);

        var refund = new Refund
        {
            Id = Guid.NewGuid(),
            RefundNumber = refundNumber,
            PaymentId = payment.Id,
            OrderId = payment.OrderId,
            Amount = request.Amount,
            Currency = payment.Currency,
            Reason = request.Reason ?? "Customer Request",
            Status = RefundStatus.PENDING,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        try
        {
            var result = await provider.RefundAsync(payment.ProviderPaymentId ?? payment.Id.ToString(), request.Amount, payment.Currency, request.Reason);
            refund.ProviderRefundId = result.ProviderRefundId;

            if (result.Success)
            {
                refund.Status = RefundStatus.SUCCEEDED;
                refund.CompletedAt = DateTime.UtcNow;

                payment.RefundedAmount += request.Amount;
                payment.Status = payment.RefundedAmount >= payment.Amount 
                    ? PaymentStatus.REFUNDED 
                    : PaymentStatus.PARTIALLY_REFUNDED;
                payment.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                refund.Status = RefundStatus.FAILED;
                refund.FailureMessage = result.FailureMessage;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Payment provider refund execution error for payment {PaymentId}", payment.Id);
            refund.Status = RefundStatus.FAILED;
            refund.FailureMessage = ex.Message;
        }

        string eventType = refund.Status == RefundStatus.SUCCEEDED ? "RefundSucceeded" : "RefundFailed";
        var outboxPayload = JsonSerializer.Serialize(new
        {
            eventId = Guid.NewGuid(),
            eventType,
            refundId = refund.Id,
            refundNumber = refund.RefundNumber,
            paymentId = payment.Id,
            paymentNumber = payment.PaymentNumber,
            orderId = payment.OrderId,
            amount = refund.Amount,
            currency = refund.Currency,
            status = refund.Status.ToString(),
            paymentStatus = payment.Status.ToString(),
            timestamp = DateTime.UtcNow
        });

        _context.Refunds.Add(refund);
        _context.OutboxEvents.Add(new OutboxEvent
        {
            Id = Guid.NewGuid(),
            AggregateType = "Refund",
            AggregateId = refund.Id.ToString(),
            EventType = eventType,
            Payload = outboxPayload,
            Status = OutboxStatus.PENDING,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        await _cache.RemoveAsync($"payment:{payment.Id}");
        await _cache.RemoveAsync($"payment:order:{payment.OrderId}");

        return RefundResponse.FromEntity(refund);
    }

    public async Task<RefundResponse> GetRefundByIdAsync(Guid id, string userId, bool isAdmin)
    {
        var refund = await _context.Refunds
            .Include(r => r.Payment)
            .FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new KeyNotFoundException($"Refund with ID '{id}' was not found.");

        if (!isAdmin && refund.Payment != null && refund.Payment.UserId != userId && userId != "anonymousUser")
        {
            throw new UnauthorizedAccessException("You do not have permission to view this refund.");
        }

        return RefundResponse.FromEntity(refund);
    }

    public async Task<PageResponse<RefundResponse>> GetRefundsAsync(int page, int size)
    {
        var query = _context.Refunds.AsQueryable();
        long total = await query.LongCountAsync();
        int pageIndex = Math.Max(0, page - 1);
        int pageSize = Math.Max(1, size);

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip(pageIndex * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PageResponse<RefundResponse>
        {
            Items = items.Select(RefundResponse.FromEntity),
            Page = page,
            Size = size,
            Total = total
        };
    }
}
