using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TalentSphere.API.Models
{
    public class Review
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        public Guid CourseId { get; set; }
        
        [ForeignKey("CourseId")]
        public Course? Course { get; set; }

        [Required]
        public Guid UserId { get; set; }
        
        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Range(1, 5)]
        [Required]
        public int Rating { get; set; }

        [StringLength(2000)]
        [Required]
        public string Comment { get; set; } = string.Empty;

        public bool IsVerified { get; set; } = false;

        public bool IsApproved { get; set; } = true; // Auto-approve, can be moderated later

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties for average rating calculation
        public ICollection<Course> Courses { get; set; } = new List<Course>();
    }
}