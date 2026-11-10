package com.visualsb.beanpostprocessor;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;

public class LoggingInvocationHandler implements InvocationHandler {

    private final Object target;

    public LoggingInvocationHandler(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        long start = System.nanoTime();
        System.out.println(">>> [proxy] вызов " + method.getName() + "()");
        Object result = method.invoke(target, args);
        System.out.println(">>> [proxy] завершён за " + (System.nanoTime() - start) / 1_000 + " мкс");
        return result;
    }
}
