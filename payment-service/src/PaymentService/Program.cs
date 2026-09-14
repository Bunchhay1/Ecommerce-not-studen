using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PaymentService.Cache;
using PaymentService.Data;
using PaymentService.Kafka;
using PaymentService.Middleware;
using PaymentService.Outbox;
using PaymentService.Providers;
using PaymentService.Services;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// 2. Add DbContext
string connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Port=5439;Database=payment_db;Username=postgres;Password=postgres";

if (builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddDbContext<PaymentDbContext>(options =>
        options.UseInMemoryDatabase("TestPaymentDb"));
}
else
{
    builder.Services.AddDbContext<PaymentDbContext>(options =>
        options.UseNpgsql(connectionString));
}

// 3. Add Redis Cache
string? redisConn = builder.Configuration["Redis:ConnectionString"];
if (!string.IsNullOrWhiteSpace(redisConn))
{
    try
    {
        var multiplexer = ConnectionMultiplexer.Connect(redisConn);
        builder.Services.AddSingleton<IConnectionMultiplexer>(multiplexer);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Warning] Could not connect to Redis at {redisConn}: {ex.Message}");
    }
}
builder.Services.AddSingleton<IRedisCacheService, RedisCacheService>();

// 4. Add Kafka Producer & Outbox Background Service
builder.Services.AddSingleton<IPaymentEventProducer, PaymentEventProducer>();
builder.Services.AddHostedService<OutboxPublisherService>();

// 5. Add Payment Providers
builder.Services.AddScoped<IPaymentProvider, MockPaymentProvider>();
builder.Services.AddScoped<IPaymentProvider, StripePaymentProvider>();
builder.Services.AddScoped<IPaymentProvider, PayPalPaymentProvider>();

// 6. Add Domain Services
builder.Services.AddScoped<IPaymentService, PaymentService.Services.PaymentService>();
builder.Services.AddScoped<IRefundService, RefundService>();
builder.Services.AddScoped<IWebhookService, WebhookService>();

// 7. Add JWT Authentication
string jwtSecret = builder.Configuration["Jwt:Secret"] ?? "supersecretjwtkeyforidentityservice2026ecommerceplatform";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

// 8. Add Controllers & Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Payment Service API",
        Version = "v1",
        Description = "E-Commerce Core Service #08 — Payment Service API Documentation"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 9. Auto-migrate database in development/production if Npgsql is used
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PaymentDbContext>();
    if (db.Database.IsRelational())
    {
        try
        {
            db.Database.EnsureCreated();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Database Warning] Could not ensure created on relational DB: {ex.Message}");
        }
    }
}

// 10. Pipeline configuration
app.UseMiddleware<CorrelationMiddleware>();
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Payment Service v1"));
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Required for WebApplicationFactory in integration tests
public partial class Program { }
