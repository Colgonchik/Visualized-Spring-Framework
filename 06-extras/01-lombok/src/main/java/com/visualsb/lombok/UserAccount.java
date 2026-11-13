package com.visualsb.lombok;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/**
 * Весь «механический» код этого класса генерирует Lombok на этапе компиляции:
 * getters, setters, equals, hashCode, toString, конструкторы и builder.
 * Руками написанный эквивалент — {@link com.visualsb.lombok.plain.UserAccountPlain}.
 */
@Data
@Builder
@AllArgsConstructor
public class UserAccount {

    private Long id;
    private String username;
    private String email;
    private int age;
}
