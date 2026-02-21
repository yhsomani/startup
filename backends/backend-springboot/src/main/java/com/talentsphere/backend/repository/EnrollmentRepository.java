package com.talentsphere.backend.repository;

import com.talentsphere.backend.model.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {
    Optional<Enrollment> findByUserIdAndCourseId(UUID userId, UUID courseId);

    List<Enrollment> findByUserId(UUID userId);

    boolean existsByUserIdAndCourseId(UUID userId, UUID courseId);

    @org.springframework.data.jpa.repository.Query("SELECT e FROM Enrollment e JOIN e.course c WHERE LOWER(c.title) LIKE LOWER(CONCAT('%', :skill, '%')) AND e.progressPercentage >= :minPercentile")
    List<Enrollment> searchBySkillAndProgress(String skill, int minPercentile);
}
