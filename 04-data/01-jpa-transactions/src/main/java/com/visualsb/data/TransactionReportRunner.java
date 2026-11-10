package com.visualsb.data;

import org.springframework.aop.support.AopUtils;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
class TransactionReportRunner implements CommandLineRunner {

    private final NoteService service;
    private final NoteRepository repository;

    TransactionReportRunner(NoteService service, NoteRepository repository) {
        this.service = service;
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        System.out.println();
        System.out.println("================ JPA И ТРАНЗАКЦИИ ================");
        System.out.println("NoteRepository — интерфейс, реализация: " + repository.getClass().getName());
        System.out.println("NoteService — AOP-прокси: " + AopUtils.isAopProxy(service));
        System.out.println("До save(): count = " + repository.count());
        service.save("сохранённая записка");
        System.out.println("После commit: count = " + repository.count());
        try {
            service.saveThenFail("эта записка исчезнет");
        } catch (IllegalStateException exception) {
            System.out.println("Поймали: " + exception.getMessage());
        }
        System.out.println("После rollback: count = " + repository.count());
        System.out.println("DDL/SQL генерирует Hibernate; H2 хранит данные только в памяти.");
        System.out.println("=================================================");
    }
}
