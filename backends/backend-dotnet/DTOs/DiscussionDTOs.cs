using System.ComponentModel.DataAnnotations;
using TalentSphere.API.Models;

namespace TalentSphere.API.DTOs
{
    public class DiscussionDTO
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public Guid CourseId { get; set; }
        public string CourseTitle { get; set; } = string.Empty;
        public Guid AuthorId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string AuthorAvatar { get; set; } = string.Empty;
        public string AuthorRole { get; set; } = string.Empty;
        public DiscussionType Type { get; set; }
        public bool IsPinned { get; set; }
        public bool IsLocked { get; set; }
        public bool IsResolved { get; set; }
        public int ViewCount { get; set; }
        public int LikeCount { get; set; }
        public int ReplyCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? LastReplyAt { get; set; }
        public string? LastReplyAuthorName { get; set; }
        public bool IsLikedByCurrentUser { get; set; }
        public string FormattedCreatedAt { get; set; } = string.Empty;
        public string FormattedUpdatedAt { get; set; } = string.Empty;
    }

    public class DiscussionReplyDTO
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public Guid DiscussionId { get; set; }
        public Guid AuthorId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string AuthorAvatar { get; set; } = string.Empty;
        public string AuthorRole { get; set; } = string.Empty;
        public Guid? ParentReplyId { get; set; }
        public string? ParentReplyAuthorName { get; set; }
        public List<DiscussionReplyDTO> ChildReplies { get; set; } = new();
        public int LikeCount { get; set; }
        public bool IsEdited { get; set; }
        public bool IsInstructorReply { get; set; }
        public bool IsAcceptedAnswer { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? EditedAt { get; set; }
        public bool IsLikedByCurrentUser { get; set; }
        public string FormattedCreatedAt { get; set; } = string.Empty;
        public string FormattedEditedAt { get; set; } = string.Empty;
    }

    public class CreateDiscussionRequest
    {
        [Required]
        [StringLength(200, MinimumLength = 5)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(5000, MinimumLength = 10)]
        public string Content { get; set; } = string.Empty;

        [Required]
        public Guid CourseId { get; set; }

        [Required]
        public DiscussionType Type { get; set; }
    }

    public class UpdateDiscussionRequest
    {
        [Required]
        [StringLength(200, MinimumLength = 5)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(5000, MinimumLength = 10)]
        public string Content { get; set; } = string.Empty;
    }

    public class CreateReplyRequest
    {
        [Required]
        [StringLength(2000, MinimumLength = 5)]
        public string Content { get; set; } = string.Empty;

        public Guid? ParentReplyId { get; set; }
    }

    public class UpdateReplyRequest
    {
        [Required]
        [StringLength(2000, MinimumLength = 5)]
        public string Content { get; set; } = string.Empty;
    }

    public class DiscussionSearchRequest
    {
        public string? Query { get; set; }
        public Guid? CourseId { get; set; }
        public DiscussionType? Type { get; set; }
        public bool? IsResolved { get; set; }
        public bool? IsPinned { get; set; }
        public DiscussionSortOrder SortBy { get; set; } = DiscussionSortOrder.Latest;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class DiscussionListResponse
    {
        public List<DiscussionDTO> Discussions { get; set; } = new();
        public PaginationMetadata Pagination { get; set; } = new();
        public DiscussionStats Stats { get; set; } = new();
    }

    public class DiscussionDetailResponse
    {
        public DiscussionDTO Discussion { get; set; } = new();
        public List<DiscussionReplyDTO> Replies { get; set; } = new();
        public DiscussionStats Stats { get; set; } = new();
    }

    public class DiscussionStats
    {
        public int TotalDiscussions { get; set; }
        public int TotalReplies { get; set; }
        public int ResolvedQuestions { get; set; }
        public int PendingQuestions { get; set; }
        public int UserParticipationCount { get; set; }
        public Dictionary<DiscussionType, int> TypeDistribution { get; set; } = new();
    }

    public enum DiscussionSortOrder
    {
        Latest = 0,
        Oldest = 1,
        MostReplies = 2,
        MostLikes = 3,
        MostViews = 4,
        PinnedFirst = 5
    }

    public class DiscussionActivityDTO
    {
        public Guid Id { get; set; }
        public string Type { get; set; } = string.Empty; // "discussion" or "reply"
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public Guid CourseId { get; set; }
        public string CourseTitle { get; set; } = string.Empty;
        public Guid AuthorId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string AuthorAvatar { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string FormattedCreatedAt { get; set; } = string.Empty;
        public string ActionUrl { get; set; } = string.Empty;
    }

    public class NotificationPreferencesDTO
    {
        public bool NewDiscussionNotifications { get; set; } = true;
        public bool ReplyNotifications { get; set; } = true;
        public bool LikeNotifications { get; set; } = false;
        public bool InstructorResponseNotifications { get; set; } = true;
        public bool DailyDigest { get; set; } = false;
        public List<Guid> WatchedCourses { get; set; } = new();
    }

    public class ModerationActionDTO
    {
        public Guid DiscussionId { get; set; }
        public Guid? ReplyId { get; set; }
        public string Action { get; set; } = string.Empty; // "pin", "lock", "resolve", "delete", "accept_answer"
        public string? Reason { get; set; }
    }
}