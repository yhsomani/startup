package com.talentsphere.backend.service;

import com.talentsphere.backend.dto.AuthResponse;
import com.talentsphere.backend.dto.LoginRequest;
import com.talentsphere.backend.dto.RegisterRequest;
import com.talentsphere.backend.model.User;
import com.talentsphere.backend.repository.UserRepository;
import com.talentsphere.backend.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private EventPublisher eventPublisher;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole() != null ? User.Role.valueOf(request.getRole()) : User.Role.STUDENT);

        user = userRepository.save(user);

        // Publish event
        Map<String, Object> eventData = java.util.Map.of("userId", user.getId(), "email", user.getEmail(), "role",
                user.getRole());
        eventPublisher.publishEvent("user.registered", eventData);

        String token = tokenProvider.generateToken(user.getEmail(), user.getId().toString(), user.getRole().name());

        return AuthResponse.builder()
                .userId(user.getId().toString())
                .email(user.getEmail())
                .role(user.getRole().name())
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(900)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        String token = tokenProvider.generateToken(user.getEmail(), user.getId().toString(), user.getRole().name());

        return AuthResponse.builder()
                .userId(user.getId().toString())
                .email(user.getEmail())
                .role(user.getRole().name())
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(900)
                .build();
    }
}
