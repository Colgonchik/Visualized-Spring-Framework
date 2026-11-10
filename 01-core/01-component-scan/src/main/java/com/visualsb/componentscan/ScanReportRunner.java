package com.visualsb.componentscan;

import java.util.Arrays;

import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.support.BeanDefinitionRegistry;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class ScanReportRunner implements CommandLineRunner {

    private static final String BASE_PACKAGE = "com.visualsb.componentscan";

    private final ConfigurableApplicationContext context;

    public ScanReportRunner(ConfigurableApplicationContext context) {
        this.context = context;
    }

    @Override
    public void run(String... args) {
        BeanDefinitionRegistry registry = (BeanDefinitionRegistry) context.getBeanFactory();
        String[] names = context.getBeanDefinitionNames();

        System.out.println();
        System.out.println("================ ОТЧЁТ СКАНИРОВАНИЯ ================");
        System.out.println("Бины, найденные сканированием пакета " + BASE_PACKAGE + ":");
        Arrays.stream(names)
                .filter(name -> isUserBean(registry.getBeanDefinition(name)))
                .sorted()
                .forEach(name -> System.out.printf("  %-24s -> %s%n",
                        name, registry.getBeanDefinition(name).getBeanClassName()));
        System.out.println("Бин 'internalComponent' в контексте: "
                + (context.containsBean("internalComponent")
                        ? "есть" : "ОТСУТСТВУЕТ (исключён exclude-фильтром)"));
        System.out.println("Всего bean definitions: " + names.length
                + " (остальные — инфраструктура Spring Boot)");
        System.out.println("====================================================");
    }

    private static boolean isUserBean(BeanDefinition definition) {
        return definition.getBeanClassName() != null
                && definition.getBeanClassName().startsWith(BASE_PACKAGE);
    }
}
