package com.visualsb.aopproxies;

import org.springframework.aop.support.AopUtils;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class AopReportRunner implements CommandLineRunner {

    private final AccountService accountService;
    private final ReportService reportService;

    public AopReportRunner(AccountService accountService, ReportService reportService) {
        this.accountService = accountService;
        this.reportService = reportService;
    }

    @Override
    public void run(String... args) {
        System.out.println();
        System.out.println("================ КАКИЕ ПРОКСИ СОЗДАЛ SPRING ================");
        printProxy("accountService (есть интерфейс)", accountService);
        printProxy("reportService (без интерфейса)", reportService);

        System.out.println();
        System.out.println("=== 1. transfer(): нормальный вызов через прокси ===");
        System.out.println("Результат: " + accountService.transfer("a", "b"));

        System.out.println();
        System.out.println("=== 2. failingOperation(): исключение внутри @Transactional ===");
        try {
            accountService.failingOperation();
        } catch (IllegalStateException e) {
            System.out.println("Поймано: " + e.getMessage());
        }

        System.out.println();
        System.out.println("=== 3. selfCallDemo(): this.transfer() в обход прокси ===");
        System.out.println("Результат: " + accountService.selfCallDemo());
        System.out.println("Обратите внимание: строк [tx] НЕ было — самовызов миновал прокси.");
        System.out.println("===========================================================");
    }

    private static void printProxy(String label, Object bean) {
        System.out.println(label);
        System.out.println("  класс: " + bean.getClass().getName());
        System.out.println("  JDK-прокси? " + AopUtils.isJdkDynamicProxy(bean)
                + " | CGLIB-прокси? " + AopUtils.isCglibProxy(bean));
    }
}
