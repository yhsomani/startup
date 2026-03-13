package com.talentsphere.common.discovery;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ServiceRegistryClient {

    private static final Logger logger = LoggerFactory.getLogger(ServiceRegistryClient.class);
    
    private final Map<String, List<String>> cache = new ConcurrentHashMap<>();
    
    @Value("${service.registry.url:http://localhost:8761}")
    private String registryUrl;

    public String getServiceUrl(String serviceName) {
        try {
            List<String> instances = getInstances(serviceName);
            if (instances == null || instances.isEmpty()) {
                logger.warn("No instances found for service: {}", serviceName);
                return null;
            }
            
            return instances.get(0);
        } catch (Exception e) {
            logger.error("Error getting service URL for {}: {}", serviceName, e.getMessage());
            return null;
        }
    }

    public List<String> getInstances(String serviceName) {
        if (cache.containsKey(serviceName)) {
            return cache.get(serviceName);
        }
        return null;
    }

    public void registerService(String serviceName, String url) {
        cache.computeIfAbsent(serviceName, k -> new java.util.ArrayList<>()).add(url);
        logger.info("Registered service {} at {}", serviceName, url);
    }

    public void invalidateCache(String serviceName) {
        cache.remove(serviceName);
        logger.debug("Cache invalidated for service: {}", serviceName);
    }

    public void invalidateAllCache() {
        cache.clear();
        logger.debug("All service cache invalidated");
    }

    public boolean isServiceAvailable(String serviceName) {
        List<String> instances = getInstances(serviceName);
        return instances != null && !instances.isEmpty();
    }
}
