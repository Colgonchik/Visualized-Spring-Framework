# Visual SB — магия Spring Framework под капотом

Учебный проект, показывающий, как на самом деле работает Spring: от сканирования классов до автоконфигурации и прокси. Каждый модуль — это **запускаемый пример + диаграммы + трассировка по исходникам Spring**.

## Как читать модули

Каждый модуль устроен двухслойно — для разного уровня подготовки:

- **«Концепция»** — одна схема и простое объяснение без кода Spring. Читается за 3 минуты.
- **«Под капотом»** — точки останова в исходниках Spring, стек вызовов, что наблюдать в дебаггере.

Новичок читает верх и запускает пример. Опытный сразу ныряет в трассировку.

## Карта тем

Статусы: ✅ готов · 🚧 в работе · ⬜ запланирован

### v1 — Core

| Модуль | Тема | Статус |
|---|---|---|
| [01-core/01-component-scan](01-core/01-component-scan/) | Как `@ComponentScan` находит ваши классы | ✅ |
| [01-core/02-bean-definition](01-core/02-bean-definition/) | Метаданные бина до создания объекта | ✅ |
| [01-core/03-bean-lifecycle](01-core/03-bean-lifecycle/) | instantiate → populate → init → готовый бин | ✅ |
| [01-core/04-beanpostprocessor](01-core/04-beanpostprocessor/) | Точки расширения, где живёт магия | ✅ |
| [01-core/05-aop-proxies](01-core/05-aop-proxies/) | `@Transactional`: JDK vs CGLIB, почему `this`-вызов ломает прокси | ✅ |

### v1 — Boot

| Модуль | Тема | Статус |
|---|---|---|
| [02-boot/01-autoconfiguration](02-boot/01-autoconfiguration/) | Как `@SpringBootApplication` молча собирает приложение | ✅ |
| [02-boot/02-conditional](02-boot/02-conditional/) | `@ConditionalOn...`: условия создания бинов | ✅ |
| [02-boot/03-starters](02-boot/03-starters/) | Как устроен starter и как написать свой | ✅ |
| [02-boot/04-conditions-report](02-boot/04-conditions-report/) | Чтение Actuator conditions report | ✅ |

### v2 — Web, Data, Security

| Модуль | Тема | Статус |
|---|---|---|
| [03-web/01-dispatcher-servlet](03-web/01-dispatcher-servlet/) | Путь HTTP-запроса через Spring MVC | ✅ |
| [04-data/01-jpa-transactions](04-data/01-jpa-transactions/) | Proxy репозитория, commit и rollback | ✅ |
| [05-security/01-filter-chain](05-security/01-filter-chain/) | Аутентификация и авторизация в цепочке фильтров | ✅ |

## Требования

- JDK 17+
- Maven 3.9+ (подойдёт Maven, встроенный в IntelliJ IDEA)

## Запуск

Из корня репозитория:

```bash
# прогнать тесты всех модулей
mvn test

# запустить конкретный модуль
mvn -pl 01-core/01-component-scan spring-boot:run
```

Или из папки модуля:

```bash
cd 01-core/01-component-scan
mvn spring-boot:run
mvn test
```

## Скиллы Kimi Code

В `.kimi-code/skills/` лежат проектные скиллы — они автоматически подхватываются Kimi Code CLI при открытии репозитория (новая сессия) и попадают в git вместе с проектом:

| Скилл | Назначение |
|---|---|
| `verification` | 6 шагов проверки «готово ли» доказательствами перед завершением задачи |
| `exploration` | Протокол разведки незнакомого модуля (структура, точки входа, зависимости) |
| `skill-creator` | Как писать новые скиллы проекта по единому шаблону |

Адаптировано из [Fusengine/kimi-code](https://github.com/fusengine/kimi-code) (MIT) под задачи этого репозитория.

## Принципы проекта

- **Один модуль = одна идея.** Пример ≤ ~200 строк кода.
- **Каждый модуль запускается и покрыт тестом.** Не работает — не публикуем.
- **Магия показывается инструментами самого Spring:** логи, Actuator, дебаг в исходниках.
- **Единый шаблон README** во всех модулях: концепция → запуск → под капотом → эксперименты.
