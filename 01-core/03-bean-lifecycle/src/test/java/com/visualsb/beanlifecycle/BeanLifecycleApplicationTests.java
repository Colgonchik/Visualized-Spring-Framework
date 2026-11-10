package com.visualsb.beanlifecycle;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class BeanLifecycleApplicationTests {

    @Autowired
    private ApplicationContext context;

    @Test
    void beanIsFullyInitializedAndUsable() {
        assertThat(context.getBean(LifeCycleBean.class).hello())
                .isEqualTo("бин 'lifeCycleBean' готов, collaborator = Collaborator");
    }

    @Test
    void initializationEventsHappenInExactOrder() {
        try (AnnotationConfigApplicationContext fresh = new AnnotationConfigApplicationContext()) {
            fresh.register(LifecycleLog.class, Collaborator.class, LifecyclePostProcessor.class, AppConfig.class);
            fresh.refresh();

            LifecycleLog log = fresh.getBean(LifecycleLog.class);
            assertThat(log.events()).containsExactly(
                    "constructor",
                    "populate",
                    "beanNameAware",
                    "bppBefore",
                    "postConstruct",
                    "afterPropertiesSet",
                    "customInit",
                    "bppAfter");

            fresh.close();

            assertThat(log.events()).containsExactly(
                    "constructor",
                    "populate",
                    "beanNameAware",
                    "bppBefore",
                    "postConstruct",
                    "afterPropertiesSet",
                    "customInit",
                    "bppAfter",
                    "preDestroy",
                    "destroy",
                    "customDestroy");
        }
    }
}
