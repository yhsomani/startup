using System.Collections.Generic;

namespace TalentSphere.API.DTOs
{
    public class CourseDTO
    {
        public Guid Id { get; set; }
        public Guid InstructorId { get; set; }
        public string InstructorName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string Currency { get; set; } = "USD";
        public string? ThumbnailUrl { get; set; }
        public string? PreviewVideoUrl { get; set; }
        public bool IsPublished { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public List<SectionDTO>? Sections { get; set; }
        public List<SkillDTO>? Skills { get; set; }
    }

    public class SectionDTO
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int OrderIndex { get; set; }
        public List<LessonDTO>? Lessons { get; set; }
    }

    public class LessonDTO
    {
        public Guid Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int OrderIndex { get; set; }
        public string? VideoUrl { get; set; }
        public int? Duration { get; set; }
        public Guid? ChallengeId { get; set; }
    }

    public class SkillDTO
    {
        public Guid Id { get; set; }
        public string SkillName { get; set; } = string.Empty;
    }
    
    public class CourseListResponse
    {
         public List<CourseDTO> Data { get; set; } = new();
         public PaginationMetadata Pagination { get; set; } = new();
    }
    
    public class PaginationMetadata
    {
        public int Page { get; set; }
        public int Limit { get; set; }
        public long Total { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }
}
