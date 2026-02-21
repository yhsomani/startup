using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TalentSphere.API.Models
{
    public class Section
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        public Guid CourseId { get; set; }
        [ForeignKey("CourseId")]
        public Course? Course { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        public int OrderIndex { get; set; }
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    }
}
