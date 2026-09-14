using Microsoft.AspNetCore.Mvc;

namespace PaymentService.Controllers;

[ApiController]
public class HealthController : ControllerBase
{
    [HttpGet("/health")]
    [HttpGet("/health/live")]
    [HttpGet("/health/ready")]
    [HttpGet("/api/v1/health")]
    public IActionResult GetHealth()
    {
        return Ok(new
        {
            status = "UP",
            service = "payment-service",
            version = "1.0.0",
            timestamp = DateTime.UtcNow
        });
    }
}
