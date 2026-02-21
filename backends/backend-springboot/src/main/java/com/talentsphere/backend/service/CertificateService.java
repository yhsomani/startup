package com.talentsphere.backend.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import com.talentsphere.backend.dto.CertificateResponse;
import com.talentsphere.backend.model.Certificate;
import com.talentsphere.backend.repository.CertificateRepository;
import com.talentsphere.backend.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileNotFoundException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Objects;
import java.util.UUID;

/**
 * Service for generating and managing course completion certificates.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CertificateService {

        private final CertificateRepository certificateRepository;
        private final EnrollmentRepository enrollmentRepository;

        private static final String CERTIFICATES_DIR = "certificates/";

        /**
         * Generate a certificate for a completed enrollment.
         * 
         * @param enrollmentId the enrollment ID
         * @return certificate response with URL and verification code
         * @throws IllegalStateException if enrollment is not 100% complete
         * @throws RuntimeException      if enrollment not found
         */
        @SuppressWarnings("null")
        @Transactional
        public CertificateResponse generateCertificate(String enrollmentId) {
                log.info("Generating certificate for enrollment: {}", enrollmentId);

                // Check if certificate already exists
                var existingCert = certificateRepository.findByEnrollmentId(enrollmentId);
                if (existingCert.isPresent()) {
                        log.info("Certificate already exists for enrollment: {}", enrollmentId);
                        return mapToResponse(existingCert.get());
                }

                // Get enrollment
                var enrollment = enrollmentRepository.findById(Objects.requireNonNull(UUID.fromString(enrollmentId)))
                                .orElseThrow(() -> new RuntimeException("Enrollment not found: " + enrollmentId));

                // Verify 100% completion
                if (enrollment.getProgressPercentage() < 100) {
                        throw new IllegalStateException(
                                        "Cannot generate certificate for incomplete course. Progress: "
                                                        + enrollment.getProgressPercentage() + "%");
                }

                // Generate verification code
                String verificationCode = UUID.randomUUID().toString().toUpperCase().substring(0, 12);

                // Generate PDF
                String fileName = "certificate_" + enrollment.getId() + ".pdf";
                String filePath = CERTIFICATES_DIR + fileName;

                try {
                        createCertificatePDF(
                                        filePath,
                                        enrollment.getUser().getEmail(),
                                        enrollment.getCourse().getTitle(),
                                        verificationCode);
                } catch (Exception e) {
                        log.error("Failed to generate PDF certificate", e);
                        throw new RuntimeException("Failed to generate PDF certificate", e);
                }

                // Save certificate record
                Certificate certificate = Certificate.builder()
                                .enrollmentId(enrollmentId)
                                .userId(enrollment.getUser().getId().toString())
                                .courseId(enrollment.getCourse().getId().toString())
                                .courseTitle(enrollment.getCourse().getTitle())
                                .userName(enrollment.getUser().getEmail())
                                .certificateUrl("/certificates/" + fileName)
                                .verificationCode(verificationCode)
                                .build();

                Certificate savedCertificate = Objects.requireNonNull(certificateRepository.save(certificate));

                log.info("Certificate generated successfully with ID: {}", savedCertificate.getId());

                return mapToResponse(savedCertificate);
        }

        /**
         * Verify a certificate by its verification code.
         * 
         * @param verificationCode the verification code
         * @return certificate response if valid
         */
        public CertificateResponse verifyCertificate(String verificationCode) {
                Certificate certificate = certificateRepository.findByVerificationCode(verificationCode)
                                .orElseThrow(() -> new RuntimeException("Invalid verification code"));

                return mapToResponse(certificate);
        }

        /**
         * Create PDF certificate document.
         */
        private void createCertificatePDF(String filePath, String studentName, String courseTitle,
                        String verificationCode) throws FileNotFoundException {

                // Create directory if needed
                File dir = new File(CERTIFICATES_DIR);
                if (!dir.exists()) {
                        dir.mkdirs();
                }

                PdfWriter writer = new PdfWriter(filePath);
                PdfDocument pdf = new PdfDocument(writer);
                Document document = new Document(pdf);

                // Title
                Paragraph title = new Paragraph("CERTIFICATE OF COMPLETION")
                                .setFontSize(24)
                                .setBold()
                                .setTextAlignment(TextAlignment.CENTER)
                                .setMarginTop(50);
                document.add(title);

                // Subtitle
                Paragraph subtitle = new Paragraph("This is to certify that")
                                .setFontSize(14)
                                .setTextAlignment(TextAlignment.CENTER)
                                .setMarginTop(30);
                document.add(subtitle);

                // Student name
                Paragraph student = new Paragraph(studentName)
                                .setFontSize(20)
                                .setBold()
                                .setTextAlignment(TextAlignment.CENTER)
                                .setFontColor(ColorConstants.BLUE)
                                .setMarginTop(20);
                document.add(student);

                // Course completion text
                Paragraph completion = new Paragraph("has successfully completed the course")
                                .setFontSize(14)
                                .setTextAlignment(TextAlignment.CENTER)
                                .setMarginTop(20);
                document.add(completion);

                // Course title
                Paragraph course = new Paragraph(courseTitle)
                                .setFontSize(18)
                                .setBold()
                                .setTextAlignment(TextAlignment.CENTER)
                                .setMarginTop(20);
                document.add(course);

                // Date
                String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));
                Paragraph date = new Paragraph("Date: " + dateStr)
                                .setFontSize(12)
                                .setTextAlignment(TextAlignment.CENTER)
                                .setMarginTop(40);
                document.add(date);

                // Verification code
                Paragraph verification = new Paragraph("Verification Code: " + verificationCode)
                                .setFontSize(10)
                                .setTextAlignment(TextAlignment.CENTER)
                                .setMarginTop(20)
                                .setFontColor(ColorConstants.GRAY);
                document.add(verification);

                // Footer
                Paragraph footer = new Paragraph("TalentSphere - Empowering Learners")
                                .setFontSize(10)
                                .setTextAlignment(TextAlignment.CENTER)
                                .setMarginTop(50)
                                .setFontColor(ColorConstants.GRAY);
                document.add(footer);

                document.close();

                log.info("PDF certificate created: {}", filePath);
        }

        /**
         * Map Certificate entity to CertificateResponse DTO.
         */
        private CertificateResponse mapToResponse(Certificate certificate) {
                return CertificateResponse.builder()
                                .certificateId(certificate.getId())
                                .certificateUrl(certificate.getCertificateUrl())
                                .verificationCode(certificate.getVerificationCode())
                                .issuedAt(certificate.getIssuedAt())
                                .build();
        }
}
