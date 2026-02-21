package com.talentsphere.backend.repository;

import com.talentsphere.backend.model.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {

    @Query("SELECT c FROM Course c WHERE c.isActive = true AND (:isPublished IS NULL OR c.isPublished = :isPublished) AND (:instructorId IS NULL OR c.instructor.id = :instructorId)")
    Page<Course> findCourses(@Param("isPublished") Boolean isPublished, @Param("instructorId") UUID instructorId,
            Pageable pageable);
}
