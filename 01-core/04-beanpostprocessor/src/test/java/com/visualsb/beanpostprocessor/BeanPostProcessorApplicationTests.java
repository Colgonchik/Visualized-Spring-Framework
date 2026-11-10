package com.visualsb.beanpostprocessor;

import java.lang.reflect.Proxy;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.support.AbstractBeanFactory;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ConfigurableApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class BeanPostProcessorApplicationTests {

    @Autowired
    private ConfigurableApplicationContext context;

    @Autowired
    private GreetingService greetingService;

    @Test
    void postProcessorReplacesBeanWithJdkProxy() {
        assertThat(Proxy.isProxyClass(greetingService.getClass())).isTrue();
        assertThat(greetingService).isNotInstanceOf(GreetingServiceImpl.class);
    }

    @Test
    void proxyStillDelegatesToRealImplementation() {
        assertThat(greetingService.greet("тест")).isEqualTo("Привет, тест!");
    }

    @Test
    void magicAnnotationsArePostProcessorsUnderTheHood() {
        List<String> names = ((AbstractBeanFactory) context.getBeanFactory()).getBeanPostProcessors().stream()
                .map(processor -> processor.getClass().getName())
                .toList();
        assertThat(names).anyMatch(name -> name.contains("AutowiredAnnotationBeanPostProcessor"));
        assertThat(names).anyMatch(name -> name.contains("CommonAnnotationBeanPostProcessor"));
        assertThat(names).anyMatch(name -> name.contains("LoggingPostProcessor"));
    }
}
