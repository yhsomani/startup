package com.talentsphere.common.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class LoggingConfig implements WebMvcConfigurer {

    private static final Logger requestLog = LoggerFactory.getLogger("REQUEST_LOG");
    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new RequestLoggingInterceptor())
                .addPathPatterns("/api/**");
    }

    public static class RequestLoggingInterceptor implements HandlerInterceptor {

        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
            String correlationId = request.getHeader(CORRELATION_ID_HEADER);
            if (correlationId == null || correlationId.isBlank()) {
                correlationId = java.util.UUID.randomUUID().toString();
            }
            
            MDC.put("correlationId", correlationId);
            request.setAttribute("correlationId", correlationId);

            requestLog.info("REQUEST: method={} uri={} query={} correlationId={}",
                    request.getMethod(),
                    request.getRequestURI(),
                    request.getQueryString(),
                    correlationId);

            return true;
        }

        @Override
        public void afterCompletion(HttpServletRequest request, HttpServletResponse response, 
                                   Object handler, Exception ex) {
            String correlationId = (String) request.getAttribute("correlationId");
            Long startTime = (Long) request.getAttribute("startTime");
            
            requestLog.info("RESPONSE: method={} uri={} status={} correlationId={} duration={}ms",
                    request.getMethod(),
                    request.getRequestURI(),
                    response.getStatus(),
                    correlationId,
                    startTime != null ? System.currentTimeMillis() - startTime : 0);

            MDC.remove("correlationId");
        }
    }
}
