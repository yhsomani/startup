using Microsoft.EntityFrameworkCore;
using TalentSphere.API.Data;
using TalentSphere.API.DTOs;
using TalentSphere.API.Models;

namespace TalentSphere.API.Services
{
    public class CourseService
    {
        private readonly ApplicationDbContext _context;
        private readonly RabbitMQPublisherService _eventPublisher;

        public CourseService(ApplicationDbContext context, RabbitMQPublisherService eventPublisher)
        {
            _context = context;
            _eventPublisher = eventPublisher;
        }

        public async Task<CourseListResponse> ListCoursesAsync(int page, int limit, Guid? instructorId, bool? isPublished)
        {
            if (page < 1) page = 1;
            if (limit > 100) limit = 100;

            var query = _context.Courses
                .Include(c => c.Instructor)
                .Where(c => c.IsActive);

            if (isPublished.HasValue)
            {
                query = query.Where(c => c.IsPublished == isPublished);
            }

            if (instructorId.HasValue)
            {
                query = query.Where(c => c.InstructorId == instructorId);
            }

            var total = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(total / (double)limit);

            var courses = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(c => new CourseDTO
                {
                    Id = c.Id,
                    InstructorId = c.InstructorId,
                    InstructorName = c.Instructor != null ? c.Instructor.Email : "Unknown", // Simplified
                    Title = c.Title,
                    Subtitle = c.Subtitle,
                    Description = c.Description,
                    Price = c.Price,
                    Currency = c.Currency,
                    ThumbnailUrl = c.ThumbnailUrl,
                    PreviewVideoUrl = c.PreviewVideoUrl,
                    IsPublished = c.IsPublished,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .ToListAsync();

            return new CourseListResponse
            {
                Data = courses,
                Pagination = new PaginationMetadata
                {
                    Page = page,
                    Limit = limit,
                    Total = total,
                    TotalPages = totalPages,
                    HasNextPage = page < totalPages,
                    HasPreviousPage = page > 1
                }
            };
        }

        public virtual async Task<CourseDTO> GetCourseDetailsAsync(Guid courseId)
        {
            var course = await _context.Courses
                .Include(c => c.Instructor)
                .Include(c => c.Sections)
                .ThenInclude(s => s.Lessons)
                .Include(c => c.Skills)
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null) throw new Exception("Course not found");

            // Map manually
            var dto = new CourseDTO
            {
                Id = course.Id,
                InstructorId = course.InstructorId,
                InstructorName = course.Instructor?.Email ?? "",
                Title = course.Title,
                Subtitle = course.Subtitle,
                Description = course.Description,
                Price = course.Price,
                Currency = course.Currency,
                ThumbnailUrl = course.ThumbnailUrl,
                PreviewVideoUrl = course.PreviewVideoUrl,
                IsPublished = course.IsPublished,
                CreatedAt = course.CreatedAt,
                UpdatedAt = course.UpdatedAt,
                Sections = course.Sections
                    .Where(s => s.IsActive)
                    .OrderBy(s => s.OrderIndex)
                    .Select(s => new SectionDTO
                    {
                        Id = s.Id,
                        Title = s.Title,
                        OrderIndex = s.OrderIndex,
                        Lessons = s.Lessons
                            .Where(l => l.IsActive)
                            .OrderBy(l => l.OrderIndex)
                            .Select(l => new LessonDTO
                            {
                                Id = l.Id,
                                Type = l.Type,
                                Title = l.Title,
                                Description = l.Description,
                                OrderIndex = l.OrderIndex,
                                VideoUrl = l.VideoUrl,
                                Duration = l.Duration,
                                ChallengeId = l.ChallengeId
                            }).ToList()
                    }).ToList(),
                Skills = course.Skills.Select(s => new SkillDTO
                {
                    Id = s.Id,
                    SkillName = s.SkillName
                }).ToList()
            };

            return dto;
        }

        public async Task<CourseDTO> CreateCourseAsync(Guid instructorId, CreateCourseRequest request)
        {
            var user = await _context.Users.FindAsync(instructorId);
            if (user == null) throw new Exception("Instructor not found");
            // Basic role check if needed, though Auth guard does it

            var course = new Course
            {
                Id = Guid.NewGuid(),
                InstructorId = instructorId,
                Title = request.Title,
                Subtitle = request.Subtitle,
                Description = request.Description,
                Price = request.Price,
                Currency = request.Currency ?? "USD",
                IsPublished = false, // Draft by default
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            // Publish course.created event
            _eventPublisher.PublishEvent("course.created", new
            {
                eventId = Guid.NewGuid(),
                eventType = "course.created",
                eventVersion = "v1",
                timestamp = DateTime.UtcNow,
                source = "course-service",
                data = new
                {
                    courseId = course.Id,
                    instructorId = course.InstructorId,
                    title = course.Title,
                    price = course.Price,
                    currency = course.Currency,
                    createdAt = course.CreatedAt
                }
            });

            return await GetCourseDetailsAsync(course.Id);
        }


        public async Task<SectionDTO> CreateSectionAsync(Guid courseId, string title, int orderIndex)
        {
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) throw new Exception("Course not found");

            var section = new Section
            {
                Id = Guid.NewGuid(),
                CourseId = courseId,
                Title = title,
                OrderIndex = orderIndex,
                IsActive = true
            };

            _context.Sections.Add(section);
            await _context.SaveChangesAsync();

            return new SectionDTO
            {
                Id = section.Id,
                Title = section.Title,
                OrderIndex = section.OrderIndex,
                Lessons = new List<LessonDTO>()
            };
        }

        public async Task<LessonDTO> CreateLessonAsync(Guid sectionId, string title, string type, int orderIndex, string? videoUrl = null, int? duration = null, string? contentMarkdown = null)
        {
            var section = await _context.Sections.FindAsync(sectionId);
            if (section == null) throw new Exception("Section not found");

            var lesson = new Lesson
            {
                Id = Guid.NewGuid(),
                SectionId = sectionId,
                Title = title,
                Type = type,
                OrderIndex = orderIndex,
                VideoUrl = videoUrl,
                Duration = duration,
                ContentMarkdown = contentMarkdown, // Make sure Lesson model has this field?
                IsActive = true
            };

            // Wait, does Lesson Model have 'ContentMarkdown'? Check API Contract vs Model.
            // API Contract 2.6.3 says 'contentMarkdown'.
            // Let's verify Lesson Model first.
            
             _context.Lessons.Add(lesson);
            await _context.SaveChangesAsync();

            return new LessonDTO
            {
                Id = lesson.Id,
                Title = lesson.Title,
                Type = lesson.Type,
                OrderIndex = lesson.OrderIndex,
                VideoUrl = lesson.VideoUrl,
                Duration = lesson.Duration
                // Description? 
            };
        }

        public virtual async Task UpdateCourseAsync(Guid courseId, UpdateCourseRequest request)
        {
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) throw new KeyNotFoundException("Course not found");

            course.Title = request.Title ?? course.Title;
            course.Subtitle = request.Subtitle ?? course.Subtitle;
            course.Description = request.Description ?? course.Description;
            course.Price = request.Price ?? course.Price;
            course.Currency = request.Currency ?? course.Currency;
            course.ThumbnailUrl = request.ThumbnailUrl ?? course.ThumbnailUrl;
            course.PreviewVideoUrl = request.PreviewVideoUrl ?? course.PreviewVideoUrl;
            course.IsPublished = request.IsPublished ?? course.IsPublished;
            course.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public virtual async Task DeleteCourseAsync(Guid courseId)
        {
            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) throw new KeyNotFoundException("Course not found");

            // Soft delete or hard delete? Let's do soft delete for safety if IsActive exists, else hard.
            // Model has IsActive.
            course.IsActive = false;
            course.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
        }

        public async Task UpdateLessonAsync(Guid lessonId, string title, string? videoUrl, int? duration, string? contentMarkdown)
        {
            var lesson = await _context.Lessons.FindAsync(lessonId);
            if (lesson == null) throw new KeyNotFoundException("Lesson not found");

            lesson.Title = title;
            lesson.VideoUrl = videoUrl;
            lesson.Duration = duration;
            lesson.ContentMarkdown = contentMarkdown;
            
            await _context.SaveChangesAsync();
        }

        public async Task DeleteLessonAsync(Guid lessonId)
        {
            var lesson = await _context.Lessons.FindAsync(lessonId);
            if (lesson == null) throw new KeyNotFoundException("Lesson not found");

            lesson.IsActive = false;
            await _context.SaveChangesAsync();
        }
        public async Task UpdateSectionAsync(Guid sectionId, string title, int orderIndex)
        {
            var section = await _context.Sections.FindAsync(sectionId);
            if (section == null) throw new KeyNotFoundException("Section not found");

            section.Title = title;
            section.OrderIndex = orderIndex;
            
            await _context.SaveChangesAsync();
        }

        public async Task DeleteSectionAsync(Guid sectionId)
        {
            var section = await _context.Sections.FindAsync(sectionId);
            if (section == null) throw new KeyNotFoundException("Section not found");

            section.IsActive = false;
            await _context.SaveChangesAsync();
        }

        public async Task<LessonDTO?> GetLessonByIdAsync(Guid lessonId)
        {
            var lesson = await _context.Lessons
                .Include(l => l.Section)
                .FirstOrDefaultAsync(l => l.Id == lessonId && l.IsActive);

            if (lesson == null) return null;

            return new LessonDTO
            {
                Id = lesson.Id,
                Type = lesson.Type,
                Title = lesson.Title,
                Description = lesson.Description,
                OrderIndex = lesson.OrderIndex,
                VideoUrl = lesson.VideoUrl,
                Duration = lesson.Duration,
                ChallengeId = lesson.ChallengeId
            };
        }
    }
}
