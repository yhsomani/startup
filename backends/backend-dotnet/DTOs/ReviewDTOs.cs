using System.ComponentModel.DataAnnotations;

namespace TalentSphere.API.DTOs
{
    public class ReviewDTO
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string? UserName { get; set; }
        public string? UserAvatar { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsVerified { get; set; }
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

    public class RatingSummaryDTO
    {
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public Dictionary<int, int> RatingDistribution { get; set; }
        public double WouldRecommend { get; set; } // Percentage of 4-5 star ratings
    }

    public class PagedResult<T>
    {
        public List<T> Data { get; set; } = new List<T>();
        public PaginationMetadata Pagination { get; set; }
    }

    public class PaginationMetadata
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public bool HasNext { get; set; }
        public bool HasPrevious { get; set; }
    }
}