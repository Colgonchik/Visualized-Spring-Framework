# 01. Lombok: код, которого нет в исходниках

**Что показывает модуль:** как одна аннотация `@Data` заменяет ~100 строк механического кода, где именно появляется этот код (подсказка: не в runtime) и почему Lombok — это компиляторный плагин, а не магия с рефлексией. Рядом лежит тот же класс, написанный руками, — для сравнения построчно.

---

## Концепция

Класс с полями требует getters, setters, `equals`, `hashCode`, `toString`, конструкторы и builder. Всё это Java заставляет писать руками — или генерировать в IDE, после чего код надо поддерживать. Lombok переносит генерацию на этап компиляции:

```mermaid
flowchart LR
    A["UserAccount.java<br/>15 строк + аннотации"] --> B["javac + Lombok<br/>annotation processing"]
    B --> C["Изменённое синтаксическое дерево<br/>методы появились ДО генерации байткода"]
    C --> D["UserAccount.class<br/>обычный байткод, следов Lombok нет"]
```

Ключевое отличие от «волшебных» аннотаций Spring: Spring обрабатывает аннотации в runtime (прокси, постпроцессоры — модули 01-core), а Lombok — **во время компиляции**. В runtime Lombok не существует: ни зависимости, ни рефлексии, ни накладных расходов.

В модуле два параллельных класса:

- `UserAccount` — `@Data @Builder @AllArgsConstructor`, 15 строк;
- `plain/UserAccountPlain` — тот же контракт руками, ~130 строк.

Тест проверяет, что оба ведут себя одинаково.

## Запуск

```bash
mvn spring-boot:run
```

```text
================ LOMBOK: КОД БЕЗ РУКАМИ НАПИСАННОГО BOILERPLATE ================
@Data + @Builder на UserAccount:     ~15 строк в исходнике
Тот же класс руками (plain-пакет):   ~130 строк

Сгенерированный builder:   UserAccount(id=1, username=neo, email=neo@matrix.io, age=30)
getUsername():             neo
equals() с копией:         true
hashCode() стабилен:       true

@RequiredArgsConstructor в UserService: зависимость внедрена -> neo@matrix.io
Рукописный эквивалент ведёт себя так же: UserAccountPlain(id=1, username=neo, email=neo@matrix.io, age=30)
===============================================================================
```

## Тест

```bash
mvn test
```

Три теста: сгенерированные builder/getters/toString работают; `equals`/`hashCode` соблюдают контракт; рукописный эквивалент ведёт себя так же.

## Под капотом

Spring Boot 3.5.x, Lombok (версия управляется родительским BOM Spring Boot). Точки останова — по классу и методу.

### Как аннотация становится байткодом

`javac` разбирает исходник в синтаксическое дерево (AST), затем запускает annotation processors. Lombok регистрируется как процессор (`lombok.launch.AnnotationProcessorHider`), но вместо генерации новых файлов **изменяет уже построенное дерево**: достраивает методы и конструкторы прямо в AST. Дальше компилятор генерирует байткод из изменённого дерева — поэтому в `.class` лежит обычный Java-код.

Убедиться самому:

```bash
mvn compile
javap -p target/classes/com/visualsb/lombok/UserAccount.class
```

`javap` покажет все сгенерированные методы: `getUsername()`, `equals(Object)`, `builder()` и вложенный класс `UserAccount$Builder`.

| Аннотация | Что сгенерировано |
|---|---|
| `@Data` | getters, setters, `toString`, `equals`, `hashCode`, конструктор обязательных полей |
| `@Builder` | статический `builder()`, вложенный класс `Builder`, `build()` |
| `@AllArgsConstructor` | конструктор со всеми полями (нужен `@Builder`) |
| `@RequiredArgsConstructor` | конструктор из `final`-полей — точка внедрения зависимостей в Spring |
| `@Slf4j` | поле `log` типа `org.slf4j.Logger` |
| `@Getter` / `@Setter` | accessors для всех полей класса |

### Почему @RequiredArgsConstructor — главная аннотация для Spring

Spring рекомендует внедрение через конструктор. `@RequiredArgsConstructor` генерирует конструктор из всех `final`-полей, поэтому сервис выглядит так: поля `final`, ни строчки конструктора. Добавил поле — конструктор обновился сам, контекст не сломается.

### Цена вопроса

- IDE без плагина Lombok подсвечивает вызовы «несуществующих» методов как ошибки — в IntelliJ IDEA плагин встроен и включается автоматически.
- `@Data` на JPA-сущности опасен: `equals`/`hashCode` по всем полям и `toString` с ленивыми коллекциями — частый источник багов. Для сущностей принято писать `@Getter @Setter` точечно.
- `maven-compiler-plugin` в Spring Boot parent уже знает про `annotationProcessorPaths`, но с обычной зависимостью Lombok работает и без явной настройки.

## Эксперименты

1. Уберите `@Builder` из `UserAccount` — тест упадёт на компиляции: builder больше не генерируется.
2. Запустите `javap -p` на обоих классах и сравните список методов — они почти совпадают.
3. Добавьте `@Value` вместо `@Data` на новый класс — получите неизменяемый объект: поля `private final`, только getters.
4. Уберите `@Slf4j` из `UserService` — компиляция сломается на `log.info`, потому что поле `log` генерировала аннотация.

## Ключевые классы

- `lombok.Data` — комбинация `@Getter @Setter @ToString @EqualsAndHashCode @RequiredArgsConstructor`.
- `lombok.Builder` — паттерн builder без рукописного кода.
- `lombok.RequiredArgsConstructor` — конструктор для внедрения зависимостей.
- `lombok.extern.slf4j.Slf4j` — логгер без фабрики.

## Дальше

`02-validation`: аннотации, которые уже работают в runtime, — Bean Validation проверяет данные до того, как они доберутся до бизнес-логики.
