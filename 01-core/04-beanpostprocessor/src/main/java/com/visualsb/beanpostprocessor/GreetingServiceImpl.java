package com.visualsb.beanpostprocessor;

import org.springframework.stereotype.Component;

@Logged
@Component
public class GreetingServiceImpl implements GreetingService {

    @Override
    public String greet(String name) {
        return "Привет, " + name + "!";
    }
}
