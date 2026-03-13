package com.talentsphere.common.idempotency;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.UUID;

@Component
public class IdempotencyService {

    private static final Logger logger = LoggerFactory.getLogger(IdempotencyService.class);
    private static final Duration DEFAULT_TTL = Duration.ofHours(24);
    
    private final RedisTemplate<String, Object> redisTemplate;

    public IdempotencyService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public String generateKey(String userId, String endpoint, Object request) {
        String hash = String.valueOf(request.hashCode());
        return String.format("idempotency:%s:%s:%s", userId, endpoint, hash);
    }

    public boolean isDuplicate(String idempotencyKey) {
        try {
            Boolean exists = redisTemplate.hasKey(idempotencyKey);
            return Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            logger.error("Error checking idempotency key: {}", e.getMessage());
            return false;
        }
    }

    public void markAsProcessed(String idempotencyKey, Object result) {
        try {
            redisTemplate.opsForValue().set(idempotencyKey, result, DEFAULT_TTL);
            logger.debug("Marked idempotency key as processed: {}", idempotencyKey);
        } catch (Exception e) {
            logger.error("Error marking idempotency key: {}", e.getMessage());
        }
    }

    public Object getResult(String idempotencyKey) {
        try {
            return redisTemplate.opsForValue().get(idempotencyKey);
        } catch (Exception e) {
            logger.error("Error getting idempotency result: {}", e.getMessage());
            return null;
        }
    }

    public String generateIdempotencyKey() {
        return UUID.randomUUID().toString();
    }

    public void removeKey(String idempotencyKey) {
        try {
            redisTemplate.delete(idempotencyKey);
        } catch (Exception e) {
            logger.error("Error removing idempotency key: {}", e.getMessage());
        }
    }
}
