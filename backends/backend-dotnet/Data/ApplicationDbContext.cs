using Microsoft.EntityFrameworkCore;
using TalentSphere.API.Models;

namespace TalentSphere.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Section> Sections { get; set; }
        public DbSet<Lesson> Lessons { get; set; }
        public DbSet<CourseSkill> CourseSkills { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }
        public DbSet<LessonProgress> LessonProgresses { get; set; }
public DbSet<Challenge> Challenges { get; set; }
        public DbSet<Submission> Submissions { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Subscription> Subscriptions { get; set; }
        public DbSet<Discussion> Discussions { get; set; }
        public DbSet<DiscussionReply> DiscussionReplies { get; set; }
        public DbSet<DiscussionLike> DiscussionLikes { get; set; }
        public DbSet<ReplyLike> ReplyLikes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Enrollment>()
                .HasIndex(e => new { e.UserId, e.CourseId })
                .IsUnique();

modelBuilder.Entity<LessonProgress>()
                .HasIndex(lp => new { lp.EnrollmentId, lp.LessonId })
                .IsUnique();

            modelBuilder.Entity<Review>()
                .HasIndex(r => new { r.CourseId, r.UserId })
                .IsUnique();

            modelBuilder.Entity<Discussion>()
                .HasIndex(d => d.CourseId);

            modelBuilder.Entity<Discussion>()
                .HasIndex(d => d.AuthorId);

            modelBuilder.Entity<Discussion>()
                .HasIndex(d => new { d.CourseId, d.CreatedAt });

            modelBuilder.Entity<DiscussionReply>()
                .HasIndex(dr => dr.DiscussionId);

            modelBuilder.Entity<DiscussionReply>()
                .HasIndex(dr => dr.AuthorId);

            modelBuilder.Entity<DiscussionReply>()
                .HasIndex(dr => new { dr.DiscussionId, dr.CreatedAt });

            modelBuilder.Entity<DiscussionLike>()
                .HasIndex(dl => new { dl.UserId, dl.DiscussionId })
                .IsUnique();

            modelBuilder.Entity<ReplyLike>()
                .HasIndex(rl => new { rl.UserId, rl.ReplyId })
                .IsUnique();
        }
    }
}
