using FluentAssertions;
using Microsoft.EntityFrameworkCore;
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

public class RefundServiceTests
{
    private readonly PaymentDbContext _context;
    private readonly Mock<IRedisCacheService> _cacheMock;
    private readonly Mock<ILogger<RefundService>> _loggerMock;
    private readonly List<IPaymentProvider> _providers;
    private readonly RefundService _service;

    public RefundServiceTests()
    {
        var options = new DbContextOptionsBuilder<PaymentDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new PaymentDbContext(options);
        _cacheMock = new Mock<IRedisCacheService>();
        _loggerMock = new Mock<ILogger<RefundService>>();

        _providers = new List<IPaymentProvider>
        {
            new MockPaymentProvider()
        };

        _service = new RefundService(
            _context,
            _providers,
            _cacheMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task ProcessRefundAsync_FullRefund_ShouldUpdatePaymentToRefunded()
    {
        // Arrange
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            PaymentNumber = "PAY-20260913-REF111",
            OrderId = "order-ref-1",
            UserId = "user-ref-1",
            Amount = 100.00m,
            Currency = "USD",
            Status = PaymentStatus.SUCCEEDED,
            Provider = "MOCK",
            RefundedAmount = 0.00m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        var request = new RefundRequest
        {
            Amount = 100.00m,
            Reason = "Item return"
        };

        // Act
        var result = await _service.ProcessRefundAsync(payment.Id, request, "user-ref-1", isAdmin: false);

        // Assert
        result.Should().NotBeNull();
        result.Amount.Should().Be(100.00m);
        result.Status.Should().Be("SUCCEEDED");
        result.RefundNumber.Should().StartWith("REF-");

        var dbPayment = await _context.Payments.FindAsync(payment.Id);
        dbPayment!.Status.Should().Be(PaymentStatus.REFUNDED);
        dbPayment.RefundedAmount.Should().Be(100.00m);
    }

    [Fact]
    public async Task ProcessRefundAsync_PartialRefund_ShouldUpdatePaymentToPartiallyRefunded()
    {
        // Arrange
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            PaymentNumber = "PAY-20260913-REF222",
            OrderId = "order-ref-2",
            UserId = "user-ref-2",
            Amount = 100.00m,
            Currency = "USD",
            Status = PaymentStatus.SUCCEEDED,
            Provider = "MOCK",
            RefundedAmount = 0.00m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        var request = new RefundRequest
        {
            Amount = 40.00m,
            Reason = "Partial customer refund"
        };

        // Act
        var result = await _service.ProcessRefundAsync(payment.Id, request, "user-ref-2", isAdmin: false);

        // Assert
        result.Should().NotBeNull();
        result.Amount.Should().Be(40.00m);
        result.Status.Should().Be("SUCCEEDED");

        var dbPayment = await _context.Payments.FindAsync(payment.Id);
        dbPayment!.Status.Should().Be(PaymentStatus.PARTIALLY_REFUNDED);
        dbPayment.RefundedAmount.Should().Be(40.00m);
    }

    [Fact]
    public async Task ProcessRefundAsync_WhenAmountExceedsLimit_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            PaymentNumber = "PAY-20260913-REF333",
            OrderId = "order-ref-3",
            UserId = "user-ref-3",
            Amount = 100.00m,
            Currency = "USD",
            Status = PaymentStatus.SUCCEEDED,
            Provider = "MOCK",
            RefundedAmount = 80.00m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        var request = new RefundRequest
        {
            Amount = 30.00m // Exceeds remaining 20.00m
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.ProcessRefundAsync(payment.Id, request, "user-ref-3", isAdmin: false));
    }
}
