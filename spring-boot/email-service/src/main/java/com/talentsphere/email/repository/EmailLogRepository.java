package com.talentsphere.email.repository;

import com.talentsphere.email.entity.EmailLog;
import com.talentsphere.email.entity.EmailLog.EmailStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface EmailLogRepository extends JpaRepository<EmailLog, UUID> {

    Page<EmailLog> findByStatus(EmailStatus status, Pageable pageable);
}
