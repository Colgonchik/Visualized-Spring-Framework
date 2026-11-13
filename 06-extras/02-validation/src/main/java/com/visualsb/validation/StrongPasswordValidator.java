package com.visualsb.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Реализация проверки для {@link StrongPassword}. Валидаторы — обычные классы,
 * их находит Hibernate Validator по ссылке из аннотации, Spring их не создаёт.
 */
public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null) {
            return false;
        }
        boolean longEnough = password.length() >= 8;
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        return longEnough && hasDigit && hasUpper;
    }
}
