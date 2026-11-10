package com.visualsb.conditional;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.FilteredClassLoader;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.ApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ConditionalApplicationTests {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(FeatureConfig.class);

    @Autowired
    private ApplicationContext context;

    @Test
    void mainAppHasExpectedBeans() {
        assertThat(context.containsBean("notificationService")).isTrue();
        assertThat(context.containsBean("jacksonReportService")).isTrue();
        assertThat(context.containsBean("advancedModeService")).isFalse();
    }

    @Test
    void propertyConditionTogglesBean() {
        contextRunner.withPropertyValues("feature.notifications.enabled=true")
                .run(fresh -> assertThat(fresh).hasBean("notificationService"));
        contextRunner.withPropertyValues("feature.notifications.enabled=false")
                .run(fresh -> assertThat(fresh).doesNotHaveBean("notificationService"));
    }

    @Test
    void classConditionDependsOnClasspath() {
        contextRunner.run(fresh -> assertThat(fresh).hasBean("jacksonReportService"));
        contextRunner.withClassLoader(new FilteredClassLoader(ObjectMapper.class))
                .run(fresh -> assertThat(fresh).doesNotHaveBean("jacksonReportService"));
    }

    @Test
    void customConditionReadsSystemProperty() {
        contextRunner.run(fresh -> assertThat(fresh).doesNotHaveBean("advancedModeService"));
        System.setProperty("demo.mode", "full");
        try {
            contextRunner.run(fresh -> assertThat(fresh).hasBean("advancedModeService"));
        } finally {
            System.clearProperty("demo.mode");
        }
    }
}
