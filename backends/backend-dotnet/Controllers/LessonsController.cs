using Microsoft.AspNetCore.Mvc;
using TalentSphere.API.Services;

namespace TalentSphere.API.Controllers
{
    [ApiController]
    [Route("api/v1/lessons")]
    public class LessonsController : ControllerBase
    {
        private readonly VideoService _videoService;
        private readonly ILogger<LessonsController> _logger;

        public LessonsController(VideoService videoService, ILogger<LessonsController> logger)
        {
            _videoService = videoService;
            _logger = logger;
        }

        [HttpPost("{id}/video")]
        [RequestSizeLimit(500_000_000)] // 500MB limit
        public async Task<IActionResult> UploadVideo(Guid id, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            if (!file.ContentType.StartsWith("video/"))
                return BadRequest("Invalid file type. Must be video.");

            try
            {
                using var stream = file.OpenReadStream();
                var hlsPath = await _videoService.ProcessVideoAsync(stream, id);
                
                // In a real app, update the Lesson entity in DB with the video URL
                // await _lessonRepository.UpdateVideoUrl(id, hlsPath);

                return Ok(new { url = hlsPath });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Video processing failed.");
                return StatusCode(500, "Video processing failed.");
            }
        }
    }
}
