using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Http;
using TalentSphere.API.Data;
using TalentSphere.API.Models;

namespace TalentSphere.API.Services
{
    public class ChallengeService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly string _uploadDir;

        public ChallengeService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor, IConfiguration configuration, IServiceScopeFactory scopeFactory)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _scopeFactory = scopeFactory;
            _uploadDir = configuration["UploadDir"] ?? "uploads/submissions";
        }

        private Guid GetCurrentUserId()
        {
            var idClaim = _httpContextAccessor.HttpContext?.User.FindFirst("id");
            if (idClaim == null) throw new UnauthorizedAccessException("User not authenticated");
            return Guid.Parse(idClaim.Value);
        }

        public async Task<object> SubmitSolutionAsync(Guid challengeId, IFormFile file)
        {
            var userId = GetCurrentUserId();
            var challenge = await _context.Challenges.FindAsync(challengeId);
            if (challenge == null) throw new Exception("Challenge not found");

            // Save file
            var filePath = Path.Combine(_uploadDir, challengeId.ToString(), userId.ToString());
            Directory.CreateDirectory(filePath);
            var fullPath = Path.Combine(filePath, Guid.NewGuid() + "_" + file.FileName);
            
            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var submission = new Submission
            {
                ChallengeId = challengeId,
                UserId = userId,
                FilePath = fullPath,
                Status = "pending",
                SubmittedAt = DateTime.UtcNow
            };

            _context.Submissions.Add(submission);
            await _context.SaveChangesAsync();

            // Trigger Async Grading
            _ = Task.Run(() => GradeSubmission(submission.Id));

            return new
            {
                SubmissionId = submission.Id,
                Status = "pending",
                Message = "Submission queued for grading"
            };
        }

        private async Task GradeSubmission(Guid submissionId)
        {
            await Task.Delay(2000); // Simulate processing

            using (var scope = _scopeFactory.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var submission = await context.Submissions.FindAsync(submissionId);
                
                if (submission != null)
                {
                   var score = new Random().NextDouble() * 100;
                   submission.Score = (decimal)score;
                   submission.Status = score >= 70 ? "passed" : "failed";
                   submission.Feedback = $"Automated grading complete. Score: {score:0.00}";
                   submission.GradedAt = DateTime.UtcNow;
                   await context.SaveChangesAsync();
                }
            }
        }

        public async Task<object> GetSubmissionStatusAsync(Guid challengeId, Guid submissionId)
        {
             var submission = await _context.Submissions.FindAsync(submissionId);
             if (submission == null) throw new Exception("Submission not found");
             
             // Check auth
             
             return new
             {
                 Id = submission.Id,
                 Status = submission.Status,
                 Score = submission.Score,
                 Feedback = submission.Feedback,
                 GradedAt = submission.GradedAt
             };
        }

        public async Task<object> GetLeaderboardAsync(Guid challengeId, int limit)
        {
            if (limit > 1000) limit = 1000;

            var leaderboard = await _context.Submissions
                .Where(s => s.ChallengeId == challengeId && s.Status == "passed" && s.IsActive)
                .GroupBy(s => new { s.UserId, s.User.Email })
                .Select(g => new
                {
                    UserId = g.Key.UserId,
                    Username = g.Key.Email,
                    BestScore = g.Max(s => s.Score),
                    SubmissionCount = g.Count(),
                    BestSubmissionAt = g.Max(s => s.GradedAt)
                })
                .OrderByDescending(x => x.BestScore)
                .ThenBy(x => x.BestSubmissionAt)
                .Take(limit)
                .ToListAsync();

            return new
            {
                ChallengeId = challengeId,
                Entries = leaderboard
            };
        }
    }
}
