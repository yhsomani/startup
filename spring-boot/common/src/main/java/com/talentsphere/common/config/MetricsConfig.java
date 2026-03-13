package com.talentsphere.common.config;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tag;
import org.springframework.boot.actuate.autoconfigure.metrics.MeterRegistryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration
public class MetricsConfig {

    @Bean
    public MeterRegistryCustomizer<MeterRegistry> meterRegistryCustomizer() {
        return (registry) -> registry.config().commonTags(
                Arrays.asList(
                        Tag.of("application", "talentsphere"),
                        Tag.of("service", System.getProperty("spring.application.name", "unknown"))
                )
        );
    }
}
