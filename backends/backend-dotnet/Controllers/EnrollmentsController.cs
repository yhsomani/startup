using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalentSphere.API.DTOs;
using TalentSphere.API.Services;

namespace TalentSphere.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/enrollments")]
    public class EnrollmentsController : ControllerBase
    {
        private readonly ProgressService _progressService;

        public EnrollmentsController(ProgressService progressService)
        {
            _progressService = progressService;
        }

        [HttpPost]
        public async Task<ActionResult> CreateEnrollment(EnrollmentRequest request)
        {
            try
            {
                var result = await _progressService.CreateEnrollmentAsync(request.CourseId);
                return CreatedAtAction(nameof(CreateEnrollment), result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{enrollmentId}/lessons/{lessonId}/complete")]
        public async Task<ActionResult> MarkLessonComplete(Guid enrollmentId, Guid lessonId)
        {
            try
            {
                var result = await _progressService.MarkLessonCompleteAsync(enrollmentId, lessonId);
                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{enrollmentId}/progress")]
        public async Task<ActionResult> GetProgressDetails(Guid enrollmentId)
        {
            try
            {
                var result = await _progressService.GetProgressDetailsAsync(enrollmentId);
                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
