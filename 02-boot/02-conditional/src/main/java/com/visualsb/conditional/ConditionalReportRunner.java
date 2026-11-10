package com.visualsb.conditional;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class ConditionalReportRunner implements CommandLineRunner {

    private final ApplicationContext context;

    public ConditionalReportRunner(ApplicationContext context) {
        this.context = context;
    }

    @Override
    public void run(String... args) {
        System.out.println();
        System.out.println("================ УСЛОВНАЯ РЕГИСТРАЦИЯ БИНОВ ================");
        System.out.println("feature.notifications.enabled=true  -> notificationService: "
                + context.containsBean("notificationService"));
        System.out.println("Jackson в classpath                 -> jacksonReportService: "
                + context.containsBean("jacksonReportService"));
        System.out.println("demo.mode=full (не задан)           -> advancedModeService: "
                + context.containsBean("advancedModeService"));
        System.out.println();
        System.out.println("Включить расширенный режим: -Ddemo.mode=full");
        System.out.println("Выключить уведомления: --feature.notifications.enabled=false");
        System.out.println("Причины решений: запуск с --debug (CONDITIONS EVALUATION REPORT)");
        System.out.println("===========================================================");
    }
}
