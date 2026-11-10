package com.visualsb.beandefinition.service;

import org.springframework.stereotype.Component;

@Component
public class ExpensiveService {

    public ExpensiveService() {
        System.out.println(">>> ExpensiveService: конструктор вызван, экземпляр создан");
    }

    public String work() {
        return "работа выполнена";
    }
}
