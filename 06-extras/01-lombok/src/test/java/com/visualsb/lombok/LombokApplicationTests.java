package com.visualsb.lombok;

import com.visualsb.lombok.plain.UserAccountPlain;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class LombokApplicationTests {

    @Autowired
    private UserService userService;

    @Test
    void generatedBuilderGettersAndToStringWork() {
        UserAccount account = userService.defaultAccount();

        assertThat(account.getId()).isEqualTo(1L);
        assertThat(account.getUsername()).isEqualTo("neo");
        assertThat(account.getEmail()).isEqualTo("neo@matrix.io");
        assertThat(account.getAge()).isEqualTo(30);
        assertThat(account.toString())
                .contains("username=neo")
                .contains("email=neo@matrix.io");
    }

    @Test
    void generatedEqualsAndHashCodeFollowContract() {
        UserAccount first = UserAccount.builder().id(1L).username("neo").email("neo@matrix.io").age(30).build();
        UserAccount same = UserAccount.builder().id(1L).username("neo").email("neo@matrix.io").age(30).build();
        UserAccount different = UserAccount.builder().id(2L).username("trinity").email("trinity@matrix.io").age(29).build();

        assertThat(first).isEqualTo(same).hasSameHashCodeAs(same);
        assertThat(first).isNotEqualTo(different);
    }

    @Test
    void handwrittenEquivalentBehavesTheSame() {
        UserAccount lombok = userService.defaultAccount();
        UserAccountPlain plain = UserAccountPlain.builder()
                .id(1L).username("neo").email("neo@matrix.io").age(30)
                .build();

        assertThat(plain.getUsername()).isEqualTo(lombok.getUsername());
        assertThat(plain.getEmail()).isEqualTo(lombok.getEmail());
        assertThat(plain.getAge()).isEqualTo(lombok.getAge());
        assertThat(plain).isEqualTo(UserAccountPlain.builder()
                .id(1L).username("neo").email("neo@matrix.io").age(30).build());
    }
}
