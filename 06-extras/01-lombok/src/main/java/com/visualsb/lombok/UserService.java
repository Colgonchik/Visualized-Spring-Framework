package com.visualsb.lombok;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * {@code @RequiredArgsConstructor} генерирует конструктор из final-полей —
 * это и есть конструктор для внедрения зависимостей, писать его руками не нужно.
 * {@code @Slf4j} генерирует поле {@code log}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserAccountProperties properties;

    public UserAccount defaultAccount() {
        log.info("Собираю аккаунт по умолчанию через сгенерированный builder");
        return UserAccount.builder()
                .id(1L)
                .username(properties.getUsername())
                .email(properties.getEmail())
                .age(properties.getAge())
                .build();
    }
}
