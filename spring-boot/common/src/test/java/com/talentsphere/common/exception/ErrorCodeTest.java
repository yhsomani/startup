package com.talentsphere.common.exception;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ErrorCodeTest {

    @Test
    void testErrorCodeProperties() {
        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;
        
        assertEquals("UNAUTHORIZED", errorCode.getCode());
        assertEquals(401, errorCode.getHttpStatus());
        assertEquals("Authentication required", errorCode.getDefaultMessage());
    }

    @Test
    void testGetMessageWithCustomMessage() {
        ErrorCode errorCode = ErrorCode.RESOURCE_NOT_FOUND;
        
        String customMessage = "Custom not found message";
        assertEquals(customMessage, errorCode.getMessage(customMessage));
    }

    @Test
    void testGetMessageWithNull() {
        ErrorCode errorCode = ErrorCode.RESOURCE_NOT_FOUND;
        
        assertEquals("Resource not found", errorCode.getMessage(null));
    }

    @Test
    void testGetMessageWithBlank() {
        ErrorCode errorCode = ErrorCode.RESOURCE_NOT_FOUND;
        
        assertEquals("Resource not found", errorCode.getMessage("  "));
    }

    @Test
    void testAllErrorCodesHaveValidHttpStatus() {
        for (ErrorCode errorCode : ErrorCode.values()) {
            assertTrue(errorCode.getHttpStatus() >= 100 && errorCode.getHttpStatus() < 600,
                    "ErrorCode " + errorCode + " has invalid HTTP status");
        }
    }

    @Test
    void testAllErrorCodesHaveNonNullCode() {
        for (ErrorCode errorCode : ErrorCode.values()) {
            assertNotNull(errorCode.getCode(), "ErrorCode " + errorCode + " has null code");
            assertFalse(errorCode.getCode().isBlank(), "ErrorCode " + errorCode + " has blank code");
        }
    }

    @Test
    void testAllErrorCodesHaveNonNullMessage() {
        for (ErrorCode errorCode : ErrorCode.values()) {
            assertNotNull(errorCode.getDefaultMessage(), 
                    "ErrorCode " + errorCode + " has null default message");
        }
    }

    @Test
    void testJsonValueAnnotation() throws Exception {
        ErrorCode errorCode = ErrorCode.INVALID_TOKEN;
        
        assertEquals("INVALID_TOKEN", errorCode.getCode());
    }
}
