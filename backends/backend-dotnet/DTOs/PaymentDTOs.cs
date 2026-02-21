using System.ComponentModel.DataAnnotations;
using TalentSphere.API.Models;

namespace TalentSphere.API.DTOs
{
    public class PaymentDTO
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid CourseId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; }
        public string PaymentMethod { get; set; }
        public PaymentStatus Status { get; set; }
        public string? TransactionId { get; set; }
        public string? StripePaymentIntentId { get; set; }
        public string? StripePaymentMethodId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class PaymentIntentDTO
    {
        public Guid Id { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; }
        public string ClientSecret { get; set; }
        public string PublishableKey { get; set; }
        public string PaymentIntentId { get; set; }
    }

    public class PaymentConfirmationDTO
    {
        public string TransactionId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; }
        public string Status { get; set; }
        public string Message { get; set; }
    }

    public class CreatePaymentIntentRequest
    {
        [Range(0.01, 10000.00)]
        public decimal Amount { get; set; }

        [Required]
        [StringLength(3)]
        public string Currency { get; set; } = "USD";

        [Required]
        public Guid CourseId { get; set; }

        public string? PaymentMethodId { get; set; }
    }

    public class ConfirmPaymentRequest
    {
        [Required]
        public Guid PaymentIntentId { get; set; }
    }

    public class RefundPaymentRequest
    {
        [Required]
        public Guid PaymentId { get; set; }

        [Range(0.01, 10000.00)]
        public decimal Amount { get; set; }

        public string? Reason { get; set; }
    }

    public class RefundDTO
    {
        public Guid Id { get; set; }
        public Guid PaymentId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; }
        public string Status { get; set; }
        public string? StripeRefundId { get; set; }
        public string? Reason { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class SubscriptionDTO
    {
        public Guid Id { get; set; }
        public string Tier { get; set; }
        public decimal Price { get; set; }
        public string Currency { get; set; }
        public SubscriptionStatus Status { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? StripeSubscriptionId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateSubscriptionRequest
    {
        [Required]
        public string Tier { get; set; }
        
        [Range(1, 1000.00)]
        public decimal Price { get; set; }

        [Required]
        [StringLength(3)]
        public string Currency { get; set; } = "USD";

        public string? PaymentMethodId { get; set; }
    }

    public class CancelSubscriptionRequest
    {
        public string? Reason { get; set; }
        public bool CancelImmediately { get; set; } = false;
    }

    public class PaymentStats
    {
        public int TotalPayments { get; set; }
        public decimal TotalAmount { get; set; }
        public Dictionary<string, int> PaymentMethodCounts { get; set; } = new();
        public Dictionary<PaymentStatus, int> StatusCounts { get; set; } = new();
        public decimal AveragePaymentAmount { get; set; }
        public int SuccessfulPayments { get; set; }
        public int FailedPayments { get; set; }
    }

    public class UserSubscriptionStats
    {
        public bool HasActiveSubscription { get; set; }
        public string? SubscriptionTier { get; set; }
        public DateTime? SubscriptionEndDate { get; set; }
        public bool IsOnTrial { get; set; }
        public DateTime? TrialEndDate { get; set; }
    }

    public class PaymentMethodDTO
    {
        public string Id { get; set; }
        public string Type { get; set; }
        public string Last4 { get; set; }
        public string Brand { get; set; }
        public string? CardholderName { get; set; }
        public int ExpiryMonth { get; set; }
        public int ExpiryYear { get; set; }
        public bool IsDefault { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PaymentWebhookEvent
    {
        public string Type { get; set; }
        public string EventId { get; set; }
        public DateTime CreatedAt { get; set; }
        public object? Data { get; set; }
    }

    public class PaymentWebhookResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string? ProcessedEventId { get; set; }
    }
}