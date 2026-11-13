package com.visualsb.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Собственное ограничение. Логика проверки живёт в {@link StrongPasswordValidator};
 * аннотация — только декларация и сообщение по умолчанию.
 */
@Documented
@Constraint(validatedBy = StrongPasswordValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface StrongPassword {

    String message() default "пароль: минимум 8 символов, хотя бы одна цифра и заглавная буква";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
