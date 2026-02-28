using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using TalentSphere.API.Data;
using TalentSphere.API.DTOs;
using TalentSphere.API.Models;

namespace TalentSphere.API.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class ReviewsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ReviewsController> _logger;

        public ReviewsController(ApplicationDbContext context, ILogger<ReviewsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("courses/{courseId}/reviews")]
        public async Task<ActionResult<PagedResult<ReviewDTO>>> GetCourseReviews(
            Guid courseId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortBy = "newest")
        {
            try
            {
                var query = _context.Reviews
                    .Where(r => r.CourseId == courseId && r.IsApproved)
                    .Include(r => r.User)
                    .AsQueryable();

                // Apply sorting
                query = sortBy.ToLower() switch
                {
                    "newest" => query.OrderByDescending(r => r.CreatedAt),
                    "oldest" => query.OrderBy(r => r.CreatedAt),
                    "highest" => query.OrderByDescending(r => r.Rating),
                    "lowest" => query.OrderBy(r => r.Rating),
                    _ => query.OrderByDescending(r => r.CreatedAt)
                };

                var totalCount = await query.CountAsync();
                var reviews = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(r => new ReviewDTO
                    {
                        Id = r.Id,
                        UserId = r.UserId,
                        UserName = r.User != null ? $"{r.User.FirstName} {r.User.LastName}".Trim() : "Anonymous",
                        UserAvatar = r.User?.ProfilePictureUrl,
                        Rating = r.Rating,
                        Comment = r.Comment,
                        CreatedAt = r.CreatedAt,
                        IsVerified = r.IsVerified
                    })
                    .ToListAsync();

                var averageRating = await _context.Reviews
                    .Where(r => r.CourseId == courseId && r.IsApproved)
                    .AverageAsync(r => r.Rating);

                var totalReviews = totalCount;

                return Ok(new PagedResult<ReviewDTO>
                {
                    Data = reviews,
                    Pagination = new ReviewPaginationMetadata
                    {
                        Page = page,
                        PageSize = pageSize,
                        TotalCount = totalReviews,
                        TotalPages = (int)Math.Ceiling((double)totalReviews / pageSize),
                        HasNext = page * pageSize < totalReviews,
                        HasPrevious = page > 1
                    },
                    AverageRating = Math.Round(averageRating, 2),
                    TotalReviews = totalReviews
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving reviews for course {CourseId}", courseId);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpPost("courses/{courseId}/reviews")]
        public async Task<ActionResult<ReviewDTO>> CreateReview(Guid courseId, [FromBody] CreateReviewRequest request)
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { Message = "User not authenticated" });
            }

            try
            {

                // Check if user is enrolled in the course
                var isEnrolled = await _context.Enrollments
                    .AnyAsync(e => e.CourseId == courseId && e.UserId == userId);

                if (!isEnrolled)
                {
                    return BadRequest(new { Message = "You must be enrolled in this course to leave a review" });
                }

                // Check if user has already reviewed this course
                var existingReview = await _context.Reviews
                    .AnyAsync(r => r.CourseId == courseId && r.UserId == userId);

                if (existingReview)
                {
                    return BadRequest(new { Message = "You have already reviewed this course" });
                }

                var review = new Review
                {
                    Id = Guid.NewGuid(),
                    CourseId = courseId,
                    UserId = userId,
                    Rating = request.Rating,
                    Comment = request.Comment?.Trim() ?? string.Empty,
                    IsApproved = true, // Auto-approve for now, can add moderation later
                    IsVerified = false, // Can be verified by instructor
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Reviews.Add(review);
                await _context.SaveChangesAsync();

                // Return the created review with user info
                var createdReview = await _context.Reviews
                    .Include(r => r.User)
                    .FirstAsync(r => r.Id == review.Id);

                var reviewDto = new ReviewDTO
                {
                    Id = createdReview.Id,
                    UserId = createdReview.UserId,
                    UserName = createdReview.User != null ? $"{createdReview.User.FirstName} {createdReview.User.LastName}".Trim() : "Anonymous",
                    UserAvatar = createdReview.User?.ProfilePictureUrl,
                    Rating = createdReview.Rating,
                    Comment = createdReview.Comment,
                    CreatedAt = createdReview.CreatedAt,
                    IsVerified = createdReview.IsVerified
                };

                return CreatedAtAction(nameof(GetCourseReviews), new { courseId }, reviewDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating review for course {CourseId} by user {UserId}", courseId, userIdClaim);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpPut("reviews/{reviewId}")]
        public async Task<ActionResult> UpdateReview(Guid reviewId, [FromBody] UpdateReviewRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var review = await _context.Reviews
                    .Include(r => r.User)
                    .FirstOrDefaultAsync(r => r.Id == reviewId);

                if (review == null)
                {
                    return NotFound(new { Message = "Review not found" });
                }

                if (review.UserId != userId)
                {
                    return StatusCode(403, new { Message = "You can only update your own reviews" });
                }

                review.Rating = request.Rating;
                review.Comment = request.Comment?.Trim() ?? review.Comment;
                review.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { Message = "Review updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating review {ReviewId}", reviewId);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpDelete("reviews/{reviewId}")]
        public async Task<ActionResult> DeleteReview(Guid reviewId)
        {
            try
            {
                var userIdClaim = User.FindFirst("user_id")?.Value;
                if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { Message = "User not authenticated" });
                }

                var review = await _context.Reviews
                    .FirstOrDefaultAsync(r => r.Id == reviewId);

                if (review == null)
                {
                    return NotFound(new { Message = "Review not found" });
                }

                if (review.UserId != userId)
                {
                    return StatusCode(403, new { Message = "You can only delete your own reviews" });
                }

                _context.Reviews.Remove(review);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Review deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting review {ReviewId}", reviewId);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpPost("reviews/{reviewId}/verify")]
        [Authorize(Roles = "Instructor,Admin")]
        public async Task<ActionResult> VerifyReview(Guid reviewId)
        {
            try
            {
                var review = await _context.Reviews.FindAsync(reviewId);

                if (review == null)
                {
                    return NotFound(new { Message = "Review not found" });
                }

                review.IsVerified = true;
                review.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { Message = "Review verified successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying review {ReviewId}", reviewId);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }

        [HttpGet("courses/{courseId}/rating-summary")]
        public async Task<ActionResult<RatingSummaryDTO>> GetCourseRatingSummary(Guid courseId)
        {
            try
            {
                var reviews = await _context.Reviews
                    .Where(r => r.CourseId == courseId && r.IsApproved)
                    .ToListAsync();

                if (!reviews.Any())
                {
                    return Ok(new RatingSummaryDTO
                    {
                        AverageRating = 0,
                        TotalReviews = 0,
                        RatingDistribution = new Dictionary<int, int>(),
                        WouldRecommend = 0
                    });
                }

                var averageRating = reviews.Average(r => r.Rating);
                var totalReviews = reviews.Count;

                var ratingDistribution = reviews
                    .GroupBy(r => r.Rating)
                    .ToDictionary(g => g.Key, g => g.Count());

                // Calculate would recommend percentage (4-5 star ratings)
                var wouldRecommendCount = reviews.Count(r => r.Rating >= 4);
                var wouldRecommendPercentage = totalReviews > 0 ? (double)wouldRecommendCount / totalReviews * 100 : 0;

                return Ok(new RatingSummaryDTO
                {
                    AverageRating = Math.Round(averageRating, 2),
                    TotalReviews = totalReviews,
                    RatingDistribution = ratingDistribution,
                    WouldRecommend = Math.Round(wouldRecommendPercentage, 1)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving rating summary for course {CourseId}", courseId);
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }
    }

    public class CreateReviewRequest
    {
        [Range(1, 5)]
        public int Rating { get; set; }

        [StringLength(2000)]
        public string? Comment { get; set; }
    }

    public class UpdateReviewRequest
    {
        [Range(1, 5)]
        public int Rating { get; set; }

        [StringLength(2000)]
        public string? Comment { get; set; }
    }
}