using System.ComponentModel.DataAnnotations;

namespace TalentSphere.API.DTOs
{
    public class EnrollmentRequest
    {
        [Required]
        public Guid CourseId { get; set; }
    }
}
