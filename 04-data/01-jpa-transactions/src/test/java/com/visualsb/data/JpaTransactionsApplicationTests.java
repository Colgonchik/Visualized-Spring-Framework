package com.visualsb.data;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.aop.support.AopUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.jpa.repository.support.SimpleJpaRepository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class JpaTransactionsApplicationTests {

    @Autowired
    private NoteService service;

    @Autowired
    private NoteRepository repository;

    @BeforeEach
    void cleanDatabase() {
        repository.deleteAll();
    }

    @Test
    void successfulTransactionCommits() {
        Note saved = service.save("commit");

        assertThat(saved.getId()).isNotNull();
        assertThat(repository.findById(saved.getId())).get()
                .extracting(Note::getText).isEqualTo("commit");
    }

    @Test
    void uncheckedExceptionRollsBackInsert() {
        long before = repository.count();

        assertThatThrownBy(() -> service.saveThenFail("rollback"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("откачена");
        assertThat(repository.count()).isEqualTo(before);
    }

    @Test
    void repositoryAndTransactionalServiceAreProxies() {
        assertThat(AopUtils.isAopProxy(service)).isTrue();
        assertThat(repository).isNotInstanceOf(SimpleJpaRepository.class);
        assertThat(repository.getClass().getName()).contains("Proxy");
    }
}
