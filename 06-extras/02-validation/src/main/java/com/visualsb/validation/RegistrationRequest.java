package com.visualsb.validation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO регистрации. Ограничения объявлены прямо на компонентах record —
 * Bean Validation читает их с порождённых полей.
 * {@code @Valid} на {@code address} включает каскадную проверку вложенного объекта.
 */
public record RegistrationRequest(

        @NotBlank(message = "имя пользователя обязательно")
        @Size(min = 3, max = 20, message = "имя пользователя: от {min} до {max} символов")
        String username,

        @NotBlank(message = "email обязателен")
        @Email(message = "некорректный email: '${validatedValue}'")
        String email,

        @StrongPassword
        String password,

        @Min(value = 18, message = "регистрация с {value} лет")
        @Max(value = 150, message = "возраст не может превышать {value}")
        int age,

        @NotNull(message = "адрес обязателен")
        @Valid
        Address address
) {
}
