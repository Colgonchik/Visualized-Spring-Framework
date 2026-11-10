package com.visualsb.web;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
class WebReportRunner implements CommandLineRunner {

    @Override
    public void run(String... args) {
        System.out.println();
        System.out.println("================ ПУТЬ HTTP-ЗАПРОСА ================");
        System.out.println("curl http://localhost:8080/api/hello");
        System.out.println("curl http://localhost:8080/internal/trace");
        System.out.println("Ожидаемый порядок:");
        System.out.println("filter.before -> preHandle -> controller");
        System.out.println("-> postHandle -> afterCompletion -> filter.after");
        System.out.println("DispatcherServlet: doDispatch; JSON: MappingJackson2HttpMessageConverter");
        System.out.println("Сервер остаётся запущенным. Остановка: Ctrl+C.");
        System.out.println("===================================================");
    }
}
