using PaymentService.DTOs;

namespace PaymentService.Services;

public interface IPaymentService
{
    Task<PaymentResponse> CreatePaymentAsync(string userId, CreatePaymentRequest request, string? token);
    Task<PaymentResponse> GetPaymentByIdAsync(Guid id, string userId, bool isAdmin);
    Task<PaymentResponse> GetPaymentByOrderIdAsync(string orderId, string userId, bool isAdmin);
    Task<PaymentResponse> CancelPaymentAsync(Guid id, string userId, bool isAdmin);
    Task<PageResponse<PaymentResponse>> GetPaymentsAsync(int page, int size, string? status, string? userId);
}
