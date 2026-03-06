package com.talentsphere.notification.controller;

import com.talentsphere.notification.entity.Notification;
import com.talentsphere.notification.service.NotificationService;
import com.talentsphere.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<ApiResponse<Notification>> createNotification(
            @RequestBody Map<String, Object> request) {
        
        Notification notification = notificationService.createNotification(
                UUID.fromString((String) request.get("userId")),
                (String) request.get("title"),
                (String) request.get("message"),
                Notification.NotificationType.valueOf((String) request.get("type")),
                Notification.NotificationChannel.valueOf((String) request.get("channel"))
        );
        
        return ResponseEntity.ok(ApiResponse.success(notification));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Notification>>> getNotifications(
            @RequestHeader("X-User-Id") UUID userId,
            Pageable pageable) {
        Page<Notification> notifications = notificationService.getNotificationsForUser(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<Page<Notification>>> getUnreadNotifications(
            @RequestHeader("X-User-Id") UUID userId,
            Pageable pageable) {
        Page<Notification> notifications = notificationService.getUnreadNotifications(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @RequestHeader("X-User-Id") UUID userId) {
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<Notification>> markAsRead(
            @PathVariable UUID notificationId) {
        Notification notification = notificationService.markAsRead(notificationId);
        return ResponseEntity.ok(ApiResponse.success(notification));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @RequestHeader("X-User-Id") UUID userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("notification-service UP"));
    }

    @MessageMapping("/notifications")
    @SendTo("/queue/notifications")
    public Notification handleNotification(Notification notification) {
        return notification;
    }
}
