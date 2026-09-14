using FluentAssertions;
using PaymentService.DTOs;
using PaymentService.Models.Enums;
using PaymentService.Providers;
using Xunit;

namespace PaymentService.Tests.Providers;

public class MockPaymentProviderTests
{
    private readonly MockPaymentProvider _provider = new();

    [Fact]
    public async Task CreatePaymentAsync_ShouldReturnSuccessfulPaymentResult()
    {
        // Arrange
        var request = new CreatePaymentRequest
        {
            OrderId = "ord-1",
            CardBrand = "MASTERCARD",
            CardLast4 = "5555"
        };

        // Act
        var result = await _provider.CreatePaymentAsync(request, 99.99m, "PAY-001");

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Status.Should().Be(PaymentStatus.SUCCEEDED);
        result.ProviderPaymentId.Should().StartWith("mock_pi_");
        result.CardBrand.Should().Be("MASTERCARD");
        result.CardLast4.Should().Be("5555");
    }

    [Fact]
    public async Task RefundAsync_ShouldReturnSuccessfulRefundResult()
    {
        // Act
        var result = await _provider.RefundAsync("mock_pi_123", 50.00m, "USD", "return");

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Status.Should().Be(RefundStatus.SUCCEEDED);
        result.ProviderRefundId.Should().StartWith("mock_re_");
    }

    [Fact]
    public async Task VerifyWebhookAsync_WhenSignaturePresent_ShouldReturnTrue()
    {
        var result = await _provider.VerifyWebhookAsync("{}", "any_signature");
        result.Should().BeTrue();
    }
}
