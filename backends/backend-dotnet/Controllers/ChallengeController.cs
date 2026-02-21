using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TalentSphere.API.Services;

namespace TalentSphere.API.Controllers
{
    [ApiController]
    [Route("api/v1/challenges")]
    public class ChallengeController : ControllerBase
    {
        private readonly ChallengeService _challengeService;

        public ChallengeController(ChallengeService challengeService)
        {
            _challengeService = challengeService;
        }

        [Authorize]
        [HttpPost("{challengeId}/submit")]
        public async Task<ActionResult> SubmitSolution(Guid challengeId, IFormFile file)
        {
            try
            {
                var result = await _challengeService.SubmitSolutionAsync(challengeId, file);
                return Accepted(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("{challengeId}/submissions/{submissionId}")]
        public async Task<ActionResult> GetSubmissionStatus(Guid challengeId, Guid submissionId)
        {
            try
            {
                var result = await _challengeService.GetSubmissionStatusAsync(challengeId, submissionId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("{challengeId}/leaderboard")]
        public async Task<ActionResult> GetLeaderboard(Guid challengeId, [FromQuery] int limit = 100)
        {
            var result = await _challengeService.GetLeaderboardAsync(challengeId, limit);
            return Ok(result);
        }
        [HttpPost("evaluate")]
        public ActionResult Evaluate([FromBody] object submissionData)
        {
            // Stub for high-performance code evaluation
            // In a real implementation, this might offload to a dedicated compute cluster
            return Ok(new 
            { 
                status = "evaluated", 
                score = 100, 
                executionTimeMs = 42,
                feedback = "Excellent performance" 
            });
        }
    }
}
