package com.talentsphere.backend.repository;

import com.talentsphere.backend.model.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SectionRepository extends JpaRepository<Section, UUID> {
    List<Section> findByCourseIdAndIsActiveTrueOrderByOrderIndex(UUID courseId);
}
