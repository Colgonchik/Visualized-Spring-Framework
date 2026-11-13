package com.visualsb.validation;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ValidationApplicationTests {

    @Autowired
    private Validator validator;

    @Test
    void validRequestPassesWithoutViolations() {
        RegistrationRequest request = new RegistrationRequest(
                "neo", "neo@matrix.io", "WakeUp2026", 30,
                new Address("Москва", "101000"));

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void invalidRequestReportsEveryBrokenConstraint() {
        RegistrationRequest request = new RegistrationRequest(
                "ne", "not-an-email", "weak", 12,
                new Address("", "123"));

        Set<String> paths = validator.validate(request).stream()
                .map(violation -> violation.getPropertyPath().toString())
                .collect(Collectors.toSet());

        assertThat(paths).containsExactlyInAnyOrder(
                "username", "email", "password", "age",
                "address.city", "address.zipCode");
    }

    @Test
    void nestedObjectIsValidatedThroughValidCascade() {
        RegistrationRequest request = new RegistrationRequest(
                "neo", "neo@matrix.io", "WakeUp2026", 30,
                new Address("", "123"));

        Set<ConstraintViolation<RegistrationRequest>> violations = validator.validate(request);

        assertThat(violations)
                .anySatisfy(violation -> {
                    assertThat(violation.getPropertyPath()).hasToString("address.city");
                    assertThat(violation.getMessage()).isEqualTo("город обязателен");
                });
    }

    @Test
    void customConstraintRejectsWeakPasswords() {
        assertThat(violationsOnPassword("short")).isNotEmpty();
        assertThat(violationsOnPassword("nodigitsHere")).isNotEmpty();
        assertThat(violationsOnPassword("lower1case")).isNotEmpty();
        assertThat(violationsOnPassword("StrongPass1")).isEmpty();
    }

    private Set<ConstraintViolation<RegistrationRequest>> violationsOnPassword(String password) {
        return validator.validate(new RegistrationRequest(
                "neo", "neo@matrix.io", password, 30,
                new Address("Москва", "101000")));
    }
}
