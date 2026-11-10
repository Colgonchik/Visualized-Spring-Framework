package com.visualsb.security;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.stereotype.Component;

@Component
class SecurityReportRunner implements CommandLineRunner {

    private final FilterChainProxy filterChainProxy;

    SecurityReportRunner(FilterChainProxy filterChainProxy) {
        this.filterChainProxy = filterChainProxy;
    }

    @Override
    public void run(String... args) {
        System.out.println();
        System.out.println("================ SECURITY FILTER CHAIN ================");
        System.out.println("Фильтры для /private (от первого к последнему):");
        filterChainProxy.getFilters("/private")
                .forEach(filter -> System.out.println(" -> " + filter.getClass().getSimpleName()));
        System.out.println("curl http://localhost:8080/public");
        System.out.println("curl -u user:pass http://localhost:8080/private");
        System.out.println("X-Visual-SB добавляет наш фильтр; пароль только для локального примера.");
        System.out.println("Сервер остаётся запущенным. Остановка: Ctrl+C.");
        System.out.println("=======================================================");
    }
}
