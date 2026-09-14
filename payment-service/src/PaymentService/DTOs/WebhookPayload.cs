namespace PaymentService.DTOs;

public class WebhookPayload
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? ProviderPaymentId { get; set; }
    public string? Status { get; set; }
    public decimal? Amount { get; set; }
    public string? Currency { get; set; }
    public string? FailureCode { get; set; }
    public string? FailureMessage { get; set; }
    public string? CardBrand { get; set; }
    public string? CardLast4 { get; set; }
}
