package com.talentsphere.notification.service;

import com.talentsphere.notification.entity.Notification;
import com.talentsphere.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Notification createNotification(UUID userId, String title, String message,
            Notification.NotificationType type, Notification.NotificationChannel channel) {
        
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setChannel(channel);
        notification.setRead(false);
        notification.setSent(false);

        notification = notificationRepository.save(notification);

        sendRealTimeNotification(notification);

        return notification;
    }

    public void sendRealTimeNotification(Notification notification) {
        try {
            messagingTemplate.convertAndSendToUser(
                    notification.getUserId().toString(),
                    "/queue/notifications",
                    notification
            );
            notification.setSent(true);
            notification.setSentAt(LocalDateTime.now());
            notificationRepository.save(notification);
            log.info("Real-time notification sent to user: {}", notification.getUserId());
        } catch (Exception e) {
            log.error("Failed to send real-time notification: {}", e.getMessage());
        }
    }

    public Page<Notification> getNotificationsForUser(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserId(userId, pageable);
    }

    public Page<Notification> getUnreadNotifications(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserIdAndReadFalse(userId, pageable);
    }

    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public Notification markAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        Page<Notification> unreadNotifications = notificationRepository
                .findByUserIdAndReadFalse(userId, Pageable.unpaged());
        
        unreadNotifications.forEach(notification -> {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
        });
        
        notificationRepository.saveAll(unreadNotifications.getContent());
    }
}
