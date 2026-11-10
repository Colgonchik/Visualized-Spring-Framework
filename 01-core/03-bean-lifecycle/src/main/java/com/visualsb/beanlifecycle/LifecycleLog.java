package com.visualsb.beanlifecycle;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.stereotype.Component;

@Component
public class LifecycleLog {

    private final List<String> events = new CopyOnWriteArrayList<>();

    public void add(String event) {
        events.add(event);
    }

    public List<String> events() {
        return List.copyOf(events);
    }
}
