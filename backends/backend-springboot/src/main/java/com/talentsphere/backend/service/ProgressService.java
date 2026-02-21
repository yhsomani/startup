package com.talentsphere.backend.service;

import com.talentsphere.backend.model.*;
import com.talentsphere.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProgressService {

    @Autowired
    private EnrollmentRepository enrollmentRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private LessonRepository lessonRepository;
    @Autowired
    private LessonProgressRepository lessonProgressRepository;
    @Autowired
    private SectionRepository sectionRepository;
    @Autowired
    private EventPublisher eventPublisher;

    @Transactional
    public Map<String, Object> createEnrollment(UUID courseId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        Course course = courseRepository.findById(Objects.requireNonNull(courseId))
                .orElseThrow(() -> new RuntimeException("Course not found"));

        if (!course.isPublished()) {
            throw new RuntimeException("Cannot enroll in unpublished course");
        }

        if (enrollmentRepository.existsByUserIdAndCourseId(user.getId(), courseId)) {
            throw new RuntimeException("User already enrolled");
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setUser(user);
        enrollment.setCourse(course);
        enrollment.setEnrolledAt(LocalDateTime.now());
        enrollment = enrollmentRepository.save(enrollment);

        // Publish event enrollment.created
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("userId", user.getId());
        eventData.put("courseId", course.getId());
        eventData.put("enrollmentId", enrollment.getId());
        eventData.put("timestamp", LocalDateTime.now());
        eventPublisher.publishEvent("enrollment.created", eventData);

        return mapToEnrollmentResponse(enrollment);
    }

    @Transactional
    public Map<String, Object> markLessonComplete(UUID enrollmentId, UUID lessonId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        Enrollment enrollment = enrollmentRepository.findById(Objects.requireNonNull(enrollmentId))
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        if (!enrollment.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Forbidden");
        }

        Lesson lesson = lessonRepository.findById(Objects.requireNonNull(lessonId))
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        // Verify lesson belongs to course
        if (!lesson.getSection().getCourse().getId().equals(enrollment.getCourse().getId())) {
            throw new RuntimeException("Lesson does not belong to this course");
        }

        LessonProgress progress = lessonProgressRepository.findByEnrollmentIdAndLessonId(enrollmentId, lessonId)
                .orElse(new LessonProgress());

        if (progress.getId() == null) {
            progress.setEnrollment(enrollment);
            progress.setLesson(lesson);
        }

        if (!progress.isCompleted()) {
            progress.setCompleted(true);
            progress.setCompletedAt(LocalDateTime.now());
            lessonProgressRepository.save(progress);

            // Recalculate progress
            updateEnrollmentProgress(enrollment);

            // Publish progress.updated event
            Map<String, Object> progressEvent = new HashMap<>();
            progressEvent.put("userId", user.getId());
            progressEvent.put("courseId", enrollment.getCourse().getId());
            progressEvent.put("enrollmentId", enrollmentId);
            progressEvent.put("lessonId", lessonId);
            progressEvent.put("progressPercentage", enrollment.getProgressPercentage());
            progressEvent.put("timestamp", LocalDateTime.now());
            eventPublisher.publishEvent("progress.updated", progressEvent);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("lessonProgress", Map.of(
                "lessonId", lessonId,
                "isCompleted", true,
                "completedAt", progress.getCompletedAt()));

        // Add enrollment progress
        response.put("enrollmentProgress", Map.of(
                "enrollmentId", enrollmentId,
                "progressPercentage", enrollment.getProgressPercentage(),
                "completedAt", enrollment.getCompletedAt() != null ? enrollment.getCompletedAt() : "null"));

        return response;
    }

    @Transactional
    public Map<String, Object> getProgressDetails(UUID enrollmentId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        Enrollment enrollment = enrollmentRepository.findById(Objects.requireNonNull(enrollmentId))
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        if (!enrollment.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Forbidden");
        }

        // Fetch all sections and lessons
        List<Section> sections = sectionRepository
                .findByCourseIdAndIsActiveTrueOrderByOrderIndex(enrollment.getCourse().getId());
        List<LessonProgress> progresses = lessonProgressRepository.findByEnrollmentId(enrollmentId);
        Map<UUID, LessonProgress> progressMap = progresses.stream()
                .collect(Collectors.toMap(lp -> lp.getLesson().getId(), lp -> lp));

        List<Map<String, Object>> lessonList = sections.stream()
                .flatMap(s -> s.getLessons().stream())
                .map(l -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("lessonId", l.getId());
                    map.put("lessonTitle", l.getTitle());
                    map.put("sectionTitle", l.getSection().getTitle());
                    map.put("type", l.getType().name());

                    LessonProgress lp = progressMap.get(l.getId());
                    map.put("isCompleted", lp != null && lp.isCompleted());
                    map.put("completedAt", lp != null ? lp.getCompletedAt() : null);
                    map.put("videoPosition", lp != null ? lp.getVideoPositionSeconds() : 0);

                    return map;
                })
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("enrollmentId", enrollment.getId());
        response.put("courseId", enrollment.getCourse().getId());
        response.put("courseTitle", enrollment.getCourse().getTitle());
        response.put("progressPercentage", enrollment.getProgressPercentage());
        response.put("completedAt", enrollment.getCompletedAt());
        response.put("lessons", lessonList);

        return response;
    }

    private void updateEnrollmentProgress(Enrollment enrollment) {
        // Count total lessons
        long totalLessons = enrollment.getCourse().getSections().stream()
                .mapToLong(s -> s.getLessons().size())
                .sum();

        // Count completed lessons
        long completedLessons = lessonProgressRepository.countCompletedLessons(enrollment.getId());

        if (totalLessons > 0) {
            int percentage = (int) ((completedLessons * 100) / totalLessons);
            enrollment.setProgressPercentage(percentage);

            if (percentage == 100 && enrollment.getCompletedAt() == null) {
                enrollment.setCompletedAt(LocalDateTime.now());
                enrollment.setCompletedAt(LocalDateTime.now());

                // Publish course.completed
                Map<String, Object> eventData = new HashMap<>();
                eventData.put("userId", enrollment.getUser().getId());
                eventData.put("courseId", enrollment.getCourse().getId());
                eventData.put("enrollmentId", enrollment.getId());
                eventData.put("timestamp", LocalDateTime.now());
                eventPublisher.publishEvent("course.completed", eventData);
            }
            enrollmentRepository.save(enrollment);
        }
    }

    private Map<String, Object> mapToEnrollmentResponse(Enrollment enrollment) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", enrollment.getId());
        map.put("userId", enrollment.getUser().getId());
        map.put("courseId", enrollment.getCourse().getId());
        map.put("courseTitle", enrollment.getCourse().getTitle());
        map.put("progressPercentage", enrollment.getProgressPercentage());
        map.put("enrolledAt", enrollment.getEnrolledAt());
        map.put("status", enrollment.getCompletedAt() != null ? "completed" : "in_progress");
        return map;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserEnrollments(UUID userId) {
        List<Enrollment> enrollments = enrollmentRepository.findByUserId(userId);
        return enrollments.stream()
                .map(this::mapToEnrollmentResponse)
                .collect(Collectors.toList());
    }
}
