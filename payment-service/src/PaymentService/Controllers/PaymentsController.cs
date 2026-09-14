using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaymentService.DTOs;
using PaymentService.Services;

namespace PaymentService.Controllers;

[ApiController]
[Route("api/v1/payments")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly IRefundService _refundService;

    public PaymentsController(IPaymentService paymentService, IRefundService refundService)
    {
        _paymentService = paymentService;
        _refundService = refundService;
    }

    private string GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
               ?? User.FindFirst("sub")?.Value
               ?? User.Identity?.Name
               ?? "anonymousUser";
    }

    private bool IsAdmin()
    {
        return User.IsInRole("ROLE_ADMIN") || User.HasClaim(ClaimTypes.Role, "ROLE_ADMIN");
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<PaymentResponse>>> CreatePayment(
        [FromBody] CreatePaymentRequest request,
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey)
    {
        if (!string.IsNullOrWhiteSpace(idempotencyKey))
        {
            request.IdempotencyKey = idempotencyKey;
        }

        string userId = GetUserId();
        string? token = Request.Headers.Authorization.ToString().Replace("Bearer ", "");

        var response = await _paymentService.CreatePaymentAsync(userId, request, token);
        return StatusCode(201, ApiResponse<PaymentResponse>.Ok(response, "Payment created successfully"));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<PaymentResponse>>> GetPaymentById([FromRoute] Guid id)
    {
        string userId = GetUserId();
        bool isAdmin = IsAdmin();

        var response = await _paymentService.GetPaymentByIdAsync(id, userId, isAdmin);
        return Ok(ApiResponse<PaymentResponse>.Ok(response));
    }

    [HttpGet("order/{orderId}")]
    public async Task<ActionResult<ApiResponse<PaymentResponse>>> GetPaymentByOrderId([FromRoute] string orderId)
    {
        string userId = GetUserId();
        bool isAdmin = IsAdmin();

        var response = await _paymentService.GetPaymentByOrderIdAsync(orderId, userId, isAdmin);
        return Ok(ApiResponse<PaymentResponse>.Ok(response));
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<ApiResponse<PaymentResponse>>> CancelPayment([FromRoute] Guid id)
    {
        string userId = GetUserId();
        bool isAdmin = IsAdmin();

        var response = await _paymentService.CancelPaymentAsync(id, userId, isAdmin);
        return Ok(ApiResponse<PaymentResponse>.Ok(response, "Payment cancelled successfully"));
    }

    [HttpPost("{id:guid}/refund")]
    public async Task<ActionResult<ApiResponse<RefundResponse>>> RequestRefund(
        [FromRoute] Guid id,
        [FromBody] RefundRequest request)
    {
        string userId = GetUserId();
        bool isAdmin = IsAdmin();

        var response = await _refundService.ProcessRefundAsync(id, request, userId, isAdmin);
        return Ok(ApiResponse<RefundResponse>.Ok(response, "Refund processed successfully"));
    }
}
