package com.talentsphere.backend.repository;

import com.talentsphere.backend.model.OutboxEvent;
import com.talentsphere.backend.model.OutboxEvent.OutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OutboxRepository extends JpaRepository<OutboxEvent, Long> {

    List<OutboxEvent> findByStatusOrderByCreatedAtAsc(OutboxStatus status);

    List<OutboxEvent> findByStatusAndRetryCountLessThanOrderByCreatedAtAsc(
        OutboxStatus status, 
        int maxRetries
    );

    @Modifying
    @Query("UPDATE OutboxEvent e SET e.status = :status, e.processedAt = :processedAt WHERE e.id = :id")
    void updateStatus(Long id, OutboxStatus status, LocalDateTime processedAt);

    @Modifying
    @Query("UPDATE OutboxEvent e SET e.retryCount = e.retryCount + 1, e.lastError = :error WHERE e.id = :id")
    void incrementRetryCount(Long id, String error);

    long countByStatus(OutboxStatus status);
}
