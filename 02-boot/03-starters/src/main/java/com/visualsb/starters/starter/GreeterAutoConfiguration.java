package com.visualsb.starters.starter;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

@AutoConfiguration
@EnableConfigurationProperties(GreeterProperties.class)
@ConditionalOnProperty(prefix = "visual.greeting", name = "enabled", havingValue = "true", matchIfMissing = true)
public class GreeterAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public GreeterService greeterService(GreeterProperties properties) {
        return new GreeterService(properties);
    }
}
