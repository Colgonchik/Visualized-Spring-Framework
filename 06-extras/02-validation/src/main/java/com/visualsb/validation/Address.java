package com.visualsb.validation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Вложенный объект. Его ограничения проверяются только потому,
 * что поле {@code address} в {@link RegistrationRequest} помечено {@code @Valid}.
 */
public record Address(

        @NotBlank(message = "город обязателен")
        String city,

        @Pattern(regexp = "\\d{6}", message = "индекс: ровно 6 цифр")
        String zipCode
) {
}
