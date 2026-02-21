package com.talentsphere.backend.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

/**
 * Correlation ID Filter
 * 
 * Ensures every request has a correlation ID for distributed tracing.
 * - Extracts X-Request-ID or X-Correlation-ID from incoming requests
 * - Generates a new UUID if not present
 * - Adds correlation ID to response headers
 * - Sets correlation ID in MDC for logging
 */
@Component
@Order(1)
public class CorrelationIdFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(CorrelationIdFilter.class);

    private static final String REQUEST_ID_HEADER = "X-Request-ID";
    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    private static final String MDC_CORRELATION_ID = "correlationId";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Get or generate correlation ID
        String correlationId = httpRequest.getHeader(REQUEST_ID_HEADER);
        if (correlationId == null || correlationId.isEmpty()) {
            correlationId = httpRequest.getHeader(CORRELATION_ID_HEADER);
        }
        if (correlationId == null || correlationId.isEmpty()) {
            correlationId = UUID.randomUUID().toString();
        }

        // Set in MDC for logging
        MDC.put(MDC_CORRELATION_ID, correlationId);

        // Set in response headers
        httpResponse.setHeader(REQUEST_ID_HEADER, correlationId);

        // Track request timing
        long startTime = System.currentTimeMillis();

        try {
            // Log request (skip health checks)
            String path = httpRequest.getRequestURI();
            if (!path.contains("/health") && !path.contains("/actuator")) {
                logger.info("REQUEST | {} {} | correlationId={}",
                        httpRequest.getMethod(), path, correlationId);
            }

            // Process request
            chain.doFilter(request, response);

        } finally {
            // Calculate duration
            long duration = System.currentTimeMillis() - startTime;
            httpResponse.setHeader("X-Response-Time", duration + "ms");

            // Log response (skip health checks)
            String path = httpRequest.getRequestURI();
            if (!path.contains("/health") && !path.contains("/actuator")) {
                logger.info("RESPONSE | {} {} | status={} | duration={}ms | correlationId={}",
                        httpRequest.getMethod(), path, httpResponse.getStatus(), duration, correlationId);
            }

            // Clean up MDC
            MDC.remove(MDC_CORRELATION_ID);
        }
    }
}
