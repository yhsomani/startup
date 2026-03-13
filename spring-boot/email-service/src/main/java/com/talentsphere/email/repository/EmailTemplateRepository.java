package com.talentsphere.email.repository;

import com.talentsphere.email.entity.EmailTemplate;
import com.talentsphere.email.entity.EmailTemplate.EventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, UUID> {

    Optional<EmailTemplate> findByEventTypeAndIsActiveTrue(EventType eventType);

    Optional<EmailTemplate> findByTemplateName(String templateName);

    boolean existsByTemplateName(String templateName);
}
