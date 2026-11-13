package com.visualsb.lombok.plain;

import java.util.Objects;

/**
 * Тот же класс, что {@link com.visualsb.lombok.UserAccount}, но без Lombok:
 * весь boilerplate написан руками. Именно этот код Lombok подставляет
 * на этапе компиляции — сравните объём обоих файлов.
 */
public class UserAccountPlain {

    private Long id;
    private String username;
    private String email;
    private int age;

    public UserAccountPlain() {
    }

    public UserAccountPlain(Long id, String username, String email, int age) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.age = age;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof UserAccountPlain that)) {
            return false;
        }
        return age == that.age
                && Objects.equals(id, that.id)
                && Objects.equals(username, that.username)
                && Objects.equals(email, that.email);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, username, email, age);
    }

    @Override
    public String toString() {
        return "UserAccountPlain(id=" + id
                + ", username=" + username
                + ", email=" + email
                + ", age=" + age + ")";
    }

    public static class Builder {

        private Long id;
        private String username;
        private String email;
        private int age;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder username(String username) {
            this.username = username;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder age(int age) {
            this.age = age;
            return this;
        }

        public UserAccountPlain build() {
            return new UserAccountPlain(id, username, email, age);
        }
    }
}
