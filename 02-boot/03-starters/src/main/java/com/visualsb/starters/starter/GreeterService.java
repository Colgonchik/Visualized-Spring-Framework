package com.visualsb.starters.starter;

public class GreeterService {

    private final GreeterProperties properties;

    public GreeterService(GreeterProperties properties) {
        this.properties = properties;
    }

    public String greet() {
        return properties.getMessage() + ", " + properties.getName() + "!";
    }
}
