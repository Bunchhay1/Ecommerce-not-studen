using PaymentService.DTOs;

namespace PaymentService.Services;

public interface IRefundService
{
    Task<RefundResponse> ProcessRefundAsync(Guid paymentId, RefundRequest request, string userId, bool isAdmin);
    Task<RefundResponse> GetRefundByIdAsync(Guid id, string userId, bool isAdmin);
    Task<PageResponse<RefundResponse>> GetRefundsAsync(int page, int size);
}
