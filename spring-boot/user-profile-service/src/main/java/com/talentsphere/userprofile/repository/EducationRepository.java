package com.talentsphere.userprofile.repository;

import com.talentsphere.userprofile.entity.Education;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EducationRepository extends JpaRepository<Education, UUID> {

    List<Education> findByProfileId(UUID profileId);

    void deleteByProfileIdAndId(UUID profileId, UUID id);
}
