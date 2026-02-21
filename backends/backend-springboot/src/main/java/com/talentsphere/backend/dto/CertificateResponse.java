package com.talentsphere.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for certificate response.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CertificateResponse {
    private String certificateId;
    private String certificateUrl;
    private String verificationCode;
    private LocalDateTime issuedAt;
}
