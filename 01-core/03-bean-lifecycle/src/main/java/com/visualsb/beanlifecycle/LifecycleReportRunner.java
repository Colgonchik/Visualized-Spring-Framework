package com.visualsb.beanlifecycle;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class LifecycleReportRunner implements CommandLineRunner {

    private final LifeCycleBean lifeCycleBean;

    public LifecycleReportRunner(LifeCycleBean lifeCycleBean) {
        this.lifeCycleBean = lifeCycleBean;
    }

    @Override
    public void run(String... args) {
        System.out.println();
        System.out.println("=== КОНТЕКСТ ГОТОВ: " + lifeCycleBean.hello());
        System.out.println("События 1–8 выше произошли ДО готовности контекста.");
        System.out.println("При завершении JVM сработают @PreDestroy -> destroy -> customDestroy (строки ниже).");
        System.out.println();
    }
}
