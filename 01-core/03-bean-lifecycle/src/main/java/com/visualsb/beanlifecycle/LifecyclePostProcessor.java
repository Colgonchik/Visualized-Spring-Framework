package com.visualsb.beanlifecycle;

import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.stereotype.Component;

@Component
public class LifecyclePostProcessor implements BeanPostProcessor {

    private final LifecycleLog log;

    public LifecyclePostProcessor(LifecycleLog log) {
        this.log = log;
    }

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        if (bean instanceof LifeCycleBean) {
            log.add("bppBefore");
            System.out.println(">>> 4. BeanPostProcessor#postProcessBeforeInitialization");
        }
        return bean;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        if (bean instanceof LifeCycleBean) {
            log.add("bppAfter");
            System.out.println(">>> 8. BeanPostProcessor#postProcessAfterInitialization — бин полностью инициализирован");
        }
        return bean;
    }
}
