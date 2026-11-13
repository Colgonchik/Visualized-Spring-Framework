package com.visualsb.lombok;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * {@code @Getter}/{@code @Setter} на уровне класса — Lombok генерирует
 * accessors для всех полей, поэтому {@code @ConfigurationProperties} работает
 * без единого написанного сеттера.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "demo.user")
public class UserAccountProperties {

    private String username = "neo";
    private String email = "neo@matrix.io";
    private int age = 30;
}
