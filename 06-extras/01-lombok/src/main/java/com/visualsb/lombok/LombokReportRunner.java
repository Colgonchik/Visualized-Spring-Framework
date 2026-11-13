package com.visualsb.lombok;

import com.visualsb.lombok.plain.UserAccountPlain;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class LombokReportRunner implements CommandLineRunner {

    private final UserService userService;

    public LombokReportRunner(UserService userService) {
        this.userService = userService;
    }

    @Override
    public void run(String... args) {
        UserAccount account = userService.defaultAccount();
        UserAccountPlain plain = UserAccountPlain.builder()
                .id(1L)
                .username("neo")
                .email("neo@matrix.io")
                .age(30)
                .build();

        System.out.println();
        System.out.println("================ LOMBOK: КОД БЕЗ РУКАМИ НАПИСАННОГО BOILERPLATE ================");
        System.out.println("@Data + @Builder на UserAccount:     ~15 строк в исходнике");
        System.out.println("Тот же класс руками (plain-пакет):   ~130 строк");
        System.out.println();
        System.out.println("Сгенерированный builder:   " + account);
        System.out.println("getUsername():             " + account.getUsername());
        System.out.println("equals() с копией:         "
                + account.equals(UserAccount.builder().id(1L).username("neo").email("neo@matrix.io").age(30).build()));
        System.out.println("hashCode() стабилен:       " + (account.hashCode() == account.hashCode()));
        System.out.println();
        System.out.println("@RequiredArgsConstructor в UserService: зависимость внедрена -> "
                + account.getEmail());
        System.out.println("Рукописный эквивалент ведёт себя так же: " + plain);
        System.out.println();
        System.out.println("Lombok работает на этапе компиляции (APT): в runtime его нет,");
        System.out.println("никакой рефлексии — в .class лежит обычный Java-код.");
        System.out.println("Посмотреть сгенерированное: mvn compile, затем javap target/classes/.../UserAccount.class");
        System.out.println("===============================================================================");
    }
}
