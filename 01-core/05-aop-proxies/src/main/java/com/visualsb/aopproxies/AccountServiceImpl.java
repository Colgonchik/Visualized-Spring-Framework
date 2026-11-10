package com.visualsb.aopproxies;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountServiceImpl implements AccountService {

    @Override
    @Transactional
    public String transfer(String from, String to) {
        return "перевод " + from + " -> " + to + " выполнен";
    }

    @Override
    @Transactional
    public String failingOperation() {
        throw new IllegalStateException("имитация сбоя внутри транзакции");
    }

    @Override
    public String selfCallDemo() {
        return this.transfer("a", "b");
    }
}
