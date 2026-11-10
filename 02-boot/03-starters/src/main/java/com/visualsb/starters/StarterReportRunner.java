package com.visualsb.starters;

import com.visualsb.starters.starter.GreeterService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class StarterReportRunner implements CommandLineRunner {

    private final ApplicationContext context;
    private final GreeterService greeterService;

    public StarterReportRunner(ApplicationContext context, GreeterService greeterService) {
        this.context = context;
        this.greeterService = greeterService;
    }

    @Override
    public void run(String... args) {
        System.out.println();
        System.out.println("================ СОБСТВЕННЫЙ СТАРТЕР ================");
        System.out.println("В приложении НЕТ конфигурации для greeterService —");
        System.out.println("его создала GreeterAutoConfiguration из нашего AutoConfiguration.imports.");
        System.out.println("greet(): " + greeterService.greet());
        System.out.println("visual.greeting.name задано в application.properties (биндинг @ConfigurationProperties).");
        System.out.println("Выключить: visual.greeting.enabled=false. Свой @Bean GreeterService -> стартер отступит.");
        System.out.println("====================================================");
    }
}
