package com.talentsphere.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private UUID userId;
    private String email;
    private String accessToken;
    private String refreshToken;
    private List<String> roles;
    private long expiresIn;
}
