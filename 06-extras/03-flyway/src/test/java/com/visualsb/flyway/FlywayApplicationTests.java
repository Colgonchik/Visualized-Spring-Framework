package com.visualsb.flyway;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class FlywayApplicationTests {

    @Autowired
    private Flyway flyway;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void bothMigrationsAreAppliedInOrder() {
        assertThat(flyway.info().applied())
                .hasSize(2)
                .allSatisfy(info -> assertThat(info.getState().isApplied()).isTrue());

        assertThat(flyway.info().applied()[0].getVersion().getVersion()).isEqualTo("1");
        assertThat(flyway.info().applied()[1].getVersion().getVersion()).isEqualTo("2");
    }

    @Test
    void seededDataIsPresent() {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
        String firstUser = jdbc.queryForObject(
                "SELECT username FROM users ORDER BY id LIMIT 1", String.class);

        assertThat(count).isEqualTo(3);
        assertThat(firstUser).isEqualTo("neo");
    }

    @Test
    void checksumsAreRecordedAndValidationPasses() {
        assertThat(flyway.validateWithResult().validationSuccessful).isTrue();
        assertThat(flyway.info().applied())
                .allSatisfy(info -> assertThat(info.getChecksum()).isNotNull());
    }
}
