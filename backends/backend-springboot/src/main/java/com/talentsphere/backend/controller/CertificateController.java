package com.talentsphere.backend.controller;

import com.talentsphere.backend.dto.CertificateResponse;
import com.talentsphere.backend.service.CertificateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.Objects;

/**
 * REST controller for certificate operations.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
public class CertificateController {

    private final CertificateService certificateService;

    /**
     * Generate certificate for completed enrollment.
     * POST /api/v1/enrollments/{id}/certificate
     * 
     * @param enrollmentId the enrollment ID
     * @return certificate response with URL and verification code
     */
    @PostMapping("/enrollments/{enrollmentId}/certificate")
    @PreAuthorize("hasAnyRole('STUDENT', 'INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<CertificateResponse> generateCertificate(@PathVariable String enrollmentId) {
        try {
            CertificateResponse response = certificateService.generateCertificate(enrollmentId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalStateException e) {
            log.error("Cannot generate certificate: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            log.error("Error generating certificate", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Verify certificate by verification code.
     * GET /api/v1/certificates/verify/{verificationCode}
     * 
     * @param verificationCode the verification code
     * @return certificate details if valid
     */
    @GetMapping("/certificates/verify/{verificationCode}")
    public ResponseEntity<CertificateResponse> verifyCertificate(@PathVariable String verificationCode) {
        try {
            CertificateResponse response = certificateService.verifyCertificate(verificationCode);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Invalid verification code: {}", verificationCode);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Download certificate PDF.
     * GET /api/v1/certificates/download/{certificateId}
     * 
     * @param certificateId the certificate ID
     * @return PDF file
     */
    @GetMapping("/certificates/download/{fileName}")
    public ResponseEntity<Resource> downloadCertificate(@PathVariable String fileName) {
        try {
            File file = new File("certificates/" + fileName);
            if (!file.exists()) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(file);
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName);

            return ResponseEntity.ok()
                    .headers(headers)
                    .contentType(Objects.requireNonNull(MediaType.APPLICATION_PDF))
                    .body(resource);
        } catch (Exception e) {
            log.error("Error downloading certificate", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
