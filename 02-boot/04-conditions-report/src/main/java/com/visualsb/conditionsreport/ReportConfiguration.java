package com.visualsb.conditionsreport;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
class ReportConfiguration {

    @Bean
    ReportService reportService() {
        return new ReportService("обычный отчёт");
    }

    @Bean
    @ConditionalOnProperty(prefix = "visual.report", name = "detailed", havingValue = "true")
    ReportService detailedReportService() {
        return new ReportService("подробный отчёт");
    }
}

record ReportService(String description) {
}
