package com.visualsb.conditionsreport;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
class ActuatorReportRunner implements CommandLineRunner {

    @Override
    public void run(String... args) {
        System.out.println();
        System.out.println("================ ACTUATOR: РЕШЕНИЯ BOOT ================");
        System.out.println("http://localhost:8080/actuator/conditions -> positiveMatches / negativeMatches");
        System.out.println("http://localhost:8080/actuator/beans      -> фактические бины контекста");
        System.out.println("http://localhost:8080/actuator/health     -> состояние приложения");
        System.out.println("visual.report.detailed не задан -> detailedReportService в negativeMatches.");
        System.out.println("Эти endpoint'ы раскрыты только для локального учебного примера.");
        System.out.println("Сервер остаётся запущенным. Остановка: Ctrl+C.");
        System.out.println("========================================================");
    }
}
