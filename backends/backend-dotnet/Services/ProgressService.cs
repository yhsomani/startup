using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using TalentSphere.API.Data;
using TalentSphere.API.DTOs;
using TalentSphere.API.Models;

namespace TalentSphere.API.Services
{
    public class ProgressService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IEventPublisher _eventPublisher;

        public ProgressService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor, IEventPublisher eventPublisher)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _eventPublisher = eventPublisher;
        }

        private Guid GetCurrentUserId()
        {
            var idClaim = _httpContextAccessor.HttpContext?.User.FindFirst("id");
            if (idClaim == null) throw new UnauthorizedAccessException("User not authenticated");
            return Guid.Parse(idClaim.Value);
        }

        public async Task<object> CreateEnrollmentAsync(Guid courseId)
        {
            var userId = GetCurrentUserId();
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) throw new Exception("Course not found");
            if (!course.IsPublished) throw new Exception("Cannot enroll in unpublished course");

            if (await _context.Enrollments.AnyAsync(e => e.UserId == userId && e.CourseId == courseId))
            {
                throw new Exception("User already enrolled");
            }

            var enrollment = new Enrollment
            {
                UserId = userId,
                CourseId = courseId,
                EnrolledAt = DateTime.UtcNow
            };

            _context.Enrollments.Add(enrollment);
            await _context.SaveChangesAsync();

            _eventPublisher.PublishEvent("enrollment.created", new 
            { 
                UserId = userId, 
                CourseId = courseId, 
                EnrollmentId = enrollment.Id, 
                Timestamp = DateTime.UtcNow 
            });

            return new
            {
                Id = enrollment.Id,
                UserId = enrollment.UserId,
                CourseId = enrollment.CourseId,
                CourseTitle = course.Title,
                ProgressPercentage = 0,
                Status = "in_progress"
            };
        }

        public async Task<object> MarkLessonCompleteAsync(Guid enrollmentId, Guid lessonId)
        {
            var userId = GetCurrentUserId();
            var enrollment = await _context.Enrollments
                .Include(e => e.Course)
                .ThenInclude(c => c.Sections)
                .FirstOrDefaultAsync(e => e.Id == enrollmentId);

            if (enrollment == null) throw new Exception("Enrollment not found");
            if (enrollment.UserId != userId) throw new UnauthorizedAccessException("Forbidden");

            var lesson = await _context.Lessons.Include(l => l.Section).FirstOrDefaultAsync(l => l.Id == lessonId);
            if (lesson == null) throw new Exception("Lesson not found");
            if (lesson.Section == null) throw new Exception("Lesson has no section");

            if (lesson.Section.CourseId != enrollment.CourseId)
                throw new Exception("Lesson does not belong to this course");

            var progress = await _context.LessonProgresses
                .FirstOrDefaultAsync(lp => lp.EnrollmentId == enrollmentId && lp.LessonId == lessonId);

            if (progress == null)
            {
                progress = new LessonProgress
                {
                    EnrollmentId = enrollmentId,
                    LessonId = lessonId,
                };
                _context.LessonProgresses.Add(progress);
            }

            if (!progress.IsCompleted)
            {
                progress.IsCompleted = true;
                progress.CompletedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                await UpdateEnrollmentProgress(enrollment);
            }

            return new
            {
                LessonProgress = new { LessonId = lessonId, IsCompleted = true, CompletedAt = progress.CompletedAt },
                EnrollmentProgress = new { EnrollmentId = enrollmentId, ProgressPercentage = enrollment.ProgressPercentage, CompletedAt = enrollment.CompletedAt }
            };
        }

        private async Task UpdateEnrollmentProgress(Enrollment enrollment)
        {
            // Total lessons in course
            // Need to reload course with all lessons to count? Or use count query
            var totalLessons = await _context.Lessons
                .Where(l => l.Section.CourseId == enrollment.CourseId && l.IsActive)
                .CountAsync();

            var completedLessons = await _context.LessonProgresses
                .Where(lp => lp.EnrollmentId == enrollment.Id && lp.IsCompleted)
                .CountAsync();

            if (totalLessons > 0)
            {
                enrollment.ProgressPercentage = (int)((double)completedLessons / totalLessons * 100);
                if (enrollment.ProgressPercentage == 100 && enrollment.CompletedAt == null)
                {
                    enrollment.CompletedAt = DateTime.UtcNow;
                    _eventPublisher.PublishEvent("course.completed", new 
                    { 
                        UserId = enrollment.UserId, 
                        CourseId = enrollment.CourseId, 
                        EnrollmentId = enrollment.Id, 
                        Timestamp = DateTime.UtcNow 
                    });
                }
                await _context.SaveChangesAsync();
            }
        }

        public async Task<object> GetProgressDetailsAsync(Guid enrollmentId)
        {
            var userId = GetCurrentUserId();
            var enrollment = await _context.Enrollments
                .Include(e => e.Course)
                .FirstOrDefaultAsync(e => e.Id == enrollmentId);

            if (enrollment == null) throw new Exception("Enrollment not found");
            if (enrollment.UserId != userId) throw new UnauthorizedAccessException("Forbidden");

            var lessons = await _context.Lessons
                .Include(l => l.Section)
                .Where(l => l.Section.CourseId == enrollment.CourseId && l.IsActive)
                .OrderBy(l => l.Section.OrderIndex)
                .ThenBy(l => l.OrderIndex)
                .ToListAsync();

            var progresses = await _context.LessonProgresses
                .Where(lp => lp.EnrollmentId == enrollmentId)
                .ToDictionaryAsync(lp => lp.LessonId);

            var lessonList = lessons.Select(l =>
            {
                var lp = progresses.ContainsKey(l.Id) ? progresses[l.Id] : null;
                return new
                {
                    LessonId = l.Id,
                    LessonTitle = l.Title,
                    SectionTitle = l.Section.Title,
                    Type = l.Type,
                    IsCompleted = lp?.IsCompleted ?? false,
                    CompletedAt = lp?.CompletedAt,
                    VideoPosition = lp?.VideoPositionSeconds ?? 0
                };
            }).ToList();

            return new
            {
                EnrollmentId = enrollment.Id,
                CourseId = enrollment.CourseId,
                CourseTitle = enrollment.Course.Title,
                ProgressPercentage = enrollment.ProgressPercentage,
                CompletedAt = enrollment.CompletedAt,
                Lessons = lessonList
            };
        }
    }
}
