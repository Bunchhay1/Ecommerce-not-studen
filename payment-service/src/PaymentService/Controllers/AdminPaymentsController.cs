using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaymentService.DTOs;
using PaymentService.Services;

namespace PaymentService.Controllers;

[ApiController]
[Route("api/v1/admin")]
public class AdminPaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly IRefundService _refundService;

    public AdminPaymentsController(IPaymentService paymentService, IRefundService refundService)
    {
        _paymentService = paymentService;
        _refundService = refundService;
    }

    [HttpGet("payments")]
    public async Task<ActionResult<ApiResponse<PageResponse<PaymentResponse>>>> GetPayments(
        [RequestParam] int page = 1,
        [RequestParam] int size = 20,
        [RequestParam] string? status = null,
        [RequestParam] string? userId = null)
    {
        var response = await _paymentService.GetPaymentsAsync(page, size, status, userId);
        return Ok(ApiResponse<PageResponse<PaymentResponse>>.Ok(response));
    }

    [HttpGet("payments/{id:guid}")]
    public async Task<ActionResult<ApiResponse<PaymentResponse>>> GetPaymentById([FromRoute] Guid id)
    {
        var response = await _paymentService.GetPaymentByIdAsync(id, "admin", isAdmin: true);
        return Ok(ApiResponse<PaymentResponse>.Ok(response));
    }

    [HttpGet("refunds")]
    public async Task<ActionResult<ApiResponse<PageResponse<RefundResponse>>>> GetRefunds(
        [RequestParam] int page = 1,
        [RequestParam] int size = 20)
    {
        var response = await _refundService.GetRefundsAsync(page, size);
        return Ok(ApiResponse<PageResponse<RefundResponse>>.Ok(response));
    }

    [HttpPost("payments/{id:guid}/refund")]
    public async Task<ActionResult<ApiResponse<RefundResponse>>> AdminRefund(
        [FromRoute] Guid id,
        [FromBody] RefundRequest request)
    {
        var response = await _refundService.ProcessRefundAsync(id, request, "admin", isAdmin: true);
        return Ok(ApiResponse<RefundResponse>.Ok(response, "Admin refund processed successfully"));
    }
}

public class RequestParamAttribute : FromQueryAttribute { }
