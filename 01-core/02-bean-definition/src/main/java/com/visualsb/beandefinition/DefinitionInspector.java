package com.visualsb.beandefinition;

import com.visualsb.beandefinition.service.Greeter;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.beans.factory.support.BeanDefinitionRegistry;
import org.springframework.beans.factory.support.BeanDefinitionRegistryPostProcessor;
import org.springframework.beans.factory.support.RootBeanDefinition;
import org.springframework.stereotype.Component;

@Component
public class DefinitionInspector implements BeanDefinitionRegistryPostProcessor {

    @Override
    public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) throws BeansException {
        BeanDefinition definition = new RootBeanDefinition(Greeter.class);
        registry.registerBeanDefinition("greeter", definition);
        System.out.println(">>> [registry] 'greeter' зарегистрирован программно: "
                + definition.getClass().getSimpleName()
                + ". Экземпляра ещё нет — только метаданные.");
    }

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        beanFactory.getBeanDefinition("expensiveService").setLazyInit(true);
        System.out.println(">>> [beanFactory] 'expensiveService': метаданные изменены -> lazyInit=true. "
                + "Объект не будет создан при старте.");
    }
}
