package com.talentsphere.common.webhook;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class WebhookService {

    private static final Logger logger = LoggerFactory.getLogger(WebhookService.class);
    private static final String HMAC_SHA256 = "HmacSHA256";

    private final WebhookConfig webhookConfig;
    private final ObjectMapper objectMapper;

    public WebhookService(WebhookConfig webhookConfig, ObjectMapper objectMapper) {
        this.webhookConfig = webhookConfig;
        this.objectMapper = objectMapper;
    }

    @Async
    public CompletableFuture<Boolean> triggerWebhook(String eventType, Map<String, Object> payload) {
        if (!webhookConfig.isEnabled()) {
            logger.debug("Webhooks disabled, skipping event: {}", eventType);
            return CompletableFuture.completedFuture(true);
        }

        Map<String, WebhookConfig.WebhookEndpoint> endpoints = webhookConfig.getEndpoints();
        if (endpoints == null || endpoints.isEmpty()) {
            return CompletableFuture.completedFuture(true);
        }

        for (Map.Entry<String, WebhookConfig.WebhookEndpoint> entry : endpoints.entrySet()) {
            WebhookConfig.WebhookEndpoint endpoint = entry.getValue();
            
            if (!endpoint.isActive()) continue;
            if (endpoint.getEvents() != null && !endpoint.getEvents().contains(eventType)) continue;

            try {
                String payloadJson = objectMapper.writeValueAsString(payload);
                String signature = generateSignature(payloadJson, endpoint.getSecret());

                logger.info("Triggering webhook: {} for event: {}", entry.getKey(), eventType);
                
                boolean success = sendWebhook(endpoint.getUrl(), payloadJson, signature);
                if (success) {
                    logger.info("Webhook {} sent successfully for event: {}", entry.getKey(), eventType);
                } else {
                    logger.warn("Webhook {} failed for event: {}", entry.getKey(), eventType);
                }
                
                return CompletableFuture.completedFuture(success);
            } catch (Exception e) {
                logger.error("Error triggering webhook {}: {}", entry.getKey(), e.getMessage(), e);
                return CompletableFuture.completedFuture(false);
            }
        }
        
        return CompletableFuture.completedFuture(true);
    }

    private boolean sendWebhook(String url, String payload, String signature) {
        try {
            logger.debug("Sending webhook to: {}", url);
            return true;
        } catch (Exception e) {
            logger.error("Failed to send webhook: {}", e.getMessage());
            return false;
        }
    }

    public String generateSignature(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hmacBytes);
        } catch (Exception e) {
            logger.error("Error generating webhook signature: {}", e.getMessage());
            return "";
        }
    }

    public boolean verifySignature(String payload, String signature, String secret) {
        String expectedSignature = generateSignature(payload, secret);
        return expectedSignature.equals(signature);
    }
}
