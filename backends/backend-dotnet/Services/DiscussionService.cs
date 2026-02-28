using Microsoft.EntityFrameworkCore;
using TalentSphere.API.Data;
using TalentSphere.API.Models;
using TalentSphere.API.DTOs;

namespace TalentSphere.API.Services
{
    public interface IDiscussionService
    {
        Task<DiscussionListResponse> GetDiscussionsAsync(Guid userId, DiscussionSearchRequest request);
        Task<DiscussionDetailResponse> GetDiscussionByIdAsync(Guid discussionId, Guid userId);
        Task<DiscussionDTO> CreateDiscussionAsync(Guid userId, CreateDiscussionRequest request);
        Task<DiscussionDTO> UpdateDiscussionAsync(Guid userId, Guid discussionId, UpdateDiscussionRequest request);
        Task<bool> DeleteDiscussionAsync(Guid userId, Guid discussionId);
        Task<DiscussionReplyDTO> CreateReplyAsync(Guid userId, Guid discussionId, CreateReplyRequest request);
        Task<DiscussionReplyDTO> UpdateReplyAsync(Guid userId, Guid replyId, UpdateReplyRequest request);
        Task<bool> DeleteReplyAsync(Guid userId, Guid replyId);
        Task<bool> ToggleDiscussionLikeAsync(Guid userId, Guid discussionId);
        Task<bool> ToggleReplyLikeAsync(Guid userId, Guid replyId);
        Task<bool> MarkAsAcceptedAnswerAsync(Guid userId, Guid discussionId, Guid replyId);
        Task<DiscussionStats> GetDiscussionStatsAsync(Guid courseId);
        Task<List<DiscussionActivityDTO>> GetUserActivityAsync(Guid userId, int page = 1, int pageSize = 10);
        Task<NotificationPreferencesDTO> GetNotificationPreferencesAsync(Guid userId);
        Task UpdateNotificationPreferencesAsync(Guid userId, NotificationPreferencesDTO preferences);
    }

    public class DiscussionService : IDiscussionService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DiscussionService> _logger;

        public DiscussionService(ApplicationDbContext context, ILogger<DiscussionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<DiscussionListResponse> GetDiscussionsAsync(Guid userId, DiscussionSearchRequest request)
        {
            try
            {
                var query = _context.Discussions
                    .Include(d => d.Author)
                    .Include(d => d.Course)
                    .AsQueryable();

                // Apply filters
                if (request.CourseId.HasValue)
                {
                    query = query.Where(d => d.CourseId == request.CourseId.Value);
                }

                if (request.Type.HasValue)
                {
                    query = query.Where(d => d.Type == request.Type.Value);
                }

                if (request.IsResolved.HasValue)
                {
                    query = query.Where(d => d.IsResolved == request.IsResolved.Value);
                }

                if (request.IsPinned.HasValue)
                {
                    query = query.Where(d => d.IsPinned == request.IsPinned.Value);
                }

                if (!string.IsNullOrEmpty(request.Query))
                {
                    query = query.Where(d => 
                        d.Title.Contains(request.Query) || 
                        d.Content.Contains(request.Query));
                }

                // Apply sorting
                query = request.SortBy switch
                {
                    DiscussionSortOrder.Latest => query.OrderByDescending(d => d.CreatedAt),
                    DiscussionSortOrder.Oldest => query.OrderBy(d => d.CreatedAt),
                    DiscussionSortOrder.MostReplies => query.OrderByDescending(d => d.ReplyCount),
                    DiscussionSortOrder.MostLikes => query.OrderByDescending(d => d.LikeCount),
                    DiscussionSortOrder.MostViews => query.OrderByDescending(d => d.ViewCount),
                    DiscussionSortOrder.PinnedFirst => query.OrderByDescending(d => d.IsPinned).ThenByDescending(d => d.CreatedAt),
                    _ => query.OrderByDescending(d => d.CreatedAt)
                };

                var totalCount = await query.CountAsync();

                var discussions = await query
                    .Skip((request.Page - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .Select(d => new DiscussionDTO
                    {
                        Id = d.Id,
                        Title = d.Title,
                        Content = d.Content.Length > 200 ? d.Content.Substring(0, 200) + "..." : d.Content,
                        CourseId = d.CourseId,
                        CourseTitle = d.Course!.Title,
                        AuthorId = d.AuthorId,
                        AuthorName = d.Author!.FirstName + " " + d.Author.LastName,
                        AuthorAvatar = d.Author.ProfilePictureUrl ?? "",
                        AuthorRole = d.Author.Role.ToString(),
                        Type = d.Type,
                        IsPinned = d.IsPinned,
                        IsLocked = d.IsLocked,
                        IsResolved = d.IsResolved,
                        ViewCount = d.ViewCount,
                        LikeCount = d.LikeCount,
                        ReplyCount = d.ReplyCount,
                        CreatedAt = d.CreatedAt,
                        UpdatedAt = d.UpdatedAt,
                        LastReplyAt = d.LastReplyAt,
                        IsLikedByCurrentUser = _context.DiscussionLikes.Any(dl => dl.UserId == userId && dl.DiscussionId == d.Id),
                        FormattedCreatedAt = d.CreatedAt.ToString("MMM dd, yyyy"),
                        FormattedUpdatedAt = d.UpdatedAt.ToString("MMM dd, yyyy")
                    })
                    .ToListAsync();

                var stats = await GetDiscussionStatsAsync(request.CourseId ?? Guid.Empty);

                return new DiscussionListResponse
                {
                    Discussions = discussions,
                    Pagination = new PaginationMetadata
                    {
                        Page = request.Page,
                        PageSize = request.PageSize,
                        TotalCount = totalCount,
                        TotalPages = (int)Math.Ceiling((double)totalCount / request.PageSize),
                        HasNext = request.Page * request.PageSize < totalCount,
                        HasPrevious = request.Page > 1
                    },
                    Stats = stats
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving discussions for user {UserId}", userId);
                throw;
            }
        }

        public async Task<DiscussionDetailResponse> GetDiscussionByIdAsync(Guid discussionId, Guid userId)
        {
            try
            {
                var discussion = await _context.Discussions
                    .Include(d => d.Author)
                    .Include(d => d.Course)
                    .FirstOrDefaultAsync(d => d.Id == discussionId);

                if (discussion == null)
                {
                    throw new ArgumentException("Discussion not found");
                }

                // Increment view count
                discussion.ViewCount++;
                await _context.SaveChangesAsync();

                var discussionDto = new DiscussionDTO
                {
                    Id = discussion.Id,
                    Title = discussion.Title,
                    Content = discussion.Content,
                    CourseId = discussion.CourseId,
                    CourseTitle = discussion.Course!.Title,
                    AuthorId = discussion.AuthorId,
                    AuthorName = discussion.Author!.FirstName + " " + discussion.Author.LastName,
                    AuthorAvatar = discussion.Author.ProfilePictureUrl ?? "",
                    AuthorRole = discussion.Author.Role.ToString(),
                    Type = discussion.Type,
                    IsPinned = discussion.IsPinned,
                    IsLocked = discussion.IsLocked,
                    IsResolved = discussion.IsResolved,
                    ViewCount = discussion.ViewCount,
                    LikeCount = discussion.LikeCount,
                    ReplyCount = discussion.ReplyCount,
                    CreatedAt = discussion.CreatedAt,
                    UpdatedAt = discussion.UpdatedAt,
                    LastReplyAt = discussion.LastReplyAt,
                    IsLikedByCurrentUser = _context.DiscussionLikes.Any(dl => dl.UserId == userId && dl.DiscussionId == discussionId),
                    FormattedCreatedAt = discussion.CreatedAt.ToString("MMM dd, yyyy 'at' HH:mm"),
                    FormattedUpdatedAt = discussion.UpdatedAt.ToString("MMM dd, yyyy 'at' HH:mm")
                };

                var replies = await GetRepliesForDiscussionAsync(discussionId, userId);
                var stats = await GetDiscussionStatsAsync(discussion.CourseId);

                return new DiscussionDetailResponse
                {
                    Discussion = discussionDto,
                    Replies = replies,
                    Stats = stats
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving discussion {DiscussionId}", discussionId);
                throw;
            }
        }

        private async Task<List<DiscussionReplyDTO>> GetRepliesForDiscussionAsync(Guid discussionId, Guid userId)
        {
            var replies = await _context.DiscussionReplies
                .Include(r => r.Author)
                .Include(r => r.ParentReply)
                .ThenInclude(pr => pr.Author)
                .Where(r => r.DiscussionId == discussionId)
                .OrderBy(r => r.CreatedAt)
                .ToListAsync();

            var replyDict = new Dictionary<Guid, DiscussionReplyDTO>();
            
            // First pass: create DTOs for all replies
            foreach (var reply in replies)
            {
                replyDict[reply.Id] = new DiscussionReplyDTO
                {
                    Id = reply.Id,
                    Content = reply.Content,
                    DiscussionId = reply.DiscussionId,
                    AuthorId = reply.AuthorId,
                    AuthorName = reply.Author!.FirstName + " " + reply.Author.LastName,
                    AuthorAvatar = reply.Author.ProfilePictureUrl ?? "",
                    AuthorRole = reply.Author.Role.ToString(),
                    ParentReplyId = reply.ParentReplyId,
                    ParentReplyAuthorName = reply.ParentReply?.Author != null 
                        ? reply.ParentReply.Author.FirstName + " " + reply.ParentReply.Author.LastName 
                        : null,
                    LikeCount = reply.LikeCount,
                    IsEdited = reply.IsEdited,
                    IsInstructorReply = reply.IsInstructorReply,
                    IsAcceptedAnswer = reply.IsAcceptedAnswer,
                    CreatedAt = reply.CreatedAt,
                    UpdatedAt = reply.UpdatedAt,
                    EditedAt = reply.EditedAt,
                    IsLikedByCurrentUser = _context.ReplyLikes.Any(rl => rl.UserId == userId && rl.ReplyId == reply.Id),
                    FormattedCreatedAt = reply.CreatedAt.ToString("MMM dd, yyyy 'at' HH:mm"),
                    FormattedEditedAt = reply.EditedAt?.ToString("MMM dd, yyyy 'at' HH:mm") ?? ""
                };
            }

            // Second pass: build hierarchy
            var rootReplies = new List<DiscussionReplyDTO>();
            foreach (var kvp in replyDict)
            {
                var replyDto = kvp.Value;
                if (replyDto.ParentReplyId.HasValue && replyDict.ContainsKey(replyDto.ParentReplyId.Value))
                {
                    replyDict[replyDto.ParentReplyId.Value].ChildReplies.Add(replyDto);
                }
                else
                {
                    rootReplies.Add(replyDto);
                }
            }

            return rootReplies;
        }

        public async Task<DiscussionDTO> CreateDiscussionAsync(Guid userId, CreateDiscussionRequest request)
        {
            try
            {
                // Verify course exists and user has access
                var course = await _context.Courses.FindAsync(request.CourseId);
                if (course == null)
                {
                    throw new ArgumentException("Course not found");
                }

                var discussion = new Discussion
                {
                    Id = Guid.NewGuid(),
                    Title = request.Title.Trim(),
                    Content = request.Content.Trim(),
                    CourseId = request.CourseId,
                    AuthorId = userId,
                    Type = request.Type,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Discussions.Add(discussion);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Discussion created: {DiscussionId} by user {UserId}", discussion.Id, userId);

                return await GetDiscussionDTOByIdAsync(discussion.Id, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating discussion for user {UserId}", userId);
                throw;
            }
        }

        public async Task<DiscussionDTO> UpdateDiscussionAsync(Guid userId, Guid discussionId, UpdateDiscussionRequest request)
        {
            try
            {
                var discussion = await _context.Discussions
                    .FirstOrDefaultAsync(d => d.Id == discussionId && d.AuthorId == userId);

                if (discussion == null)
                {
                    throw new ArgumentException("Discussion not found or access denied");
                }

                discussion.Title = request.Title.Trim();
                discussion.Content = request.Content.Trim();
                discussion.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Discussion updated: {DiscussionId} by user {UserId}", discussionId, userId);

                return await GetDiscussionDTOByIdAsync(discussionId, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating discussion {DiscussionId} for user {UserId}", discussionId, userId);
                throw;
            }
        }

        public async Task<bool> DeleteDiscussionAsync(Guid userId, Guid discussionId)
        {
            try
            {
                var discussion = await _context.Discussions
                    .Include(d => d.Replies)
                    .FirstOrDefaultAsync(d => d.Id == discussionId);

                if (discussion == null)
                {
                    return false;
                }

                // Check if user is author or instructor/admin
                if (discussion.AuthorId != userId)
                {
                    var user = await _context.Users.FindAsync(userId);
                    if (user == null || user.Role == "STUDENT")
                    {
                        throw new UnauthorizedAccessException("Only discussion authors or instructors can delete discussions");
                    }
                }

                _context.Discussions.Remove(discussion);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Discussion deleted: {DiscussionId} by user {UserId}", discussionId, userId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting discussion {DiscussionId} for user {UserId}", discussionId, userId);
                throw;
            }
        }

        public async Task<DiscussionReplyDTO> CreateReplyAsync(Guid userId, Guid discussionId, CreateReplyRequest request)
        {
            try
            {
                var discussion = await _context.Discussions.FindAsync(discussionId);
                if (discussion == null)
                {
                    throw new ArgumentException("Discussion not found");
                }

                if (discussion.IsLocked)
                {
                    throw new InvalidOperationException("Discussion is locked for new replies");
                }

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    throw new ArgumentException("User not found");
                }

                var reply = new DiscussionReply
                {
                    Id = Guid.NewGuid(),
                    Content = request.Content.Trim(),
                    DiscussionId = discussionId,
                    AuthorId = userId,
                    ParentReplyId = request.ParentReplyId,
                    IsInstructorReply = user.Role != UserRole.Student,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.DiscussionReplies.Add(reply);

                // Update discussion stats
                discussion.ReplyCount++;
                discussion.LastReplyAt = DateTime.UtcNow;
                discussion.LastReplyById = userId;
                discussion.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Reply created: {ReplyId} for discussion {DiscussionId} by user {UserId}", 
                    reply.Id, discussionId, userId);

                return await GetReplyDTOByIdAsync(reply.Id, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating reply for discussion {DiscussionId} by user {UserId}", discussionId, userId);
                throw;
            }
        }

        public async Task<DiscussionReplyDTO> UpdateReplyAsync(Guid userId, Guid replyId, UpdateReplyRequest request)
        {
            try
            {
                var reply = await _context.DiscussionReplies
                    .FirstOrDefaultAsync(r => r.Id == replyId && r.AuthorId == userId);

                if (reply == null)
                {
                    throw new ArgumentException("Reply not found or access denied");
                }

                reply.Content = request.Content.Trim();
                reply.IsEdited = true;
                reply.EditedAt = DateTime.UtcNow;
                reply.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Reply updated: {ReplyId} by user {UserId}", replyId, userId);

                return await GetReplyDTOByIdAsync(replyId, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating reply {ReplyId} for user {UserId}", replyId, userId);
                throw;
            }
        }

        public async Task<bool> DeleteReplyAsync(Guid userId, Guid replyId)
        {
            try
            {
                var reply = await _context.DiscussionReplies
                    .Include(r => r.Discussion)
                    .Include(r => r.ChildReplies)
                    .FirstOrDefaultAsync(r => r.Id == replyId);

                if (reply == null)
                {
                    return false;
                }

                // Check if user is author or instructor/admin
                if (reply.AuthorId != userId)
                {
                    var user = await _context.Users.FindAsync(userId);
                    if (user == null || user.Role == "STUDENT")
                    {
                        throw new UnauthorizedAccessException("Only reply authors or instructors can delete replies");
                    }
                }

                // Update discussion reply count
                if (reply.Discussion != null)
                {
                    reply.Discussion.ReplyCount--;
                    reply.Discussion.UpdatedAt = DateTime.UtcNow;
                }

                _context.DiscussionReplies.Remove(reply);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Reply deleted: {ReplyId} by user {UserId}", replyId, userId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting reply {ReplyId} for user {UserId}", replyId, userId);
                throw;
            }
        }

        public async Task<bool> ToggleDiscussionLikeAsync(Guid userId, Guid discussionId)
        {
            try
            {
                var existingLike = await _context.DiscussionLikes
                    .FirstOrDefaultAsync(dl => dl.UserId == userId && dl.DiscussionId == discussionId);

                if (existingLike != null)
                {
                    // Remove like
                    _context.DiscussionLikes.Remove(existingLike);
                    await _context.Discussions
                        .Where(d => d.Id == discussionId)
                        .ExecuteUpdateAsync(d => d.SetProperty(p => p.LikeCount, p => p.LikeCount - 1));
                }
                else
                {
                    // Add like
                    _context.DiscussionLikes.Add(new DiscussionLike
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        DiscussionId = discussionId,
                        CreatedAt = DateTime.UtcNow
                    });
                    await _context.Discussions
                        .Where(d => d.Id == discussionId)
                        .ExecuteUpdateAsync(d => d.SetProperty(p => p.LikeCount, p => p.LikeCount + 1));
                }

                await _context.SaveChangesAsync();

                return existingLike == null; // Returns true if like was added
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling discussion like for user {UserId}, discussion {DiscussionId}", userId, discussionId);
                throw;
            }
        }

        public async Task<bool> ToggleReplyLikeAsync(Guid userId, Guid replyId)
        {
            try
            {
                var existingLike = await _context.ReplyLikes
                    .FirstOrDefaultAsync(rl => rl.UserId == userId && rl.ReplyId == replyId);

                if (existingLike != null)
                {
                    // Remove like
                    _context.ReplyLikes.Remove(existingLike);
                    await _context.DiscussionReplies
                        .Where(r => r.Id == replyId)
                        .ExecuteUpdateAsync(r => r.SetProperty(p => p.LikeCount, p => p.LikeCount - 1));
                }
                else
                {
                    // Add like
                    _context.ReplyLikes.Add(new ReplyLike
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        ReplyId = replyId,
                        CreatedAt = DateTime.UtcNow
                    });
                    await _context.DiscussionReplies
                        .Where(r => r.Id == replyId)
                        .ExecuteUpdateAsync(r => r.SetProperty(p => p.LikeCount, p => p.LikeCount + 1));
                }

                await _context.SaveChangesAsync();

                return existingLike == null; // Returns true if like was added
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling reply like for user {UserId}, reply {ReplyId}", userId, replyId);
                throw;
            }
        }

        public async Task<bool> MarkAsAcceptedAnswerAsync(Guid userId, Guid discussionId, Guid replyId)
        {
            try
            {
                var discussion = await _context.Discussions
                    .Include(d => d.Author)
                    .FirstOrDefaultAsync(d => d.Id == discussionId);

                if (discussion == null)
                {
                    throw new ArgumentException("Discussion not found");
                }

                // Only discussion author or instructor can accept answers
                if (discussion.AuthorId != userId)
                {
                    var user = await _context.Users.FindAsync(userId);
                    if (user == null || user.Role == "STUDENT")
                    {
                        throw new UnauthorizedAccessException("Only discussion authors or instructors can accept answers");
                    }
                }

                // Clear existing accepted answers
                await _context.DiscussionReplies
                    .Where(r => r.DiscussionId == discussionId)
                    .ExecuteUpdateAsync(r => r.SetProperty(p => p.IsAcceptedAnswer, false));

                // Mark new accepted answer
                await _context.DiscussionReplies
                    .Where(r => r.Id == replyId)
                    .ExecuteUpdateAsync(r => r.SetProperty(p => p.IsAcceptedAnswer, true));

                // Mark discussion as resolved
                discussion.IsResolved = true;
                discussion.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Reply {ReplyId} marked as accepted answer for discussion {DiscussionId} by user {UserId}", 
                    replyId, discussionId, userId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking reply as accepted answer for discussion {DiscussionId} by user {UserId}", discussionId, userId);
                throw;
            }
        }

        public async Task<DiscussionStats> GetDiscussionStatsAsync(Guid courseId)
        {
            try
            {
                var query = _context.Discussions.AsQueryable();
                
                if (courseId != Guid.Empty)
                {
                    query = query.Where(d => d.CourseId == courseId);
                }

                var discussions = await query.ToListAsync();

                return new DiscussionStats
                {
                    TotalDiscussions = discussions.Count,
                    TotalReplies = discussions.Sum(d => d.ReplyCount),
                    ResolvedQuestions = discussions.Count(d => d.Type == DiscussionType.Question && d.IsResolved),
                    PendingQuestions = discussions.Count(d => d.Type == DiscussionType.Question && !d.IsResolved),
                    UserParticipationCount = discussions.Select(d => d.AuthorId).Distinct().Count(),
                    TypeDistribution = discussions
                        .GroupBy(d => d.Type)
                        .ToDictionary(g => g.Key, g => g.Count())
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting discussion stats for course {CourseId}", courseId);
                throw;
            }
        }

        public async Task<List<DiscussionActivityDTO>> GetUserActivityAsync(Guid userId, int page = 1, int pageSize = 10)
        {
            try
            {
                var userDiscussions = await _context.Discussions
                    .Include(d => d.Course)
                    .Where(d => d.AuthorId == userId)
                    .OrderByDescending(d => d.CreatedAt)
                    .Select(d => new DiscussionActivityDTO
                    {
                        Id = d.Id,
                        Type = "discussion",
                        Title = d.Title,
                        Content = d.Content.Length > 100 ? d.Content.Substring(0, 100) + "..." : d.Content,
                        CourseId = d.CourseId,
                        CourseTitle = d.Course!.Title,
                        AuthorId = d.AuthorId,
                        AuthorName = d.Author!.FirstName + " " + d.Author.LastName,
                        AuthorAvatar = d.Author.ProfilePictureUrl ?? "",
                        CreatedAt = d.CreatedAt,
                        FormattedCreatedAt = d.CreatedAt.ToString("MMM dd, yyyy 'at' HH:mm"),
                        ActionUrl = $"/courses/{d.CourseId}/discussions/{d.Id}"
                    })
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var userReplies = await _context.DiscussionReplies
                    .Include(r => r.Discussion)
                    .ThenInclude(d => d.Course)
                    .Where(r => r.AuthorId == userId)
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new DiscussionActivityDTO
                    {
                        Id = r.Id,
                        Type = "reply",
                        Title = r.Discussion!.Title,
                        Content = r.Content.Length > 100 ? r.Content.Substring(0, 100) + "..." : r.Content,
                        CourseId = r.Discussion.CourseId,
                        CourseTitle = r.Discussion.Course!.Title,
                        AuthorId = r.AuthorId,
                        AuthorName = r.Author!.FirstName + " " + r.Author.LastName,
                        AuthorAvatar = r.Author.ProfilePictureUrl ?? "",
                        CreatedAt = r.CreatedAt,
                        FormattedCreatedAt = r.CreatedAt.ToString("MMM dd, yyyy 'at' HH:mm"),
                        ActionUrl = $"/courses/{r.Discussion.CourseId}/discussions/{r.Discussion.Id}#reply-{r.Id}"
                    })
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // Combine and sort by date
                var allActivity = userDiscussions.Concat(userReplies)
                    .OrderByDescending(a => a.CreatedAt)
                    .Take(pageSize)
                    .ToList();

                return allActivity;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user activity for user {UserId}", userId);
                throw;
            }
        }

        public async Task<NotificationPreferencesDTO> GetNotificationPreferencesAsync(Guid userId)
        {
            // This would be implemented based on user preferences stored in database
            // For now, return default preferences
            return new NotificationPreferencesDTO
            {
                NewDiscussionNotifications = true,
                ReplyNotifications = true,
                LikeNotifications = false,
                InstructorResponseNotifications = true,
                DailyDigest = false,
                WatchedCourses = new List<Guid>()
            };
        }

        public async Task UpdateNotificationPreferencesAsync(Guid userId, NotificationPreferencesDTO preferences)
        {
            // This would save preferences to database
            // For now, just log the update
            _logger.LogInformation("Notification preferences updated for user {UserId}", userId);
            await Task.CompletedTask;
        }

        private async Task<DiscussionDTO> GetDiscussionDTOByIdAsync(Guid discussionId, Guid userId)
        {
            var discussion = await _context.Discussions
                .Include(d => d.Author)
                .Include(d => d.Course)
                .FirstOrDefaultAsync(d => d.Id == discussionId);

            if (discussion == null)
            {
                throw new ArgumentException("Discussion not found");
            }

            return new DiscussionDTO
            {
                Id = discussion.Id,
                Title = discussion.Title,
                Content = discussion.Content,
                CourseId = discussion.CourseId,
                CourseTitle = discussion.Course!.Title,
                AuthorId = discussion.AuthorId,
                AuthorName = discussion.Author!.FirstName + " " + discussion.Author.LastName,
                AuthorAvatar = discussion.Author.ProfilePictureUrl ?? "",
                AuthorRole = discussion.Author.Role.ToString(),
                Type = discussion.Type,
                IsPinned = discussion.IsPinned,
                IsLocked = discussion.IsLocked,
                IsResolved = discussion.IsResolved,
                ViewCount = discussion.ViewCount,
                LikeCount = discussion.LikeCount,
                ReplyCount = discussion.ReplyCount,
                CreatedAt = discussion.CreatedAt,
                UpdatedAt = discussion.UpdatedAt,
                LastReplyAt = discussion.LastReplyAt,
                IsLikedByCurrentUser = _context.DiscussionLikes.Any(dl => dl.UserId == userId && dl.DiscussionId == discussionId),
                FormattedCreatedAt = discussion.CreatedAt.ToString("MMM dd, yyyy 'at' HH:mm"),
                FormattedUpdatedAt = discussion.UpdatedAt.ToString("MMM dd, yyyy 'at' HH:mm")
            };
        }

        private async Task<DiscussionReplyDTO> GetReplyDTOByIdAsync(Guid replyId, Guid userId)
        {
            var reply = await _context.DiscussionReplies
                .Include(r => r.Author)
                .Include(r => r.ParentReply)
                .ThenInclude(pr => pr.Author)
                .FirstOrDefaultAsync(r => r.Id == replyId);

            if (reply == null)
            {
                throw new ArgumentException("Reply not found");
            }

            return new DiscussionReplyDTO
            {
                Id = reply.Id,
                Content = reply.Content,
                DiscussionId = reply.DiscussionId,
                AuthorId = reply.AuthorId,
                AuthorName = reply.Author!.FirstName + " " + reply.Author.LastName,
                AuthorAvatar = reply.Author.ProfilePictureUrl ?? "",
                AuthorRole = reply.Author.Role.ToString(),
                ParentReplyId = reply.ParentReplyId,
                ParentReplyAuthorName = reply.ParentReply?.Author != null 
                    ? reply.ParentReply.Author.FirstName + " " + reply.ParentReply.Author.LastName 
                    : null,
                LikeCount = reply.LikeCount,
                IsEdited = reply.IsEdited,
                IsInstructorReply = reply.IsInstructorReply,
                IsAcceptedAnswer = reply.IsAcceptedAnswer,
                CreatedAt = reply.CreatedAt,
                UpdatedAt = reply.UpdatedAt,
                EditedAt = reply.EditedAt,
                IsLikedByCurrentUser = _context.ReplyLikes.Any(rl => rl.UserId == userId && rl.ReplyId == reply.Id),
                FormattedCreatedAt = reply.CreatedAt.ToString("MMM dd, yyyy 'at' HH:mm"),
                FormattedEditedAt = reply.EditedAt?.ToString("MMM dd, yyyy 'at' HH:mm") ?? ""
            };
        }
    }
}