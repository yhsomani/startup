using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalentSphere.API.Services;
using TalentSphere.API.DTOs;

namespace TalentSphere.API.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class DiscussionsController : ControllerBase
    {
        private readonly IDiscussionService _discussionService;
        private readonly ILogger<DiscussionsController> _logger;

        public DiscussionsController(
            IDiscussionService discussionService,
            ILogger<DiscussionsController> logger)
        {
            _discussionService = discussionService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<DiscussionListResponse>> GetDiscussions(
            [FromQuery] Guid? courseId,
            [FromQuery] DiscussionType? type,
            [FromQuery] bool? isResolved,
            [FromQuery] bool? isPinned,
            [FromQuery] string? query,
            [FromQuery] DiscussionSortOrder sortBy = DiscussionSortOrder.Latest,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var request = new DiscussionSearchRequest
                {
                    CourseId = courseId,
                    Type = type,
                    IsResolved = isResolved,
                    IsPinned = isPinned,
                    Query = query,
                    SortBy = sortBy,
                    Page = page,
                    PageSize = pageSize
                };

                var result = await _discussionService.GetDiscussionsAsync(userId, request);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving discussions");
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpGet("{discussionId}")]
        public async Task<ActionResult<DiscussionDetailResponse>> GetDiscussion(Guid discussionId)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var result = await _discussionService.GetDiscussionByIdAsync(discussionId, userId);

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving discussion {DiscussionId}", discussionId);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpPost]
        public async Task<ActionResult<DiscussionDTO>> CreateDiscussion([FromBody] CreateDiscussionRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var result = await _discussionService.CreateDiscussionAsync(userId, request);

                _logger.LogInformation("Discussion created: {DiscussionId} by user {UserId}", result.Id, userId);

                return CreatedAtAction(nameof(GetDiscussion), new { discussionId = result.Id }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating discussion");
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpPut("{discussionId}")]
        public async Task<ActionResult<DiscussionDTO>> UpdateDiscussion(
            Guid discussionId, 
            [FromBody] UpdateDiscussionRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var result = await _discussionService.UpdateDiscussionAsync(userId, discussionId, request);

                _logger.LogInformation("Discussion updated: {DiscussionId} by user {UserId}", discussionId, userId);

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating discussion {DiscussionId}", discussionId);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpDelete("{discussionId}")]
        public async Task<ActionResult> DeleteDiscussion(Guid discussionId)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var result = await _discussionService.DeleteDiscussionAsync(userId, discussionId);

                if (!result)
                {
                    return NotFound(new { Message = "Discussion not found" });
                }

                _logger.LogInformation("Discussion deleted: {DiscussionId} by user {UserId}", discussionId, userId);

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting discussion {DiscussionId}", discussionId);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpPost("{discussionId}/like")]
        public async Task<ActionResult> ToggleDiscussionLike(Guid discussionId)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var isLiked = await _discussionService.ToggleDiscussionLikeAsync(userId, discussionId);

                _logger.LogInformation("Discussion {DiscussionId} like toggled by user {UserId}. IsLiked: {IsLiked}", 
                    discussionId, userId, isLiked);

                return Ok(new { IsLiked = isLiked });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling discussion like for {DiscussionId}", discussionId);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpPost("{discussionId}/replies")]
        public async Task<ActionResult<DiscussionReplyDTO>> CreateReply(
            Guid discussionId, 
            [FromBody] CreateReplyRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var result = await _discussionService.CreateReplyAsync(userId, discussionId, request);

                _logger.LogInformation("Reply created: {ReplyId} for discussion {DiscussionId} by user {UserId}", 
                    result.Id, discussionId, userId);

                return CreatedAtAction(nameof(GetDiscussion), new { discussionId }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating reply for discussion {DiscussionId}", discussionId);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpPut("replies/{replyId}")]
        public async Task<ActionResult<DiscussionReplyDTO>> UpdateReply(
            Guid replyId, 
            [FromBody] UpdateReplyRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var result = await _discussionService.UpdateReplyAsync(userId, replyId, request);

                _logger.LogInformation("Reply updated: {ReplyId} by user {UserId}", replyId, userId);

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating reply {ReplyId}", replyId);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpDelete("replies/{replyId}")]
        public async Task<ActionResult> DeleteReply(Guid replyId)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var result = await _discussionService.DeleteReplyAsync(userId, replyId);

                if (!result)
                {
                    return NotFound(new { Message = "Reply not found" });
                }

                _logger.LogInformation("Reply deleted: {ReplyId} by user {UserId}", replyId, userId);

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting reply {ReplyId}", replyId);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpPost("replies/{replyId}/like")]
        public async Task<ActionResult> ToggleReplyLike(Guid replyId)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var isLiked = await _discussionService.ToggleReplyLikeAsync(userId, replyId);

                _logger.LogInformation("Reply {ReplyId} like toggled by user {UserId}. IsLiked: {IsLiked}", 
                    replyId, userId, isLiked);

                return Ok(new { IsLiked = isLiked });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling reply like for {ReplyId}", replyId);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpPost("{discussionId}/replies/{replyId}/accept")]
        public async Task<ActionResult> MarkAsAcceptedAnswer(
            Guid discussionId, 
            Guid replyId)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var result = await _discussionService.MarkAsAcceptedAnswerAsync(userId, discussionId, replyId);

                _logger.LogInformation("Reply {ReplyId} marked as accepted answer for discussion {DiscussionId} by user {UserId}", 
                    replyId, discussionId, userId);

                return Ok(new { Success = result });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking reply as accepted answer for discussion {DiscussionId}", discussionId);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpGet("{discussionId}/stats")]
        public async Task<ActionResult<DiscussionStats>> GetDiscussionStats(Guid discussionId)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var result = await _discussionService.GetDiscussionStatsAsync(discussionId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving discussion stats for {DiscussionId}", discussionId);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpGet("courses/{courseId}/stats")]
        public async Task<ActionResult<DiscussionStats>> GetCourseDiscussionStats(Guid courseId)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var result = await _discussionService.GetDiscussionStatsAsync(courseId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving course discussion stats for {CourseId}", courseId);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpGet("user/activity")]
        public async Task<ActionResult<List<DiscussionActivityDTO>>> GetUserActivity(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var result = await _discussionService.GetUserActivityAsync(userId, page, pageSize);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user activity for user {UserId}", userId);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpGet("user/preferences")]
        public async Task<ActionResult<NotificationPreferencesDTO>> GetNotificationPreferences()
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var result = await _discussionService.GetNotificationPreferencesAsync(userId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notification preferences for user {UserId}", userId);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpPut("user/preferences")]
        public async Task<ActionResult> UpdateNotificationPreferences(
            [FromBody] NotificationPreferencesDTO preferences)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                await _discussionService.UpdateNotificationPreferencesAsync(userId, preferences);

                _logger.LogInformation("Notification preferences updated for user {UserId}", userId);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating notification preferences for user {UserId}", userId);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpPost("{discussionId}/moderate")]
        public async Task<ActionResult> ModerateDiscussion(
            Guid discussionId,
            [FromBody] ModerationActionDTO action)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                // Check if user is instructor or admin
                // This would require additional role checking logic

                _logger.LogInformation("Discussion {DiscussionId} moderated by user {UserId} with action {Action}", 
                    discussionId, userId, action.Action);

                return Ok(new { Success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error moderating discussion {DiscussionId}", discussionId);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }
    }
}