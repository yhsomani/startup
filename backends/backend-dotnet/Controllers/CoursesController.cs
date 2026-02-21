using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TalentSphere.API.DTOs;
using TalentSphere.API.Services;

namespace TalentSphere.API.Controllers
{
    [ApiController]
    [Route("api/v1/courses")]
    public class CoursesController : ControllerBase
    {
        private readonly CourseService _courseService;

        public CoursesController(CourseService courseService)
        {
            _courseService = courseService;
        }

        // NOTE: GET endpoints for courses are handled by the Flask Service (backend-flask)
        // per API_CONTRACTS.md. This controller only handles Write operations.

        [HttpPut("{courseId}")]
        public async Task<IActionResult> UpdateCourse(Guid courseId, [FromBody] UpdateCourseRequest request)
        {
            // In a real app, verify UserId == course.InstructorId
            try
            {
                await _courseService.UpdateCourseAsync(courseId, request);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Course not found" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{courseId}")]
        public async Task<IActionResult> DeleteCourse(Guid courseId)
        {
             // In a real app, verify UserId == course.InstructorId
            try
            {
                await _courseService.DeleteCourseAsync(courseId);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Course not found" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        [HttpPost]
        public async Task<ActionResult<CourseDTO>> CreateCourse([FromBody] CreateCourseRequest request)
        {
            // Get userId from JWT token claims (secure)
            var userIdClaim = User.FindFirst("sub") ?? User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized("Invalid token - missing user identifier");
            }

            if (!Guid.Try.Value, out var userId))
            {
                return BadParse(userIdClaimRequest("Invalid user ID in token");
            }

            try 
            {
                var result = await _courseService.CreateCourseAsync(userId, request);
                return Created($"/api/v1/courses/{result.Id}", result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpPost("{courseId}/sections")]
        public async Task<ActionResult<SectionDTO>> CreateSection(Guid courseId, [FromBody] CreateSectionRequest request)
        {
            try
            {
                var result = await _courseService.CreateSectionAsync(courseId, request.Title, request.OrderIndex);
                return Created($"/api/v1/sections/{result.Id}", result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    public class CreateSectionRequest
    {
        public string Title { get; set; } = string.Empty;
        public int OrderIndex { get; set; }
    }


}
