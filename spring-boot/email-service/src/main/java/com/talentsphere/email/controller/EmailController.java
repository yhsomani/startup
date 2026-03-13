package com.talentsphere.email.controller;

import com.talentsphere.common.dto.ApiResponse;
import com.talentsphere.email.entity.EmailLog;
import com.talentsphere.email.entity.EmailTemplate;
import com.talentsphere.email.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/email")
@RequiredArgsConstructor
public class EmailController {

    private final EmailService emailService;

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<EmailLog>> sendEmail(@RequestBody SendEmailRequest request) {
        EmailLog emailLog = emailService.sendEmail(request.getTo(), request.getSubject(), request.getBody());
        return ResponseEntity.ok(ApiResponse.success(emailLog));
    }

    @PostMapping("/send/templated")
    public ResponseEntity<ApiResponse<EmailLog>> sendTemplatedEmail(@RequestBody SendTemplatedEmailRequest request) {
        EmailLog emailLog = emailService.sendTemplatedEmail(request.getTo(), request.getEventType(), request.getVariables());
        return ResponseEntity.ok(ApiResponse.success(emailLog));
    }

    @GetMapping("/templates/{eventType}")
    public ResponseEntity<ApiResponse<EmailTemplate>> getTemplate(@PathVariable String eventType) {
        EmailTemplate template = emailService.getTemplate(eventType);
        return ResponseEntity.ok(ApiResponse.success(template));
    }

    @PostMapping("/templates")
    public ResponseEntity<ApiResponse<EmailTemplate>> saveTemplate(@RequestBody EmailTemplate template) {
        EmailTemplate savedTemplate = emailService.saveTemplate(template);
        return ResponseEntity.ok(ApiResponse.success(savedTemplate));
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<Page<EmailLog>>> getEmailLogs(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<EmailLog> logs = emailService.getEmailLogs(pageable);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @PostMapping("/logs/{id}/retry")
    public ResponseEntity<ApiResponse<EmailLog>> retryFailedEmail(@PathVariable UUID id) {
        EmailLog emailLog = emailService.retryFailedEmail(id);
        return ResponseEntity.ok(ApiResponse.success(emailLog));
    }

    public static class SendEmailRequest {
        private String to;
        private String subject;
        private String body;

        public String getTo() { return to; }
        public void setTo(String to) { this.to = to; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getBody() { return body; }
        public void setBody(String body) { this.body = body; }
    }

    public static class SendTemplatedEmailRequest {
        private String to;
        private String eventType;
        private Map<String, Object> variables;

        public String getTo() { return to; }
        public void setTo(String to) { this.to = to; }
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public Map<String, Object> getVariables() { return variables; }
        public void setVariables(Map<String, Object> variables) { this.variables = variables; }
    }
}
