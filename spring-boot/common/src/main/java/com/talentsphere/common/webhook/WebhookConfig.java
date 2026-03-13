package com.talentsphere.common.webhook;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Configuration
@ConfigurationProperties(prefix = "webhook")
public class WebhookConfig {

    private static final Logger logger = LoggerFactory.getLogger(WebhookConfig.class);
    
    private Map<String, WebhookEndpoint> endpoints = new HashMap<>();
    private boolean enabled = true;
    private int timeout = 30000;
    private int retryCount = 3;

    public Map<String, WebhookEndpoint> getEndpoints() {
        return endpoints;
    }

    public void setEndpoints(Map<String, WebhookEndpoint> endpoints) {
        this.endpoints = endpoints;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getTimeout() {
        return timeout;
    }

    public void setTimeout(int timeout) {
        this.timeout = timeout;
    }

    public int getRetryCount() {
        return retryCount;
    }

    public void setRetryCount(int retryCount) {
        this.retryCount = retryCount;
    }

    public static class WebhookEndpoint {
        private String url;
        private String secret;
        private List<String> events;
        private boolean active = true;
        private int timeout = 30000;
        private int retryCount = 3;

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
        public String getSecret() { return secret; }
        public void setSecret(String secret) { this.secret = secret; }
        public List<String> getEvents() { return events; }
        public void setEvents(List<String> events) { this.events = events; }
        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }
        public int getTimeout() { return timeout; }
        public void setTimeout(int timeout) { this.timeout = timeout; }
        public int getRetryCount() { return retryCount; }
        public void setRetryCount(int retryCount) { this.retryCount = retryCount; }
    }
}
