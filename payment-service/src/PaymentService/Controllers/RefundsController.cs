using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using PaymentService.DTOs;
using PaymentService.Services;

namespace PaymentService.Controllers;

[ApiController]
[Route("api/v1/refunds")]
public class RefundsController : ControllerBase
{
    private readonly IRefundService _refundService;

    public RefundsController(IRefundService refundService)
    {
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

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<RefundResponse>>> GetRefundById([FromRoute] Guid id)
    {
        string userId = GetUserId();
        bool isAdmin = IsAdmin();

        var response = await _refundService.GetRefundByIdAsync(id, userId, isAdmin);
        return Ok(ApiResponse<RefundResponse>.Ok(response));
    }
}
