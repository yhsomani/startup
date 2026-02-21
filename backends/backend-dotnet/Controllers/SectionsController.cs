using Microsoft.AspNetCore.Mvc;
using TalentSphere.API.DTOs;
using TalentSphere.API.Services;

namespace TalentSphere.API.Controllers
{
    [ApiController]
    [Route("api/v1/sections")]
    public class SectionsController : ControllerBase
    {
        private readonly CourseService _courseService;

        public SectionsController(CourseService courseService)
        {
            _courseService = courseService;
        }

        [HttpPost("{sectionId}/lessons")]
        public async Task<ActionResult<LessonDTO>> CreateLesson(Guid sectionId, [FromBody] CreateLessonRequest request)
        {
            try
            {
                var result = await _courseService.CreateLessonAsync(
                    sectionId, 
                    request.Title, 
                    request.Type, 
                    request.OrderIndex, 
                    request.VideoUrl, 
                    request.Duration, 
                    request.ContentMarkdown
                );
                return CreatedAtAction(nameof(GetLesson), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("lessons/{id}")]
        public async Task<ActionResult<LessonDTO>> GetLesson(Guid id)
        {
            var lesson = await _courseService.GetLessonByIdAsync(id);
            
            if (lesson == null)
            {
                return NotFound(new { message = "Lesson not found" });
            }
            
            return Ok(lesson);
        }
        [HttpPut("{sectionId}")]
        public async Task<IActionResult> UpdateSection(Guid sectionId, [FromBody] UpdateSectionRequest request)
        {
            try
            {
                await _courseService.UpdateSectionAsync(sectionId, request.Title, request.OrderIndex);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{sectionId}")]
        public async Task<IActionResult> DeleteSection(Guid sectionId)
        {
            try
            {
                await _courseService.DeleteSectionAsync(sectionId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }


}
