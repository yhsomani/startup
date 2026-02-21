using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TalentSphere.API.Models
{
    public class Lesson
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        public Guid SectionId { get; set; }
        [ForeignKey("SectionId")]
        public Section? Section { get; set; }

        [Required]
        public string Type { get; set; } = "video"; // video, quiz, challenge, text

        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }
        public int OrderIndex { get; set; }

        public string? VideoUrl { get; set; }
        public int? Duration { get; set; }
        public string? ContentMarkdown { get; set; }
        public Guid? ChallengeId { get; set; }

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
