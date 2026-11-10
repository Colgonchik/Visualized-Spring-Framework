package com.visualsb.autoconfiguration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.jackson.JacksonAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.ApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class AutoconfigurationApplicationTests {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(JacksonAutoConfiguration.class));

    @Autowired
    private ApplicationContext context;

    @Test
    void mainAppUsesCustomObjectMapperAndAutoConfigurationBacksOff() {
        assertThat(context.getBeanNamesForType(ObjectMapper.class)).containsExactly("objectMapper");
        assertThat(context.containsBean("jacksonObjectMapper")).isFalse();
        assertThat(context.getBean(ObjectMapper.class).isEnabled(SerializationFeature.INDENT_OUTPUT)).isTrue();
    }

    @Test
    void autoConfigurationCreatesObjectMapperWhenUserHasNone() {
        contextRunner.run(fresh -> {
            assertThat(fresh).hasBean("jacksonObjectMapper");
            assertThat(fresh).hasSingleBean(ObjectMapper.class);
        });
    }

    @Test
    void userBeanMakesAutoConfigurationBackOff() {
        contextRunner.withUserConfiguration(AppConfig.class).run(fresh -> {
            assertThat(fresh).hasBean("objectMapper");
            assertThat(fresh).doesNotHaveBean("jacksonObjectMapper");
            assertThat(fresh.getBean(ObjectMapper.class).isEnabled(SerializationFeature.INDENT_OUTPUT)).isTrue();
        });
    }

    @Test
    void importsFileListsAutoConfigurations() throws Exception {
        assertThat(AutoconfigReportRunner.readAutoConfigImports())
                .contains("org.springframework.boot.autoconfigure.jackson.JacksonAutoConfiguration");
    }
}
