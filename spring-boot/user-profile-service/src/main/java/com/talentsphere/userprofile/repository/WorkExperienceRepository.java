package com.talentsphere.userprofile.repository;

import com.talentsphere.userprofile.entity.WorkExperience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkExperienceRepository extends JpaRepository<WorkExperience, UUID> {

    List<WorkExperience> findByProfileId(UUID profileId);

    void deleteByProfileIdAndId(UUID profileId, UUID id);
}
