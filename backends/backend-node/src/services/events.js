const { logger } = require('../config/config');

const handleCourseCreated = (io, data) => {
    io.to('students').emit('notification', {
        type: 'course.created',
        title: 'New Course Available',
        message: `${data.courseTitle} is now available!`,
        data: data,
        timestamp: new Date().toISOString()
    });
};

const handleCourseUpdated = (io, data) => {
    io.to(`course:${data.courseId}`).emit('notification', {
        type: 'course.updated',
        title: 'Course Updated',
        message: `${data.courseTitle} has been updated`,
        data: data,
        timestamp: new Date().toISOString()
    });
};

const handleCoursePublished = (io, data) => {
    io.to('students').emit('notification', {
        type: 'course.published',
        title: 'Course Published',
        message: `${data.courseTitle} is now live!`,
        data: data,
        timestamp: new Date().toISOString()
    });
};

const handleEnrollmentCreated = (io, data) => {
    io.to(`user:${data.userId}`).emit('notification', {
        type: 'enrollment.created',
        title: 'Enrollment Successful',
        message: `You've enrolled in ${data.courseTitle}`,
        data: data,
        timestamp: new Date().toISOString()
    });
};

const handleProgressUpdated = (io, data) => {
    io.to(`user:${data.userId}`).emit('progress:updated', {
        courseId: data.courseId,
        progressPercentage: data.progressPercentage,
        completedLessons: data.completedLessons,
        totalLessons: data.totalLessons,
        timestamp: new Date().toISOString()
    });
};

const handleLessonCompleted = (io, data) => {
    io.to(`user:${data.userId}`).emit('notification', {
        type: 'lesson.completed',
        title: 'Lesson Completed!',
        message: `Great job completing "${data.lessonTitle}"`,
        data: data,
        timestamp: new Date().toISOString()
    });

    // Also update progress in real-time
    io.to(`user:${data.userId}`).emit('progress:updated', {
        courseId: data.courseId,
        progressPercentage: data.newProgressPercentage,
        timestamp: new Date().toISOString()
    });
};

const handleChallengeSubmitted = (io, data) => {
    // Notify the instructor
    io.to(`user:${data.instructorId}`).emit('notification', {
        type: 'challenge.submitted',
        title: 'New Challenge Submission',
        message: `${data.userName} submitted a solution`,
        data: data,
        timestamp: new Date().toISOString()
    });

    // Confirm to student
    io.to(`user:${data.userId}`).emit('notification', {
        type: 'challenge.submitted.confirm',
        title: 'Submission Received',
        message: 'Your challenge submission is being graded',
        data: data,
        timestamp: new Date().toISOString()
    });
};

const handleChallengeGraded = (io, data) => {
    io.to(`user:${data.userId}`).emit('notification', {
        type: 'challenge.graded',
        title: 'Challenge Graded',
        message: `Your submission scored ${data.score}%`,
        data: data,
        timestamp: new Date().toISOString(),
        priority: 'high'
    });

    // Update leaderboard in real-time
    io.to(`challenge:${data.challengeId}`).emit('leaderboard:updated', {
        challengeId: data.challengeId,
        timestamp: new Date().toISOString()
    });
};

const handleCertificateIssued = (io, data) => {
    io.to(`user:${data.userId}`).emit('notification', {
        type: 'certificate.issued',
        title: '🎉 Certificate Earned!',
        message: `Congratulations! You've earned a certificate for ${data.courseTitle}`,
        data: data,
        timestamp: new Date().toISOString(),
        priority: 'high'
    });
};

const dispatchEvent = (io, event) => {
    switch (event.eventType) {
        case 'course.created': handleCourseCreated(io, event.data); break;
        case 'course.updated': handleCourseUpdated(io, event.data); break;
        case 'course.published': handleCoursePublished(io, event.data); break;
        case 'enrollment.created': handleEnrollmentCreated(io, event.data); break;
        case 'progress.updated': handleProgressUpdated(io, event.data); break;
        case 'lesson.completed': handleLessonCompleted(io, event.data); break;
        case 'challenge.submitted': handleChallengeSubmitted(io, event.data); break;
        case 'challenge.graded': handleChallengeGraded(io, event.data); break;
        case 'certificate.issued': handleCertificateIssued(io, event.data); break;
        default: logger.warn(`Unhandled event type: ${event.eventType}`);
    }
};

module.exports = { dispatchEvent };
