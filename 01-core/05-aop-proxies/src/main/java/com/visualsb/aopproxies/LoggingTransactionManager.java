package com.visualsb.aopproxies;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.stereotype.Component;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;
import org.springframework.transaction.TransactionDefinition;

@Component
public class LoggingTransactionManager extends AbstractPlatformTransactionManager {

    private final List<String> events = new CopyOnWriteArrayList<>();

    @Override
    protected Object doGetTransaction() {
        return new Object();
    }

    @Override
    protected void doBegin(Object transaction, TransactionDefinition definition) {
        events.add("begin");
        System.out.println(">>> [tx] BEGIN");
    }

    @Override
    protected void doCommit(DefaultTransactionStatus status) {
        events.add("commit");
        System.out.println(">>> [tx] COMMIT");
    }

    @Override
    protected void doRollback(DefaultTransactionStatus status) {
        events.add("rollback");
        System.out.println(">>> [tx] ROLLBACK");
    }

    public List<String> events() {
        return List.copyOf(events);
    }

    public void clear() {
        events.clear();
    }
}
