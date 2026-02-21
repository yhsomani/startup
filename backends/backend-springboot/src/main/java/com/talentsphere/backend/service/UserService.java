package com.talentsphere.backend.service;

import com.talentsphere.backend.model.Certificate;
import com.talentsphere.backend.model.Enrollment;
import com.talentsphere.backend.model.User;
import com.talentsphere.backend.repository.CertificateRepository;
import com.talentsphere.backend.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final EnrollmentRepository enrollmentRepository;
    private final CertificateRepository certificateRepository;

    /**
     * Search for candidates by skill and progress percentile.
     */
    public Map<String, Object> searchCandidates(String skill, int minPercentile) {
        List<Enrollment> enrollments = enrollmentRepository.searchBySkillAndProgress(skill, minPercentile);

        List<Map<String, Object>> candidates = enrollments.stream().map(e -> {
            User user = e.getUser();
            Map<String, Object> map = new HashMap<>();
            map.put("userId", user.getId());
            map.put("email", user.getEmail());

            Map<String, Object> skillInfo = new HashMap<>();
            skillInfo.put("skill", e.getCourse().getTitle());
            skillInfo.put("percentile", e.getProgressPercentage());
            skillInfo.put("verified", e.getProgressPercentage() == 100);

            map.put("verifiedSkills", List.of(skillInfo));
            return map;
        }).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("candidates", candidates);
        return response;
    }

    /**
     * Get all certificates for a specific user.
     */
    public List<Map<String, Object>> getUserCertificates(UUID userId) {
        List<Certificate> certificates = certificateRepository.findByUserId(userId.toString());
        return certificates.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("certificateId", c.getId());
            map.put("courseId", c.getCourseId());
            map.put("courseTitle", c.getCourseTitle());
            map.put("verificationCode", c.getVerificationCode());
            map.put("issuedAt", c.getIssuedAt());
            map.put("downloadUrl", "/api/v1/certificates/download/certificate_" + c.getEnrollmentId() + ".pdf");
            return map;
        }).collect(Collectors.toList());
    }
}
