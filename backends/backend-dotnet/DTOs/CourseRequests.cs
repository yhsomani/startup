using System.ComponentModel.DataAnnotations;

namespace TalentSphere.API.DTOs
{
    public class UpdateCourseRequest
    {
        public string? Title { get; set; }
        public string? Subtitle { get; set; }
        public string? Description { get; set; }
        public decimal? Price { get; set; }
        public string? Currency { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? PreviewVideoUrl { get; set; }
        public bool? IsPublished { get; set; }
    }

    public class UpdateSectionRequest
    {
        public string Title { get; set; } = string.Empty;
        public int OrderIndex { get; set; }
    }

    public class UpdateLessonRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? VideoUrl { get; set; }
        public int? Duration { get; set; }
        public string? ContentMarkdown { get; set; }
    }

    public class CreateLessonRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Type { get; set; } = "video";
        public int OrderIndex { get; set; }
        public string? VideoUrl { get; set; }
        public int? Duration { get; set; }
        public string? ContentMarkdown { get; set; }
    }
}
