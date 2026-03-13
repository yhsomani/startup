package com.talentsphere.application.repository;

import com.talentsphere.application.entity.ApplicationTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ApplicationTimelineRepository extends JpaRepository<ApplicationTimeline, UUID> {

    List<ApplicationTimeline> findByApplicationIdOrderByChangedAtDesc(UUID applicationId);
}
