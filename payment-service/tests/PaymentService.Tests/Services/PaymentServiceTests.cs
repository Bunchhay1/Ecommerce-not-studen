using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using PaymentService.Cache;
using PaymentService.Data;
using PaymentService.DTOs;
using PaymentService.Exceptions;
using PaymentService.Models;
using PaymentService.Models.Enums;
using PaymentService.Providers;
using PaymentService.Services;
using Xunit;

namespace PaymentService.Tests.Services;

public class PaymentServiceTests
{
    private readonly PaymentDbContext _context;
    private readonly Mock<IRedisCacheService> _cacheMock;
    private readonly Mock<ILogger<PaymentService.Services.PaymentService>> _loggerMock;
    private readonly Mock<IConfiguration> _configMock;
    private readonly List<IPaymentProvider> _providers;
    private readonly PaymentService.Services.PaymentService _service;

    public PaymentServiceTests()
    {
        var options = new DbContextOptionsBuilder<PaymentDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new PaymentDbContext(options);
        _cacheMock = new Mock<IRedisCacheService>();
        _loggerMock = new Mock<ILogger<PaymentService.Services.PaymentService>>();
        _configMock = new Mock<IConfiguration>();

        _configMock.Setup(c => c["Payment:Provider"]).Returns("MOCK");

        _providers = new List<IPaymentProvider>
        {
            new MockPaymentProvider()
        };

        _service = new PaymentService.Services.PaymentService(
            _context,
            _providers,
            _cacheMock.Object,
            _loggerMock.Object,
            _configMock.Object);
    }

    [Fact]
    public async Task CreatePaymentAsync_ShouldCreatePaymentAndOutboxEvent_Successfully()
    {
        // Arrange
        var request = new CreatePaymentRequest
        {
            OrderId = "order-uuid-1",
            Amount = 150.00m,
            Currency = "USD",
            PaymentMethod = PaymentMethod.CARD,
            CardBrand = "VISA",
            CardLast4 = "4242"
        };

        // Act
        var result = await _service.CreatePaymentAsync("user-uuid-1", request, null);

        // Assert
        result.Should().NotBeNull();
        result.OrderId.Should().Be("order-uuid-1");
        result.UserId.Should().Be("user-uuid-1");
        result.Amount.Should().Be(150.00m);
        result.Status.Should().Be("SUCCEEDED");
        result.PaymentNumber.Should().StartWith("PAY-");

        var dbPayment = await _context.Payments.FirstOrDefaultAsync(p => p.Id == result.Id);
        dbPayment.Should().NotBeNull();
        dbPayment!.Status.Should().Be(PaymentStatus.SUCCEEDED);

        var outbox = await _context.OutboxEvents.FirstOrDefaultAsync(o => o.AggregateId == result.Id.ToString());
        outbox.Should().NotBeNull();
        outbox!.EventType.Should().Be("PaymentSucceeded");
    }

    [Fact]
    public async Task CreatePaymentAsync_WithIdempotencyKey_ShouldReturnExistingPaymentOnReplay()
    {
        // Arrange
        var request = new CreatePaymentRequest
        {
            OrderId = "order-uuid-2",
            Amount = 200.00m,
            Currency = "USD",
            PaymentMethod = PaymentMethod.CARD,
            IdempotencyKey = "idemp-key-123"
        };

        // Act 1
        var firstResult = await _service.CreatePaymentAsync("user-uuid-1", request, null);

        // Act 2 (Replay)
        var secondResult = await _service.CreatePaymentAsync("user-uuid-1", request, null);

        // Assert
        secondResult.Id.Should().Be(firstResult.Id);
        secondResult.PaymentNumber.Should().Be(firstResult.PaymentNumber);
        
        var totalPayments = await _context.Payments.CountAsync();
        totalPayments.Should().Be(1);
    }

    [Fact]
    public async Task GetPaymentByIdAsync_WhenExists_ShouldReturnPayment()
    {
        // Arrange
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            PaymentNumber = "PAY-20260913-111111",
            OrderId = "order-3",
            UserId = "user-3",
            Amount = 80.00m,
            Currency = "USD",
            Status = PaymentStatus.SUCCEEDED,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetPaymentByIdAsync(payment.Id, "user-3", isAdmin: false);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(payment.Id);
        result.PaymentNumber.Should().Be("PAY-20260913-111111");
    }

    [Fact]
    public async Task GetPaymentByIdAsync_WhenCustomerUnauthorized_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            PaymentNumber = "PAY-20260913-222222",
            OrderId = "order-4",
            UserId = "owner-user",
            Amount = 80.00m,
            Currency = "USD",
            Status = PaymentStatus.SUCCEEDED,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.GetPaymentByIdAsync(payment.Id, "different-user", isAdmin: false));
    }

    [Fact]
    public async Task CancelPaymentAsync_WhenPending_ShouldCancelSuccessfully()
    {
        // Arrange
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            PaymentNumber = "PAY-20260913-333333",
            OrderId = "order-5",
            UserId = "user-5",
            Amount = 50.00m,
            Currency = "USD",
            Status = PaymentStatus.PENDING,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.CancelPaymentAsync(payment.Id, "user-5", isAdmin: false);

        // Assert
        result.Status.Should().Be("CANCELLED");
        var dbPayment = await _context.Payments.FindAsync(payment.Id);
        dbPayment!.Status.Should().Be(PaymentStatus.CANCELLED);
    }
}
