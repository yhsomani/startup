package com.talentsphere.auth.service;

import com.talentsphere.auth.dto.LoginRequest;
import com.talentsphere.auth.dto.RegisterRequest;
import com.talentsphere.auth.entity.User;
import com.talentsphere.auth.repository.UserRepository;
import com.talentsphere.common.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceSecurityTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");
        testUser.setPassword("encodedPassword");
        testUser.setActive(true);
        testUser.setRoles(Collections.singleton("ROLE_USER"));
        testUser.setFailedLoginAttempts(0);
    }

    @Test
    void register_duplicateEmail_throwsException() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        assertThrows(RuntimeException.class, () -> {
            authService.register(request);
        });
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_invalidEmail_throwsException() {
        LoginRequest request = new LoginRequest();
        request.setEmail("invalid@example.com");
        request.setPassword("password");

        when(userRepository.findByEmail("invalid@example.com")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            authService.login(request);
        });
    }

    @Test
    void login_invalidPassword_incrementsFailedAttempts() {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("wrongPassword");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);

        assertThrows(RuntimeException.class, () -> {
            authService.login(request);
        });

        verify(userRepository).save(argThat(user ->
                user.getFailedLoginAttempts() == 1 && user.getLockedUntil() == null
        ));
    }

    @Test
    void login_fifthFailedAttempt_locksAccount() {
        testUser.setFailedLoginAttempts(4);

        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("wrongPassword");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPassword", "encodedPayment")).thenReturn(false);

        assertThrows(RuntimeException.class, () -> {
            authService.login(request);
        });

        verify(userRepository).save(argThat(user ->
                user.getLockedUntil() != null &&
                user.getFailedLoginAttempts() == 5
        ));
    }

    @Test
    void login_lockedAccount_throwsException() {
        testUser.setLockedUntil(LocalDateTime.now().plusMinutes(30));

        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("password");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        assertThrows(RuntimeException.class, () -> {
            authService.login(request);
        });
    }

    @Test
    void login_inactiveAccount_throwsException() {
        testUser.setActive(false);

        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("password");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password", "encodedPassword")).thenReturn(true);

        assertThrows(RuntimeException.class, () -> {
            authService.login(request);
        });
    }

    @Test
    void login_validCredentials_resetsFailedAttempts() {
        testUser.setFailedLoginAttempts(3);

        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("password");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password", "encodedPassword")).thenReturn(true);
        when(jwtTokenProvider.generateToken(any(), any(), any())).thenReturn("accessToken");
        when(jwtTokenProvider.generateRefreshToken(any())).thenReturn("refreshToken");

        authService.login(request);

        verify(userRepository).save(argThat(user ->
                user.getFailedLoginAttempts() == 0 &&
                user.getLockedUntil() == null
        ));
    }

    @Test
    void refreshToken_invalidToken_throwsException() {
        when(jwtTokenProvider.validateToken("invalidToken")).thenReturn(false);

        assertThrows(RuntimeException.class, () -> {
            authService.refreshToken("invalidToken");
        });
    }

    @Test
    void logout_userNotFound_throwsException() {
        when(userRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            authService.logout(UUID.randomUUID());
        });
    }
}