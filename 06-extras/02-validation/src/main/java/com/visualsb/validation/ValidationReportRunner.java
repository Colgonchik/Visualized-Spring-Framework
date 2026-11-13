package com.visualsb.validation;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class ValidationReportRunner implements CommandLineRunner {

    private final Validator validator;

    public ValidationReportRunner(Validator validator) {
        this.validator = validator;
    }

    @Override
    public void run(String... args) {
        RegistrationRequest valid = new RegistrationRequest(
                "neo", "neo@matrix.io", "WakeUp2026", 30,
                new Address("Москва", "101000"));

        RegistrationRequest invalid = new RegistrationRequest(
                "ne", "not-an-email", "weak", 12,
                new Address("", "123"));

        System.out.println();
        System.out.println("================ BEAN VALIDATION: ДАННЫЕ ПОД КОНТРОЛЕМ ================");
        report("Валидный запрос", validator.validate(valid));
        report("Невалидный запрос", validator.validate(invalid));
        System.out.println();
        System.out.println("Validator здесь — автоконфигурированный LocalValidatorFactoryBean");
        System.out.println("(spring-boot-starter-validation). В веб-приложении тот же механизм");
        System.out.println("включается аннотацией @Valid на аргументе контроллера — модуль 03-web.");
        System.out.println("======================================================================");
    }

    private void report(String label, Set<ConstraintViolation<RegistrationRequest>> violations) {
        System.out.println(label + ": " + violations.size() + " нарушений");
        violations.stream()
                .map(v -> "  " + v.getPropertyPath() + " -> " + v.getMessage())
                .sorted()
                .forEach(System.out::println);
    }
}
