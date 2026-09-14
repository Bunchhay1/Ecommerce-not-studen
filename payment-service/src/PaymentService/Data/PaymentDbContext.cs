using Microsoft.EntityFrameworkCore;
using PaymentService.Models;
using PaymentService.Models.Enums;

namespace PaymentService.Data;

public class PaymentDbContext : DbContext
{
    public PaymentDbContext(DbContextOptions<PaymentDbContext> options) : base(options)
    {
    }

    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Refund> Refunds => Set<Refund>();
    public DbSet<PaymentIdempotency> PaymentIdempotencies => Set<PaymentIdempotency>();
    public DbSet<WebhookEvent> WebhookEvents => Set<WebhookEvent>();
    public DbSet<OutboxEvent> OutboxEvents => Set<OutboxEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Payment
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PaymentNumber).IsUnique();
            entity.HasIndex(e => e.OrderId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.ProviderPaymentId);

            entity.Property(e => e.PaymentMethod)
                  .HasConversion<string>();

            entity.Property(e => e.Status)
                  .HasConversion<string>();

            entity.HasMany(e => e.Refunds)
                  .WithOne(r => r.Payment)
                  .HasForeignKey(r => r.PaymentId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Refund
        modelBuilder.Entity<Refund>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.RefundNumber).IsUnique();
            entity.HasIndex(e => e.PaymentId);
            entity.HasIndex(e => e.OrderId);
            entity.HasIndex(e => e.Status);

            entity.Property(e => e.Status)
                  .HasConversion<string>();
        });

        // PaymentIdempotency
        modelBuilder.Entity<PaymentIdempotency>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.IdempotencyKey).IsUnique();
            entity.HasIndex(e => e.PaymentId);
        });

        // WebhookEvent
        modelBuilder.Entity<WebhookEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.Provider, e.EventId }).IsUnique();
            entity.HasIndex(e => e.Processed);
        });

        // OutboxEvent
        modelBuilder.Entity<OutboxEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);

            entity.Property(e => e.Status)
                  .HasConversion<string>();
        });
    }
}
