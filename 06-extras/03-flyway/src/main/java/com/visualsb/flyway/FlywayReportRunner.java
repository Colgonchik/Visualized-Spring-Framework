package com.visualsb.flyway;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class FlywayReportRunner implements CommandLineRunner {

    private final Flyway flyway;
    private final JdbcTemplate jdbc;

    public FlywayReportRunner(Flyway flyway, JdbcTemplate jdbc) {
        this.flyway = flyway;
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        MigrationInfo[] applied = flyway.info().applied();
        Integer users = jdbc.queryForObject("SELECT COUNT(*) FROM users", Integer.class);

        System.out.println();
        System.out.println("================ FLYWAY: СХЕМА ПОД ВЕРСИОННЫМ КОНТРОЛЕМ ================");
        System.out.println("Применённые миграции (flyway.info().applied()):");
        for (MigrationInfo info : applied) {
            System.out.printf("  V%s | %s | checksum=%s | %s | %d мс%n",
                    info.getVersion(), info.getDescription(), info.getChecksum(),
                    info.getState(), info.getExecutionTime());
        }
        System.out.println();
        System.out.println("Строк в users после миграций: " + users);
        System.out.println("Таблица flyway_schema_history (её ведёт сам Flyway):");
        jdbc.query("SELECT \"version\", \"description\", \"success\" FROM \"flyway_schema_history\" ORDER BY \"installed_rank\"",
                        (rs, rowNum) -> String.format("  V%s | %s | success=%s",
                                rs.getString("version"), rs.getString("description"), rs.getBoolean("success")))
                .forEach(System.out::println);
        System.out.println();
        System.out.println("При повторном старте Flyway сверит checksum'ы и не станет");
        System.out.println("применять миграции заново — попробуйте запустить ещё раз.");
        System.out.println("======================================================================");
    }
}
