package com.visualsb.web;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class RequestTrace {

    private final CopyOnWriteArrayList<String> events = new CopyOnWriteArrayList<>();

    public void record(String event) {
        events.add(event);
    }

    public List<String> entries() {
        return List.copyOf(events);
    }

    public void clear() {
        events.clear();
    }
}
