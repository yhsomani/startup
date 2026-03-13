package com.talentsphere.email.service;

import com.talentsphere.email.entity.EmailLog;
import com.talentsphere.email.entity.EmailLog.EmailStatus;
import com.talentsphere.email.entity.EmailTemplate;
import com.talentsphere.email.entity.EmailTemplate.EventType;
import com.talentsphere.email.repository.EmailLogRepository;
import com.talentsphere.email.repository.EmailTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final EmailTemplateRepository emailTemplateRepository;
    private final EmailLogRepository emailLogRepository;

    @Transactional
    public EmailLog sendEmail(String to, String subject, String body) {
        EmailLog emailLog = EmailLog.builder()
                .to(to)
                .subject(subject)
                .body(body)
                .status(EmailStatus.PENDING)
                .build();

        emailLog = emailLogRepository.save(emailLog);

        try {
            sendEmailMock(to, subject, body);
            emailLog.setStatus(EmailStatus.SENT);
            emailLog.setSentAt(LocalDateTime.now());
            log.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            emailLog.setStatus(EmailStatus.FAILED);
            emailLog.setErrorMessage(e.getMessage());
            log.error("Failed to send email to: {}, error: {}", to, e.getMessage());
        }

        return emailLogRepository.save(emailLog);
    }

    @Transactional
    public EmailLog sendTemplatedEmail(String to, String eventType, Map<String, Object> variables) {
        EventType type;
        try {
            type = EventType.valueOf(eventType.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid event type: " + eventType);
        }

        EmailTemplate template = emailTemplateRepository.findByEventTypeAndIsActiveTrue(type)
                .orElseThrow(() -> new IllegalArgumentException("Template not found for event type: " + eventType));

        String subject = interpolateVariables(template.getSubject(), variables);
        String body = interpolateVariables(template.getBody(), variables);

        return sendEmail(to, subject, body);
    }

    public EmailTemplate getTemplate(String eventType) {
        EventType type;
        try {
            type = EventType.valueOf(eventType.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid event type: " + eventType);
        }

        return emailTemplateRepository.findByEventTypeAndIsActiveTrue(type)
                .orElseThrow(() -> new IllegalArgumentException("Template not found for event type: " + eventType));
    }

    @Transactional
    public EmailTemplate saveTemplate(EmailTemplate template) {
        if (template.getId() == null && emailTemplateRepository.existsByTemplateName(template.getTemplateName())) {
            throw new IllegalArgumentException("Template with name " + template.getTemplateName() + " already exists");
        }
        return emailTemplateRepository.save(template);
    }

    public Page<EmailLog> getEmailLogs(Pageable pageable) {
        return emailLogRepository.findAll(pageable);
    }

    @Transactional
    public EmailLog retryFailedEmail(UUID id) {
        EmailLog emailLog = emailLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Email log not found with id: " + id));

        if (emailLog.getStatus() != EmailStatus.FAILED) {
            throw new IllegalArgumentException("Only failed emails can be retried");
        }

        emailLog.setStatus(EmailStatus.PENDING);
        emailLog.setErrorMessage(null);
        emailLog = emailLogRepository.save(emailLog);

        try {
            sendEmailMock(emailLog.getTo(), emailLog.getSubject(), emailLog.getBody());
            emailLog.setStatus(EmailStatus.SENT);
            emailLog.setSentAt(LocalDateTime.now());
            log.info("Email retried successfully to: {}", emailLog.getTo());
        } catch (Exception e) {
            emailLog.setStatus(EmailStatus.FAILED);
            emailLog.setErrorMessage(e.getMessage());
            log.error("Failed to retry email to: {}, error: {}", emailLog.getTo(), e.getMessage());
        }

        return emailLogRepository.save(emailLog);
    }

    private void sendEmailMock(String to, String subject, String body) {
        log.info("========================================");
        log.info("MOCK EMAIL SENDING");
        log.info("To: {}", to);
        log.info("Subject: {}", subject);
        log.info("Body: {}", body);
        log.info("========================================");
    }

    private String interpolateVariables(String template, Map<String, Object> variables) {
        if (template == null || variables == null) {
            return template;
        }

        Pattern pattern = Pattern.compile("\\{\\{(\\w+)\\}\\}");
        Matcher matcher = pattern.matcher(template);
        StringBuffer result = new StringBuffer();

        while (matcher.find()) {
            String variableName = matcher.group(1);
            Object value = variables.get(variableName);
            String replacement = value != null ? value.toString() : matcher.group(0);
            matcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(result);

        return result.toString();
    }
}
