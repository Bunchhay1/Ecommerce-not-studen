using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using PaymentService.Controllers;
using PaymentService.DTOs;
using PaymentService.Models.Enums;
using PaymentService.Services;
using Xunit;

namespace PaymentService.Tests.Controllers;

public class PaymentsControllerTests
{
    private readonly Mock<IPaymentService> _paymentServiceMock;
    private readonly Mock<IRefundService> _refundServiceMock;
    private readonly PaymentsController _controller;

    public PaymentsControllerTests()
    {
        _paymentServiceMock = new Mock<IPaymentService>();
        _refundServiceMock = new Mock<IRefundService>();

        _controller = new PaymentsController(_paymentServiceMock.Object, _refundServiceMock.Object);

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "user-test-1"),
            new Claim(ClaimTypes.Role, "ROLE_CUSTOMER")
        }, "TestAuth"));

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
    }

    [Fact]
    public async Task CreatePayment_ShouldReturn201Created()
    {
        // Arrange
        var request = new CreatePaymentRequest
        {
            OrderId = "order-test-1",
            Amount = 120.00m
        };

        var response = new PaymentResponse
        {
            Id = Guid.NewGuid(),
            PaymentNumber = "PAY-20260913-999999",
            OrderId = "order-test-1",
            UserId = "user-test-1",
            Amount = 120.00m,
            Status = "SUCCEEDED"
        };

        _paymentServiceMock
            .Setup(s => s.CreatePaymentAsync("user-test-1", request, It.IsAny<string?>()))
            .ReturnsAsync(response);

        // Act
        var actionResult = await _controller.CreatePayment(request, null);

        // Assert
        var objectResult = actionResult.Result as ObjectResult;
        objectResult.Should().NotBeNull();
        objectResult!.StatusCode.Should().Be(201);

        var apiResponse = objectResult.Value as ApiResponse<PaymentResponse>;
        apiResponse.Should().NotBeNull();
        apiResponse!.Success.Should().BeTrue();
        apiResponse.Data!.PaymentNumber.Should().Be("PAY-20260913-999999");
    }

    [Fact]
    public async Task GetPaymentById_ShouldReturn200Ok()
    {
        // Arrange
        var id = Guid.NewGuid();
        var response = new PaymentResponse
        {
            Id = id,
            PaymentNumber = "PAY-20260913-888888",
            OrderId = "order-test-2",
            UserId = "user-test-1",
            Amount = 90.00m,
            Status = "SUCCEEDED"
        };

        _paymentServiceMock
            .Setup(s => s.GetPaymentByIdAsync(id, "user-test-1", false))
            .ReturnsAsync(response);

        // Act
        var actionResult = await _controller.GetPaymentById(id);

        // Assert
        var okResult = actionResult.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var apiResponse = okResult.Value as ApiResponse<PaymentResponse>;
        apiResponse!.Success.Should().BeTrue();
        apiResponse.Data!.Id.Should().Be(id);
    }
}
