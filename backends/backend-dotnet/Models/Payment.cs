using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TalentSphere.API.Models
{
    public class Payment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }
        
        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        public Guid CourseId { get; set; }
        
        [ForeignKey("CourseId")]
        public Course? Course { get; set; }

        [Required]
        [Range(0.01, 10000.00)]
        public decimal Amount { get; set; }

        [Required]
        [StringLength(3)]
        public string Currency { get; set; } = "USD";

        [Required]
        public string PaymentMethod { get; set; } = "stripe"; // stripe, paypal, etc.

        public string StripePaymentIntentId { get; set; }
        public string StripePaymentMethodId { get; set; }

        [Required]
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

        public string? TransactionId { get; set; }
        
        public string? RefundId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class Subscription
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }
        
        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        public string Tier { get; set; }

        [Required]
        public decimal Price { get; set; }

        [Required]
        public string Currency { get; set; } = "USD";

        [Required]
        public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;

        public DateTime StartDate { get; set; } = DateTime.UtcNow;

        public DateTime? EndDate { get; set; }
        
        public string? StripeSubscriptionId { get; set; }
        
        public string? StripeCustomerId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public enum PaymentStatus
    {
        Pending = 0,
        Succeeded = 1,
        Failed = 2,
        Refunded = 3,
        Cancelled = 4
    }

    public enum SubscriptionStatus
    {
        Active = 0,
        Cancelled = 1,
        Expired = 2
    }
}