package com.talentsphere.userprofile.repository;

import com.talentsphere.userprofile.entity.UserProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {

    Optional<UserProfile> findByUserId(UUID userId);

    @Query("SELECT p FROM UserProfile p WHERE LOWER(p.headline) LIKE LOWER(CONCAT('%', :skill, '%')) OR LOWER(p.summary) LIKE LOWER(CONCAT('%', :skill, '%')) OR :skill MEMBER OF p.skills")
    Page<UserProfile> findBySkillsContaining(@Param("skill") String skill, Pageable pageable);

    @Query("SELECT p FROM UserProfile p WHERE " +
           "(:skill IS NULL OR LOWER(p.headline) LIKE LOWER(CONCAT('%', :skill, '%')) OR LOWER(p.summary) LIKE LOWER(CONCAT('%', :skill, '%')) OR :skill MEMBER OF p.skills)")
    Page<UserProfile> searchProfiles(@Param("skill") String skill, Pageable pageable);
}
