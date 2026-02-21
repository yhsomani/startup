package com.talentsphere.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.UUID;

/**
 * Standard API Response Envelope
 * 
 * Ensures consistent response format across all endpoints.
 * 
 * Format:
 * {
 * "success": true/false,
 * "data": {...} or null,
 * "error": null or {"code": "...", "message": "..."},
 * "meta": {"requestId": "...", "timestamp": "...", "service": "..."}
 * }
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private ApiError error;
    private ApiMeta meta;
    private String message;

    // Default constructor
    public ApiResponse() {
        this.meta = new ApiMeta();
    }

    // Success response
    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = true;
        response.data = data;
        response.error = null;
        return response;
    }

    // Success response with message
    public static <T> ApiResponse<T> success(T data, String message) {
        ApiResponse<T> response = success(data);
        response.message = message;
        return response;
    }

    // Error response
    public static <T> ApiResponse<T> error(String code, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = false;
        response.data = null;
        response.error = new ApiError(code, message);
        return response;
    }

    // Error response with details
    public static <T> ApiResponse<T> error(String code, String message, Object details) {
        ApiResponse<T> response = new ApiResponse<>();
        response.success = false;
        response.data = null;
        response.error = new ApiError(code, message, details);
        return response;
    }

    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public ApiError getError() {
        return error;
    }

    public void setError(ApiError error) {
        this.error = error;
    }

    public ApiMeta getMeta() {
        return meta;
    }

    public void setMeta(ApiMeta meta) {
        this.meta = meta;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    /**
     * API Error structure
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ApiError {
        private String code;
        private String message;
        private Object details;

        public ApiError() {
        }

        public ApiError(String code, String message) {
            this.code = code;
            this.message = message;
        }

        public ApiError(String code, String message, Object details) {
            this.code = code;
            this.message = message;
            this.details = details;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public Object getDetails() {
            return details;
        }

        public void setDetails(Object details) {
            this.details = details;
        }
    }

    /**
     * API Metadata
     */
    public static class ApiMeta {
        private String requestId;
        private String timestamp;
        private String service;

        public ApiMeta() {
            this.requestId = UUID.randomUUID().toString();
            this.timestamp = Instant.now().toString();
            this.service = "springboot-backend";
        }

        public ApiMeta(String requestId) {
            this.requestId = requestId;
            this.timestamp = Instant.now().toString();
            this.service = "springboot-backend";
        }

        public String getRequestId() {
            return requestId;
        }

        public void setRequestId(String requestId) {
            this.requestId = requestId;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }

        public String getService() {
            return service;
        }

        public void setService(String service) {
            this.service = service;
        }
    }
}
