package com.visualsb.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
class HelloController {

    private final RequestTrace trace;

    HelloController(RequestTrace trace) {
        this.trace = trace;
    }

    @GetMapping("/api/hello")
    Greeting hello(@RequestParam(defaultValue = "Spring MVC") String name) {
        trace.record("3. controller");
        return new Greeting("Привет, " + name + "!");
    }

    @GetMapping("/internal/trace")
    List<String> trace() {
        return trace.entries();
    }

    record Greeting(String message) {
    }
}
