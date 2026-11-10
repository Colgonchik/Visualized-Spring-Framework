package com.visualsb.beandefinition;

import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class DefinitionReportRunner implements CommandLineRunner {

    private final ConfigurableApplicationContext context;

    public DefinitionReportRunner(ConfigurableApplicationContext context) {
        this.context = context;
    }

    @Override
    public void run(String... args) {
        ConfigurableListableBeanFactory beanFactory = context.getBeanFactory();

        System.out.println();
        System.out.println("================ BEAN DEFINITIONS ================");
        System.out.printf("  %-18s %-34s %-10s %s%n", "Имя", "Тип определения", "scope", "lazy");
        for (String name : new String[]{"greeter", "expensiveService", "timeProvider"}) {
            BeanDefinition bd = beanFactory.getBeanDefinition(name);
            String scope = bd.getScope().isEmpty() ? BeanDefinition.SCOPE_SINGLETON : bd.getScope();
            System.out.printf("  %-18s %-34s %-10s %s%n",
                    name, bd.getClass().getSimpleName(), scope, bd.isLazyInit());
        }
        System.out.println("Экземпляр expensiveService создан при старте? "
                + beanFactory.containsSingleton("expensiveService"));
        System.out.println();
        System.out.println("Запрашиваю expensiveService из контекста...");
        System.out.println("Ответ бина: " + context.getBean("expensiveService",
                com.visualsb.beandefinition.service.ExpensiveService.class).work());
        System.out.println("==================================================");
    }
}
