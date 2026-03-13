package com.talentsphere.common.exception;

import com.fasterxml.jackson.annotation.JsonValue;

public enum ErrorCode {

    UNAUTHORIZED("UNAUTHORIZED", 401, "Authentication required"),
    FORBIDDEN("FORBIDDEN", 403, "Access denied"),
    INVALID_TOKEN("INVALID_TOKEN", 401, "Invalid or expired token"),
    TOKEN_EXPIRED("TOKEN_EXPIRED", 401, "Token has expired"),
    RATE_LIMIT_EXCEEDED("RATE_LIMIT_EXCEEDED", 429, "Too many requests"),
    
    VALIDATION_ERROR("VALIDATION_ERROR", 400, "Invalid request parameters"),
    INVALID_INPUT("INVALID_INPUT", 400, "Invalid input provided"),
    MISSING_REQUIRED_FIELD("MISSING_REQUIRED_FIELD", 400, "Required field is missing"),
    INVALID_FORMAT("INVALID_FORMAT", 400, "Invalid format"),
    
    RESOURCE_NOT_FOUND("RESOURCE_NOT_FOUND", 404, "Resource not found"),
    USER_NOT_FOUND("USER_NOT_FOUND", 404, "User not found"),
    JOB_NOT_FOUND("JOB_NOT_FOUND", 404, "Job not found"),
    COMPANY_NOT_FOUND("COMPANY_NOT_FOUND", 404, "Company not found"),
    APPLICATION_NOT_FOUND("APPLICATION_NOT_FOUND", 404, "Application not found"),
    
    DUPLICATE_RESOURCE("DUPLICATE_RESOURCE", 409, "Resource already exists"),
    EMAIL_ALREADY_EXISTS("EMAIL_ALREADY_EXISTS", 409, "Email already registered"),
    USERNAME_TAKEN("USERNAME_TAKEN", 409, "Username already taken"),
    
    INTERNAL_SERVER_ERROR("INTERNAL_SERVER_ERROR", 500, "Internal server error"),
    SERVICE_UNAVAILABLE("SERVICE_UNAVAILABLE", 503, "Service temporarily unavailable"),
    DATABASE_ERROR("DATABASE_ERROR", 500, "Database operation failed"),
    CACHE_ERROR("CACHE_ERROR", 500, "Cache operation failed"),
    
    BAD_REQUEST("BAD_REQUEST", 400, "Invalid request"),
    METHOD_NOT_ALLOWED("METHOD_NOT_ALLOWED", 405, "HTTP method not allowed"),
    NOT_ACCEPTABLE("NOT_ACCEPTABLE", 406, "Not acceptable"),
    UNSUPPORTED_MEDIA_TYPE("UNSUPPORTED_MEDIA_TYPE", 415, "Unsupported media type"),
    
    CIRCUIT_BREAKER_OPEN("CIRCUIT_BREAKER_OPEN", 503, "Service temporarily unavailable"),
    EXTERNAL_SERVICE_ERROR("EXTERNAL_SERVICE_ERROR", 502, "External service error"),
    
    FILE_TOO_LARGE("FILE_TOO_LARGE", 413, "File size exceeds limit"),
    INVALID_FILE_TYPE("INVALID_FILE_TYPE", 400, "Invalid file type"),
    UPLOAD_FAILED("UPLOAD_FAILED", 500, "File upload failed"),
    
    PERMISSION_DENIED("PERMISSION_DENIED", 403, "Permission denied"),
    INSUFFICIENT_PERMISSIONS("INSUFFICIENT_PERMISSIONS", 403, "Insufficient permissions"),
    ROLE_NOT_ALLOWED("ROLE_NOT_ALLOWED", 403, "Role not allowed for this operation");

    private final String code;
    private final int httpStatus;
    private final String defaultMessage;

    ErrorCode(String code, int httpStatus, String defaultMessage) {
        this.code = code;
        this.httpStatus = httpStatus;
        this.defaultMessage = defaultMessage;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    public int getHttpStatus() {
        return httpStatus;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }

    public String getMessage(String customMessage) {
        return customMessage != null && !customMessage.isBlank() ? customMessage : defaultMessage;
    }
}
