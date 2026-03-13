package com.talentsphere.common.security;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import java.util.UUID;

class JwtTokenProviderTest {

    private final JwtTokenProvider jwtTokenProvider = new JwtTokenProvider(
            "test-secret-key-for-jwt-signing-minimum-256-bits-long",
            3600000L,
            604800000L
    );

    @Test
    void testGenerateToken() {
        UUID userId = UUID.randomUUID();
        String email = "test@example.com";
        List<String> roles = List.of("USER", "ADMIN");
        
        String token = jwtTokenProvider.generateToken(userId, email, roles);
        
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void testGenerateRefreshToken() {
        UUID userId = UUID.randomUUID();
        
        String token = jwtTokenProvider.generateRefreshToken(userId);
        
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void testValidateToken() {
        UUID userId = UUID.randomUUID();
        String email = "test@example.com";
        List<String> roles = List.of("USER");
        
        String token = jwtTokenProvider.generateToken(userId, email, roles);
        
        assertTrue(jwtTokenProvider.validateToken(token));
    }

    @Test
    void testValidateInvalidToken() {
        assertFalse(jwtTokenProvider.validateToken("invalid.token.here"));
    }

    @Test
    void testGetUserIdFromToken() {
        UUID userId = UUID.randomUUID();
        String email = "test@example.com";
        List<String> roles = List.of("USER");
        
        String token = jwtTokenProvider.generateToken(userId, email, roles);
        
        UUID extractedUserId = jwtTokenProvider.getUserIdFromToken(token);
        
        assertEquals(userId, extractedUserId);
    }

    @Test
    void testGetEmailFromToken() {
        UUID userId = UUID.randomUUID();
        String email = "test@example.com";
        List<String> roles = List.of("USER");
        
        String token = jwtTokenProvider.generateToken(userId, email, roles);
        
        String extractedEmail = jwtTokenProvider.getEmailFromToken(token);
        
        assertEquals(email, extractedEmail);
    }

    @Test
    void testGetRolesFromToken() {
        UUID userId = UUID.randomUUID();
        String email = "test@example.com";
        List<String> roles = List.of("USER", "ADMIN");
        
        String token = jwtTokenProvider.generateToken(userId, email, roles);
        
        List<String> extractedRoles = jwtTokenProvider.getRolesFromToken(token);
        
        assertEquals(2, extractedRoles.size());
        assertTrue(extractedRoles.contains("USER"));
        assertTrue(extractedRoles.contains("ADMIN"));
    }

    @Test
    void testIsTokenExpired() {
        JwtTokenProvider shortExpirationProvider = new JwtTokenProvider(
                "test-secret-key-for-jwt-signing-minimum-256-bits-long",
                1000L,
                1000L
        );
        
        UUID userId = UUID.randomUUID();
        String email = "test@example.com";
        
        String token = shortExpirationProvider.generateToken(userId, email, List.of("USER"));
        
        assertFalse(shortExpirationProvider.isTokenExpired(token));
        
        try {
            Thread.sleep(1100);
        } catch (InterruptedException e) {
            // ignore
        }
        
        assertTrue(shortExpirationProvider.isTokenExpired(token));
    }

    @Test
    void testIsTokenExpiredForInvalidToken() {
        assertTrue(jwtTokenProvider.isTokenExpired("invalid.token"));
    }
}
