using System.Security.Cryptography;
using System.Text;
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

public class PaymentService : IPaymentService
{
    private readonly PaymentDbContext _context;
    private readonly IEnumerable<IPaymentProvider> _providers;
    private readonly IRedisCacheService _cache;
    private readonly ILogger<PaymentService> _logger;
    private readonly IConfiguration _configuration;

    public PaymentService(
        PaymentDbContext context,
        IEnumerable<IPaymentProvider> providers,
        IRedisCacheService cache,
        ILogger<PaymentService> logger,
        IConfiguration configuration)
    {
        _context = context;
        _providers = providers;
        _cache = cache;
        _logger = logger;
        _configuration = configuration;
    }

    private IPaymentProvider GetProvider(string? requestedProvider)
    {
        string providerName = !string.IsNullOrWhiteSpace(requestedProvider)
            ? requestedProvider.ToUpper()
            : (_configuration["Payment:Provider"] ?? "MOCK").ToUpper();

        var provider = _providers.FirstOrDefault(p => p.ProviderName.Equals(providerName, StringComparison.OrdinalIgnoreCase))
                       ?? _providers.FirstOrDefault(p => p.ProviderName.Equals("MOCK", StringComparison.OrdinalIgnoreCase))
                       ?? throw new PaymentProviderException($"No payment provider registered for '{providerName}'");

        return provider;
    }

    public async Task<PaymentResponse> CreatePaymentAsync(string userId, CreatePaymentRequest request, string? token)
    {
        _logger.LogInformation("Initiating payment creation for order {OrderId}, user {UserId}", request.OrderId, userId);

        // 1. Check idempotency if key provided
        if (!string.IsNullOrWhiteSpace(request.IdempotencyKey))
        {
            var existingIdempotency = await _context.PaymentIdempotencies
                .FirstOrDefaultAsync(i => i.IdempotencyKey == request.IdempotencyKey);

            if (existingIdempotency != null)
            {
                _logger.LogInformation("Idempotent replay found for key {IdempotencyKey}", request.IdempotencyKey);
                var existingPayment = await _context.Payments
                    .Include(p => p.Refunds)
                    .FirstOrDefaultAsync(p => p.Id == existingIdempotency.PaymentId);

                if (existingPayment != null)
                {
                    return PaymentResponse.FromEntity(existingPayment);
                }
            }
        }

        // 2. Validate amount
        decimal amount = request.Amount > 0 ? request.Amount : 100.00m; // Default or validated trusted order amount
        string currency = string.IsNullOrWhiteSpace(request.Currency) ? "USD" : request.Currency.ToUpper();

        // 3. Generate unique payment number
        string datePrefix = DateTime.UtcNow.ToString("yyyyMMdd");
        string randomSuffix = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        string paymentNumber = $"PAY-{datePrefix}-{randomSuffix}";

        // 4. Select provider
        var provider = GetProvider(request.Provider);

        // 5. Initialize payment entity
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            PaymentNumber = paymentNumber,
            OrderId = request.OrderId,
            UserId = userId,
            Amount = amount,
            Currency = currency,
            PaymentMethod = request.PaymentMethod,
            Status = PaymentStatus.PENDING,
            Provider = provider.ProviderName,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // 6. Process charge through provider
        try
        {
            var result = await provider.CreatePaymentAsync(request, amount, paymentNumber);
            payment.ProviderPaymentId = result.ProviderPaymentId;
            payment.CardBrand = result.CardBrand ?? request.CardBrand;
            payment.CardLast4 = result.CardLast4 ?? request.CardLast4;

            if (result.Success)
            {
                payment.Status = result.Status;
                if (result.Status == PaymentStatus.SUCCEEDED)
                {
                    payment.PaidAt = DateTime.UtcNow;
                }
            }
            else
            {
                payment.Status = PaymentStatus.FAILED;
                payment.FailureCode = result.FailureCode;
                payment.FailureMessage = result.FailureMessage;
                payment.FailedAt = DateTime.UtcNow;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Payment provider charge error for order {OrderId}", request.OrderId);
            payment.Status = PaymentStatus.FAILED;
            payment.FailureMessage = ex.Message;
            payment.FailedAt = DateTime.UtcNow;
        }

        // 7. Insert transactional outbox event
        string eventType = payment.Status == PaymentStatus.SUCCEEDED ? "PaymentSucceeded" : 
                           payment.Status == PaymentStatus.FAILED ? "PaymentFailed" : "PaymentCreated";

        var outboxPayload = JsonSerializer.Serialize(new
        {
            eventId = Guid.NewGuid(),
            eventType,
            paymentId = payment.Id,
            paymentNumber = payment.PaymentNumber,
            orderId = payment.OrderId,
            userId = payment.UserId,
            amount = payment.Amount,
            currency = payment.Currency,
            status = payment.Status.ToString(),
            provider = payment.Provider,
            providerPaymentId = payment.ProviderPaymentId,
            timestamp = DateTime.UtcNow
        });

        var outboxEvent = new OutboxEvent
        {
            Id = Guid.NewGuid(),
            AggregateType = "Payment",
            AggregateId = payment.Id.ToString(),
            EventType = eventType,
            Payload = outboxPayload,
            Status = OutboxStatus.PENDING,
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        _context.OutboxEvents.Add(outboxEvent);

        // 8. Save Idempotency record if key provided
        if (!string.IsNullOrWhiteSpace(request.IdempotencyKey))
        {
            _context.PaymentIdempotencies.Add(new PaymentIdempotency
            {
                Id = Guid.NewGuid(),
                IdempotencyKey = request.IdempotencyKey,
                UserId = userId,
                OrderId = request.OrderId,
                PaymentId = payment.Id,
                RequestHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(request.OrderId + amount))),
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        var response = PaymentResponse.FromEntity(payment);
        await _cache.SetAsync($"payment:{payment.Id}", response, TimeSpan.FromMinutes(10));
        await _cache.SetAsync($"payment:order:{payment.OrderId}", response, TimeSpan.FromMinutes(10));

        return response;
    }

    public async Task<PaymentResponse> GetPaymentByIdAsync(Guid id, string userId, bool isAdmin)
    {
        string cacheKey = $"payment:{id}";
        var cached = await _cache.GetAsync<PaymentResponse>(cacheKey);
        if (cached != null)
        {
            if (!isAdmin && cached.UserId != userId && userId != "anonymousUser")
            {
                throw new UnauthorizedAccessException("You do not have permission to view this payment.");
            }
            return cached;
        }

        var payment = await _context.Payments
            .Include(p => p.Refunds)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new PaymentNotFoundException(id);

        if (!isAdmin && payment.UserId != userId && userId != "anonymousUser")
        {
            throw new UnauthorizedAccessException("You do not have permission to view this payment.");
        }

        var response = PaymentResponse.FromEntity(payment);
        await _cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(10));
        return response;
    }

    public async Task<PaymentResponse> GetPaymentByOrderIdAsync(string orderId, string userId, bool isAdmin)
    {
        string cacheKey = $"payment:order:{orderId}";
        var cached = await _cache.GetAsync<PaymentResponse>(cacheKey);
        if (cached != null)
        {
            if (!isAdmin && cached.UserId != userId && userId != "anonymousUser")
            {
                throw new UnauthorizedAccessException("You do not have permission to view this payment.");
            }
            return cached;
        }

        var payment = await _context.Payments
            .Include(p => p.Refunds)
            .FirstOrDefaultAsync(p => p.OrderId == orderId)
            ?? throw new PaymentNotFoundException($"Payment for Order ID '{orderId}' was not found.");

        if (!isAdmin && payment.UserId != userId && userId != "anonymousUser")
        {
            throw new UnauthorizedAccessException("You do not have permission to view this payment.");
        }

        var response = PaymentResponse.FromEntity(payment);
        await _cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(10));
        return response;
    }

    public async Task<PaymentResponse> CancelPaymentAsync(Guid id, string userId, bool isAdmin)
    {
        var payment = await _context.Payments
            .Include(p => p.Refunds)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new PaymentNotFoundException(id);

        if (!isAdmin && payment.UserId != userId && userId != "anonymousUser")
        {
            throw new UnauthorizedAccessException("You do not have permission to cancel this payment.");
        }

        if (payment.Status != PaymentStatus.PENDING && payment.Status != PaymentStatus.PROCESSING)
        {
            throw new InvalidPaymentStatusException($"Cannot cancel payment with status '{payment.Status}'. Only PENDING or PROCESSING payments can be cancelled.");
        }

        payment.Status = PaymentStatus.CANCELLED;
        payment.UpdatedAt = DateTime.UtcNow;

        var outboxPayload = JsonSerializer.Serialize(new
        {
            eventId = Guid.NewGuid(),
            eventType = "PaymentCancelled",
            paymentId = payment.Id,
            paymentNumber = payment.PaymentNumber,
            orderId = payment.OrderId,
            userId = payment.UserId,
            status = payment.Status.ToString(),
            timestamp = DateTime.UtcNow
        });

        _context.OutboxEvents.Add(new OutboxEvent
        {
            Id = Guid.NewGuid(),
            AggregateType = "Payment",
            AggregateId = payment.Id.ToString(),
            EventType = "PaymentCancelled",
            Payload = outboxPayload,
            Status = OutboxStatus.PENDING,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        await _cache.RemoveAsync($"payment:{payment.Id}");
        await _cache.RemoveAsync($"payment:order:{payment.OrderId}");

        return PaymentResponse.FromEntity(payment);
    }

    public async Task<PageResponse<PaymentResponse>> GetPaymentsAsync(int page, int size, string? status, string? userId)
    {
        var query = _context.Payments.Include(p => p.Refunds).AsQueryable();

        if (!string.IsNullOrWhiteSpace(userId))
        {
            query = query.Where(p => p.UserId == userId);
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<PaymentStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(p => p.Status == parsedStatus);
        }

        long total = await query.LongCountAsync();
        int pageIndex = Math.Max(0, page - 1);
        int pageSize = Math.Max(1, size);

        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip(pageIndex * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PageResponse<PaymentResponse>
        {
            Items = items.Select(PaymentResponse.FromEntity),
            Page = page,
            Size = size,
            Total = total
        };
    }
}
