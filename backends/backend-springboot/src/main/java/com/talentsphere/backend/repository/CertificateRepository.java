package com.talentsphere.backend.repository;

import com.talentsphere.backend.model.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Certificate entity.
 */
@Repository
public interface CertificateRepository extends JpaRepository<Certificate, String> {

    /**
     * Find certificate by verification code.
     * 
     * @param verificationCode the unique verification code
     * @return Optional containing the certificate if found
     */
    Optional<Certificate> findByVerificationCode(String verificationCode);

    /**
     * Find certificate by enrollment ID.
     * 
     * @param enrollmentId the enrollment ID
     * @return Optional containing the certificate if found
     */
    Optional<Certificate> findByEnrollmentId(String enrollmentId);

    /**
     * Find certificates by user ID.
     * 
     * @param userId the user ID
     * @return List of certificates
     */
    java.util.List<Certificate> findByUserId(String userId);

    /**
     * Check if a certificate exists for an enrollment.
     * 
     * @param enrollmentId the enrollment ID
     * @return true if certificate exists
     */
    boolean existsByEnrollmentId(String enrollmentId);
}
