package com.visualsb.beandefinition;

import com.visualsb.beandefinition.service.ExpensiveService;
import com.visualsb.beandefinition.service.Greeter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.beans.factory.support.RootBeanDefinition;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.ScannedGenericBeanDefinition;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class BeanDefinitionApplicationTests {

    @Autowired
    private ConfigurableApplicationContext context;

    @Test
    void programmaticallyRegisteredBeanNeedsNoAnnotations() {
        assertThat(context.getBean("greeter")).isInstanceOf(Greeter.class);
        assertThat(context.getBean("greeter", Greeter.class).greet()).contains("программно");
    }

    @Test
    void definitionTypeRevealsProvenance() {
        ConfigurableListableBeanFactory beanFactory = context.getBeanFactory();
        assertThat(beanFactory.getBeanDefinition("greeter")).isInstanceOf(RootBeanDefinition.class);
        assertThat(beanFactory.getBeanDefinition("expensiveService")).isInstanceOf(ScannedGenericBeanDefinition.class);
        assertThat(beanFactory.getBeanDefinition("timeProvider").getClass().getSimpleName())
                .isEqualTo("ConfigurationClassBeanDefinition");
    }

    @Test
    void lazyMetadataPreventsInstantiationAtStartup() {
        try (AnnotationConfigApplicationContext fresh = new AnnotationConfigApplicationContext()) {
            fresh.register(DefinitionInspector.class, ExpensiveService.class);
            fresh.refresh();

            assertThat(fresh.getBeanDefinition("expensiveService").isLazyInit()).isTrue();
            assertThat(fresh.getBeanFactory().containsSingleton("expensiveService")).isFalse();

            assertThat(fresh.getBean(ExpensiveService.class).work()).isEqualTo("работа выполнена");
            assertThat(fresh.getBeanFactory().containsSingleton("expensiveService")).isTrue();
        }
    }

    @Test
    void defaultScopeIsSingleton() {
        assertThat(context.getBean("greeter")).isSameAs(context.getBean("greeter"));
    }
}
