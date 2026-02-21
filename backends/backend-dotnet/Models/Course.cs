using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TalentSphere.API.Models
{
    public class Course
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        public Guid InstructorId { get; set; }
        [ForeignKey("InstructorId")]
        public User? Instructor { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Subtitle { get; set; }
        public string? Description { get; set; }

        public decimal Price { get; set; } = 0;
        public string Currency { get; set; } = "USD";

        public string? ThumbnailUrl { get; set; }
        public string? PreviewVideoUrl { get; set; }

        public bool IsPublished { get; set; } = false;
        public bool IsActive { get; set; } = true;

public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Section> Sections { get; set; } = new List<Section>();
        public ICollection<CourseSkill> Skills { get; set; } = new List<CourseSkill>();
        
        // Navigation properties for reviews
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
    }
}
