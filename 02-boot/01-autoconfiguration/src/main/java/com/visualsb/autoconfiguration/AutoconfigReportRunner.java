package com.visualsb.autoconfiguration;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class AutoconfigReportRunner implements CommandLineRunner {

    private static final String IMPORTS_PATH =
            "META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports";

    private final ApplicationContext context;
    private final ObjectMapper objectMapper;

    public AutoconfigReportRunner(ApplicationContext context, ObjectMapper objectMapper) {
        this.context = context;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        List<String> autoConfigs = readAutoConfigImports();

        System.out.println();
        System.out.println("================ АВТОКОНФИГУРАЦИЯ ================");
        System.out.println("Классов в списке AutoConfiguration.imports: " + autoConfigs.size());
        System.out.println("Примеры из списка:");
        autoConfigs.stream().limit(3).forEach(name -> System.out.println("  " + name));

        System.out.println();
        System.out.println("Бины типа ObjectMapper: "
                + Arrays.toString(context.getBeanNamesForType(ObjectMapper.class)));
        System.out.println("jacksonObjectMapper (от автоконфигурации) в контексте: "
                + context.containsBean("jacksonObjectMapper"));
        System.out.println("Наш objectMapper с INDENT_OUTPUT? "
                + objectMapper.isEnabled(com.fasterxml.jackson.databind.SerializationFeature.INDENT_OUTPUT));
        System.out.println("Сериализация нашим маппером:");
        System.out.println(objectMapper.writeValueAsString(
                Map.of("module", "autoconfiguration", "magic", "разоблачена")));
        System.out.println("=================================================");
    }

    static List<String> readAutoConfigImports() throws Exception {
        try (InputStream in = AutoconfigReportRunner.class.getClassLoader().getResourceAsStream(IMPORTS_PATH)) {
            if (in == null) {
                throw new IllegalStateException("Файл " + IMPORTS_PATH + " не найден в classpath");
            }
            return new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8)).lines()
                    .map(String::trim)
                    .filter(line -> !line.isEmpty() && !line.startsWith("#"))
                    .toList();
        }
    }
}
