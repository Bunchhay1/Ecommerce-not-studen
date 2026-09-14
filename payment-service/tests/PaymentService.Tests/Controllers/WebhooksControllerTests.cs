using System.Text;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using PaymentService.Controllers;
using PaymentService.Services;
using Xunit;

namespace PaymentService.Tests.Controllers;

public class WebhooksControllerTests
{
    private readonly Mock<IWebhookService> _webhookServiceMock;
    private readonly Mock<ILogger<WebhooksController>> _loggerMock;
    private readonly WebhooksController _controller;

    public WebhooksControllerTests()
    {
        _webhookServiceMock = new Mock<IWebhookService>();
        _loggerMock = new Mock<ILogger<WebhooksController>>();
        _controller = new WebhooksController(_webhookServiceMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task HandleStripeWebhook_WhenSignatureMissing_ShouldReturnBadRequest()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes("{}"));
        _controller.ControllerContext = new ControllerContext { HttpContext = context };

        // Act
        var result = await _controller.HandleStripeWebhook(null);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task HandleStripeWebhook_WhenValid_ShouldReturnOk()
    {
        // Arrange
        string payload = "{\"id\":\"evt_test_123\",\"type\":\"payment_intent.succeeded\"}";
        var context = new DefaultHttpContext();
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(payload));
        _controller.ControllerContext = new ControllerContext { HttpContext = context };

        _webhookServiceMock
            .Setup(w => w.ProcessStripeWebhookAsync(It.IsAny<string>(), "valid_sig"))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.HandleStripeWebhook("valid_sig");

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }
}
