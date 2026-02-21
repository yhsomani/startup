package com.talentsphere.backend.listener;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentsphere.backend.config.RabbitMQConfig;
import com.talentsphere.backend.service.CertificateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Listener for course completion events published via RabbitMQ.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CourseCompletionListener {

    private final CertificateService certificateService;
    private final ObjectMapper objectMapper;

    /**
     * Consumes course completion events and triggers certificate generation.
     * 
     * @param message the event payload
     */
    @RabbitListener(queues = RabbitMQConfig.CERTIFICATE_QUEUE)
    public void onCourseCompleted(String message) {
        log.info("Received course completion event: {}", message);
        try {
            JsonNode payload = objectMapper.readTree(message);

            // Extract enrollmentId from data field or root
            String enrollmentId = null;
            if (payload.has("data") && payload.get("data").has("enrollmentId")) {
                enrollmentId = payload.get("data").get("enrollmentId").asText();
            } else if (payload.has("enrollmentId")) {
                enrollmentId = payload.get("enrollmentId").asText();
            }

            if (enrollmentId != null) {
                log.info("Triggering certificate generation for enrollment: {}", enrollmentId);
                certificateService.generateCertificate(enrollmentId);
            } else {
                log.warn("Payload missing enrollmentId: {}", message);
            }
        } catch (Exception e) {
            log.error("Failed to process course completion event", e);
        }
    }
}
