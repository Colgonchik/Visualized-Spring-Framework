package com.visualsb.beandefinition.config;

import com.visualsb.beandefinition.service.TimeProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {

    @Bean
    public TimeProvider timeProvider() {
        return new TimeProvider();
    }
}
