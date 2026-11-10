package com.visualsb.componentscan;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

@SpringBootApplication
@ComponentScan(excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.visualsb\\.componentscan\\.excluded\\..*"))
public class ComponentScanApplication {

    public static void main(String[] args) {
        SpringApplication.run(ComponentScanApplication.class, args);
    }
}
