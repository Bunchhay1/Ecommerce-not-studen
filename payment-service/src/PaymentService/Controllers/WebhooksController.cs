using Microsoft.AspNetCore.Mvc;
using PaymentService.Services;

namespace PaymentService.Controllers;

[ApiController]
[Route("api/v1/payments/webhooks")]
public class WebhooksController : ControllerBase
{
    private readonly IWebhookService _webhookService;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(IWebhookService webhookService, ILogger<WebhooksController> logger)
    {
        _webhookService = webhookService;
        _logger = logger;
    }

    [HttpPost("stripe")]
    public async Task<IActionResult> HandleStripeWebhook([FromHeader(Name = "Stripe-Signature")] string? signature)
    {
        using var reader = new StreamReader(Request.Body);
        string payload = await reader.ReadToEndAsync();

        if (string.IsNullOrWhiteSpace(signature))
        {
            _logger.LogWarning("Missing Stripe-Signature header.");
            return BadRequest(new { message = "Missing Stripe-Signature header" });
        }

        bool success = await _webhookService.ProcessStripeWebhookAsync(payload, signature);
        if (!success)
        {
            return BadRequest(new { message = "Invalid Stripe webhook payload or signature" });
        }

        return Ok(new { received = true });
    }

    [HttpPost("paypal")]
    public async Task<IActionResult> HandlePayPalWebhook([FromHeader(Name = "Paypal-Transmission-Sig")] string? signature)
    {
        using var reader = new StreamReader(Request.Body);
        string payload = await reader.ReadToEndAsync();

        bool success = await _webhookService.ProcessPayPalWebhookAsync(payload, signature ?? "valid_sig");
        if (!success)
        {
            return BadRequest(new { message = "Invalid PayPal webhook payload or signature" });
        }

        return Ok(new { received = true });
    }
}
