using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TalentSphere.API.Models
{
    public class LessonProgress
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        public Guid EnrollmentId { get; set; }
        [ForeignKey("EnrollmentId")]
        public Enrollment? Enrollment { get; set; }

        public Guid LessonId { get; set; }
        [ForeignKey("LessonId")]
        public Lesson? Lesson { get; set; }

        public bool IsCompleted { get; set; } = false;
        public DateTime? CompletedAt { get; set; }
        public int VideoPositionSeconds { get; set; } = 0;
        public DateTime? LastAccessedAt { get; set; }
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
