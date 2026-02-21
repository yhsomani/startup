using System.ComponentModel.DataAnnotations;

namespace TalentSphere.API.DTOs
{
    public class CreateCourseRequest
    {
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string? Subtitle { get; set; }
        
        public string? Description { get; set; }
        
        public decimal Price { get; set; }
        
        public string? Currency { get; set; } = "USD";
    }
}
