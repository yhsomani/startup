package com.talentsphere.notification.repository;

import com.talentsphere.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    Page<Notification> findByUserId(UUID userId, Pageable pageable);
    Page<Notification> findByUserIdAndReadFalse(UUID userId, Pageable pageable);
    long countByUserIdAndReadFalse(UUID userId);
    List<Notification> findByUserIdAndReadFalseAndSentFalse(UUID userId);
}
