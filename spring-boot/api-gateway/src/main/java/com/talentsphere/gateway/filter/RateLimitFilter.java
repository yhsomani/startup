package com.talentsphere.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitFilter implements GlobalFilter, Ordered {

    private static final int MAX_REQUESTS_PER_MINUTE = 100;
    private static final Duration WINDOW_SIZE = Duration.ofMinutes(1);

    private final Map<String,RateLimitBucket> buckets = new ConcurrentHashMap<>();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String clientId = resolveClientId(exchange.getRequest());
        RateLimitBucket bucket = buckets.computeIfAbsent(clientId, k -> new RateLimitBucket());

        if (!bucket.tryConsume()) {
            ServerHttpResponse response = exchange.getResponse();
            response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            response.getHeaders().add("Content-Type", "application/json");
            String body = "{\"success\":false,\"message\":\"Rate limit exceeded. Please try again later.\",\"errorCode\":\"RATE_LIMIT_EXCEEDED\"}";
            return response.writeWith(Mono.just(response.bufferFactory().wrap(body.getBytes())));
        }

        return chain.filter(exchange);
    }

    private String resolveClientId(ServerHttpRequest request) {
        String authHeader = request.getHeaders().getFirst("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return "token:" + authHeader.substring(7, Math.min(authHeader.length(), 20));
        }
        return "ip:" + request.getRemoteAddress() != null 
            ? request.getRemoteAddress().getAddress().getHostAddress() 
            : "unknown";
    }

    @Override
    public int getOrder() {
        return -200;
    }

    private static class RateLimitBucket {
        private final AtomicInteger count = new AtomicInteger(0);
        private volatile long windowStart = System.currentTimeMillis();

        synchronized boolean tryConsume() {
            long now = System.currentTimeMillis();
            if (now - windowStart > WINDOW_SIZE.toMillis()) {
                windowStart = now;
                count.set(0);
            }
            return count.incrementAndGet() <= MAX_REQUESTS_PER_MINUTE;
        }
    }
}
