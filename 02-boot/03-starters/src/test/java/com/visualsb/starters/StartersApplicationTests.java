package com.visualsb.starters;

import com.visualsb.starters.starter.GreeterAutoConfiguration;
import com.visualsb.starters.starter.GreeterService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class StartersApplicationTests {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(GreeterAutoConfiguration.class));

    @Autowired
    private GreeterService greeterService;

    @Test
    void mainAppBindsNameFromProperties() {
        assertThat(greeterService.greet()).isEqualTo("Привет из собственного стартера, Visual SB!");
    }

    @Test
    void starterWorksWithDefaultsOutOfTheBox() {
        contextRunner.run(fresh -> {
            assertThat(fresh).hasSingleBean(GreeterService.class);
            assertThat(fresh.getBean(GreeterService.class).greet())
                    .isEqualTo("Привет из собственного стартера, мир!");
        });
    }

    @Test
    void starterCanBeDisabledByProperty() {
        contextRunner.withPropertyValues("visual.greeting.enabled=false")
                .run(fresh -> assertThat(fresh).doesNotHaveBean(GreeterService.class));
    }

    @Test
    void propertiesAreBoundToStarter() {
        contextRunner.withPropertyValues("visual.greeting.name=Тест", "visual.greeting.message=Салют")
                .run(fresh -> assertThat(fresh.getBean(GreeterService.class).greet())
                        .isEqualTo("Салют, Тест!"));
    }

    @Test
    void userBeanMakesStarterBackOff() {
        contextRunner.withUserConfiguration(CustomGreeterConfig.class)
                .run(fresh -> assertThat(fresh.getBean(GreeterService.class).greet())
                        .isEqualTo("пользовательский бин, мир!"));
    }

    static class CustomGreeterConfig {

        @Bean
        GreeterService customGreeter() {
            return new GreeterService(new com.visualsb.starters.starter.GreeterProperties()) {
                @Override
                public String greet() {
                    return "пользовательский бин, мир!";
                }
            };
        }
    }
}
