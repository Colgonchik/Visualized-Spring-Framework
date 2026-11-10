package com.visualsb.conditional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.visualsb.conditional.service.AdvancedModeService;
import com.visualsb.conditional.service.JacksonReportService;
import com.visualsb.conditional.service.NotificationService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeatureConfig {

    @Bean
    @ConditionalOnProperty(prefix = "feature.notifications", name = "enabled", havingValue = "true")
    public NotificationService notificationService() {
        return new NotificationService();
    }

    @Bean
    @ConditionalOnClass(ObjectMapper.class)
    public JacksonReportService jacksonReportService() {
        return new JacksonReportService();
    }

    @Bean
    @Conditional(OnFullModeCondition.class)
    public AdvancedModeService advancedModeService() {
        return new AdvancedModeService();
    }
}
