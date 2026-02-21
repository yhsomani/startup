package com.talentsphere.backend.exception;

import com.talentsphere.backend.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.NoHandlerFoundException;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/**
 * Global Exception Handler
 * 
 * Provides consistent API error responses across all endpoints.
 * Uses standard error codes aligned with the API contract.
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Get or generate correlation ID from request
     */
    private String getCorrelationId(HttpServletRequest request) {
        String correlationId = request.getHeader("X-Request-ID");
        if (correlationId == null) {
            correlationId = request.getHeader("X-Correlation-ID");
        }
        if (correlationId == null) {
            correlationId = UUID.randomUUID().toString();
        }
        return correlationId;
    }

    /**
     * Build error response with correlation ID
     */
    private <T> ResponseEntity<ApiResponse<T>> buildErrorResponse(
            String code, String message, HttpStatus status, HttpServletRequest request) {
        ApiResponse<T> response = ApiResponse.error(code, message);
        response.getMeta().setRequestId(getCorrelationId(request));
        return new ResponseEntity<>(response, Objects.requireNonNull(status));
    }

    // ==========================================
    // Validation Errors (400)
    // ==========================================

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

        ApiResponse<Object> response = ApiResponse.error(
                "VALIDATION_ERROR",
                "Request validation failed",
                errors);
        response.getMeta().setRequestId(getCorrelationId(request));

        logger.warn("Validation error: {}", errors);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalArgumentException(
            IllegalArgumentException ex, HttpServletRequest request) {
        logger.warn("Invalid argument: {}", ex.getMessage());
        return buildErrorResponse("VALIDATION_ERROR", ex.getMessage(), HttpStatus.BAD_REQUEST, request);
    }

    // ==========================================
    // Authentication Errors (401)
    // ==========================================

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadCredentialsException(
            BadCredentialsException ex, HttpServletRequest request) {
        logger.warn("Authentication failed: {}", ex.getMessage());
        return buildErrorResponse("UNAUTHORIZED", "Invalid credentials", HttpStatus.UNAUTHORIZED, request);
    }

    // ==========================================
    // Authorization Errors (403)
    // ==========================================

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDeniedException(
            AccessDeniedException ex, HttpServletRequest request) {
        logger.warn("Access denied: {}", ex.getMessage());
        return buildErrorResponse("FORBIDDEN", "Permission denied", HttpStatus.FORBIDDEN, request);
    }

    // ==========================================
    // Not Found Errors (404)
    // ==========================================

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleEntityNotFoundException(
            EntityNotFoundException ex, HttpServletRequest request) {
        logger.warn("Entity not found: {}", ex.getMessage());
        return buildErrorResponse("NOT_FOUND", ex.getMessage(), HttpStatus.NOT_FOUND, request);
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleNoHandlerFoundException(
            NoHandlerFoundException ex, HttpServletRequest request) {
        logger.warn("No handler found: {} {}", ex.getHttpMethod(), ex.getRequestURL());
        return buildErrorResponse("NOT_FOUND", "Endpoint not found", HttpStatus.NOT_FOUND, request);
    }

    // ==========================================
    // Runtime Errors (400)
    // ==========================================

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Object>> handleRuntimeException(
            RuntimeException ex, HttpServletRequest request) {
        logger.error("Runtime exception: {}", ex.getMessage(), ex);
        return buildErrorResponse("BAD_REQUEST", ex.getMessage(), HttpStatus.BAD_REQUEST, request);
    }

    // ==========================================
    // Catch-All (500)
    // ==========================================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGlobalException(
            Exception ex, HttpServletRequest request) {
        String correlationId = getCorrelationId(request);
        logger.error("Unhandled exception [correlationId={}]: {}", correlationId, ex.getMessage(), ex);

        // Don't expose internal error details
        return buildErrorResponse(
                "INTERNAL_ERROR",
                "An unexpected error occurred. Reference: " + correlationId,
                HttpStatus.INTERNAL_SERVER_ERROR,
                request);
    }
}
