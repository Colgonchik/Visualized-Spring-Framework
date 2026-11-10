package com.visualsb.beanpostprocessor;

import java.lang.reflect.Proxy;
import java.util.List;

import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.beans.factory.support.AbstractBeanFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class BppReportRunner implements CommandLineRunner {

    private final ConfigurableApplicationContext context;
    private final GreetingService greetingService;

    public BppReportRunner(ConfigurableApplicationContext context, GreetingService greetingService) {
        this.context = context;
        this.greetingService = greetingService;
    }

    @Override
    public void run(String... args) {
        List<BeanPostProcessor> processors =
                ((AbstractBeanFactory) context.getBeanFactory()).getBeanPostProcessors();

        System.out.println();
        System.out.println("================ BeanPostProcessor'Ы КОНТЕКСТА ================");
        for (int i = 0; i < processors.size(); i++) {
            System.out.printf("  %2d. %s%n", i + 1, processors.get(i).getClass().getName());
        }
        System.out.println();
        System.out.println("Класс бина greetingService в runtime: " + greetingService.getClass().getName());
        System.out.println("Это JDK-прокси? " + Proxy.isProxyClass(greetingService.getClass()));
        System.out.println();
        System.out.println("Вызов greetingService.greet(\"мир\"):");
        System.out.println("Ответ: " + greetingService.greet("мир"));
        System.out.println("===============================================================");
    }
}
