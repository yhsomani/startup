using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TalentSphere.API.Models
{
    public class Discussion
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;

        [Required]
        public Guid CourseId { get; set; }
        
        [ForeignKey("CourseId")]
        public Course? Course { get; set; }

        [Required]
        public Guid AuthorId { get; set; }
        
        [ForeignKey("AuthorId")]
        public User? Author { get; set; }

        [Required]
        public DiscussionType Type { get; set; } = DiscussionType.General;

        public bool IsPinned { get; set; } = false;
        
        public bool IsLocked { get; set; } = false;
        
        public bool IsResolved { get; set; } = false;

        public int ViewCount { get; set; } = 0;
        
        public int LikeCount { get; set; } = 0;
        
        public int ReplyCount { get; set; = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? LastReplyAt { get; set; }
        
        public Guid? LastReplyById { get; set; }
    }

    public class DiscussionReply
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        public string Content { get; set; } = string.Empty;

        [Required]
        public Guid DiscussionId { get; set; }
        
        [ForeignKey("DiscussionId")]
        public Discussion? Discussion { get; set; }

        [Required]
        public Guid AuthorId { get; set; }
        
        [ForeignKey("AuthorId")]
        public User? Author { get; set; }

        public Guid? ParentReplyId { get; set; }
        
        [ForeignKey("ParentReplyId")]
        public DiscussionReply? ParentReply { get; set; }
        
        public ICollection<DiscussionReply>? ChildReplies { get; set; }

        public int LikeCount { get; set; } = 0;

        public bool IsEdited { get; set; } = false;
        
        public bool IsInstructorReply { get; set; } = false;
        
        public bool IsAcceptedAnswer { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? EditedAt { get; set; }
    }

    public class DiscussionLike
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }
        
        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        public Guid DiscussionId { get; set; }
        
        [ForeignKey("DiscussionId")]
        public Discussion? Discussion { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class ReplyLike
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }
        
        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        public Guid ReplyId { get; set; }
        
        [ForeignKey("ReplyId")]
        public DiscussionReply? Reply { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public enum DiscussionType
    {
        General = 0,
        Question = 1,
        Announcement = 2,
        Resource = 3,
        Assignment = 4
    }
}