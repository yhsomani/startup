using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TalentSphere.API.Models
{
    public class Submission
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        public Guid ChallengeId { get; set; }
        [ForeignKey("ChallengeId")]
        public Challenge? Challenge { get; set; }

        public Guid UserId { get; set; }
        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        public string FilePath { get; set; } = string.Empty;

        [Required]
        public string Status { get; set; } = "pending"; // pending, grading, passed, failed

        public decimal? Score { get; set; }
        public string? Feedback { get; set; }

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public DateTime? GradedAt { get; set; }
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
