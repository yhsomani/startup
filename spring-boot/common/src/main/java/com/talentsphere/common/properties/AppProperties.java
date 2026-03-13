package com.talentsphere.common.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private String name = "TalentSphere";
    private String version = "1.0.0";
    private String environment = "development";
    private boolean debug = false;
    private Cors cors = new Cors();
    private RateLimit rateLimit = new RateLimit();
    private Pagination pagination = new Pagination();

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }
    public boolean isDebug() { return debug; }
    public void setDebug(boolean debug) { this.debug = debug; }
    public Cors getCors() { return cors; }
    public void setCors(Cors cors) { this.cors = cors; }
    public RateLimit getRateLimit() { return rateLimit; }
    public void setRateLimit(RateLimit rateLimit) { this.rateLimit = rateLimit; }
    public Pagination getPagination() { return pagination; }
    public void setPagination(Pagination pagination) { this.pagination = pagination; }

    public static class Cors {
        private String[] allowedOrigins = {"http://localhost:3000"};
        private String[] allowedMethods = {"GET", "POST", "PUT", "DELETE", "OPTIONS"};
        private String[] allowedHeaders = {"*"};
        private boolean allowCredentials = true;
        private long maxAge = 3600;

        public String[] getAllowedOrigins() { return allowedOrigins; }
        public void setAllowedOrigins(String[] allowedOrigins) { this.allowedOrigins = allowedOrigins; }
        public String[] getAllowedMethods() { return allowedMethods; }
        public void setAllowedMethods(String[] allowedMethods) { this.allowedMethods = allowedMethods; }
        public String[] getAllowedHeaders() { return allowedHeaders; }
        public void setAllowedHeaders(String[] allowedHeaders) { this.allowedHeaders = allowedHeaders; }
        public boolean isAllowCredentials() { return allowCredentials; }
        public void setAllowCredentials(boolean allowCredentials) { this.allowCredentials = allowCredentials; }
        public long getMaxAge() { return maxAge; }
        public void setMaxAge(long maxAge) { this.maxAge = maxAge; }
    }

    public static class RateLimit {
        private int requestsPerMinute = 100;
        private int burstCapacity = 10;

        public int getRequestsPerMinute() { return requestsPerMinute; }
        public void setRequestsPerMinute(int requestsPerMinute) { this.requestsPerMinute = requestsPerMinute; }
        public int getBurstCapacity() { return burstCapacity; }
        public void setBurstCapacity(int burstCapacity) { this.burstCapacity = burstCapacity; }
    }

    public static class Pagination {
        private int defaultPageSize = 20;
        private int maxPageSize = 100;

        public int getDefaultPageSize() { return defaultPageSize; }
        public void setDefaultPageSize(int defaultPageSize) { this.defaultPageSize = defaultPageSize; }
        public int getMaxPageSize() { return maxPageSize; }
        public void setMaxPageSize(int maxPageSize) { this.maxPageSize = maxPageSize; }
    }
}
