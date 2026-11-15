# Visual SB — магия Spring Framework под капотом

Учебный проект, показывающий, как на самом деле работает Spring: от сканирования классов до автоконфигурации и прокси. Каждый модуль — это **запускаемый пример + диаграммы + трассировка по исходникам Spring**.

**🌐 Живая версия: [colgonchik.github.io/Visualized-Spring-Framework](https://colgonchik.github.io/Visualized-Spring-Framework/)** — все модули превращены в интерактивные сцены: редактируемый граф, условия, журнал, UML-диаграмма и фрагменты реального Java-кода.

## Как читать модули

Каждый модуль устроен двухслойно — для разного уровня подготовки:

- **«Концепция»** — одна схема и простое объяснение без кода Spring. Читается за 3 минуты.
- **«Под капотом»** — точки останова в исходниках Spring, стек вызовов, что наблюдать в дебаггере.

Новичок читает верх и запускает пример. Опытный сразу ныряет в трассировку.

## Карта тем

Каждый модуль дублируется интерактивной сценой на [сайте проекта](https://colgonchik.github.io/Visualized-Spring-Framework/) — колонка «Сцена».

### v1 — Core

| Модуль | Тема | Статус | Сцена |
|---|---|---|---|
| [01-core/01-component-scan](01-core/01-component-scan/) | Как `@ComponentScan` находит ваши классы | ✅ | [🌐](https://colgonchik.github.io/Visualized-Spring-Framework/#scan) |
| [01-core/02-bean-definition](01-core/02-bean-definition/) | Метаданные бина до создания объекта | ✅ | [🌐](https://colgonchik.github.io/Visualized-Spring-Framework/#definition) |
| [01-core/03-bean-lifecycle](01-core/03-bean-lifecycle/) | instantiate → populate → init → готовый бин | ✅ | [🌐](https://colgonchik.github.io/Visualized-Spring-Framework/#lifecycle) |
| [01-core/04-beanpostprocessor](01-core/04-beanpostprocessor/) | Точки расширения, где живёт магия | ✅ | [🌐](https://colgonchik.github.io/Visualized-Spring-Framework/#postprocessor) |
| [01-core/05-aop-proxies](01-core/05-aop-proxies/) | `@Transactional`: JDK vs CGLIB, почему `this`-вызов ломает прокси | ✅ | [🌐](https://colgonchik.github.io/Visualized-Spring-Framework/#proxies) |

### v1 — Boot

| Модуль | Тема | Статус | Сцена |
|---|---|---|---|
| [02-boot/01-autoconfiguration](02-boot/01-autoconfiguration/) | Как `@SpringBootApplication` молча собирает приложение | ✅ | [🌐](https://colgonchik.github.io/Visualized-Spring-Framework/#autoconfig) |
| [02-boot/02-conditional](02-boot/02-conditional/) | `@ConditionalOn...`: условия создания бинов | ✅ | [🌐](https://colgonchik.github.io/Visualized-Spring-Framework/#conditions) |
| [02-boot/03-starters](02-boot/03-starters/) | Как устроен starter и как написать свой | ✅ | [🌐](https://colgonchik.github.io/Visualized-Spring-Framework/#boot) |
| [02-boot/04-conditions-report](02-boot/04-conditions-report/) | Чтение Actuator conditions report | ✅ | [🌐](https://colgonchik.github.io/Visualized-Spring-Framework/#report) |

### v2 — Web, Data, Security

| Модуль | Тема | Статус | Сцена |
|---|---|---|---|
| [03-web/01-dispatcher-servlet](03-web/01-dispatcher-servlet/) | Путь HTTP-запроса через Spring MVC | ✅ | [🌐](https://colgonchik.github.io/Visualized-Spring-Framework/#request) |
| [04-data/01-jpa-transactions](04-data/01-jpa-transactions/) | Proxy репозитория, commit и rollback | ✅ | [🌐](https://colgonchik.github.io/Visualized-Spring-Framework/#request) |
| [05-security/01-filter-chain](05-security/01-filter-chain/) | Аутентификация и авторизация в цепочке фильтров | ✅ | [🌐](https://colgonchik.github.io/Visualized-Spring-Framework/#request) |

### v3 — Extras: экосистема зависимостей

| Модуль | Тема | Статус | Сцена |
|---|---|---|---|
| [06-extras/01-lombok](06-extras/01-lombok/) | Код, которого нет в исходниках: APT, builder, getters | ✅ | [🌐](https://colgonchik.github.io/Visualized-Spring-Framework/#lombok) |
| [06-extras/02-validation](06-extras/02-validation/) | Bean Validation: ограничения, каскад `@Valid`, свой валидатор | ✅ | [🌐](https://colgonchik.github.io/Visualized-Spring-Framework/#validation) |
| [06-extras/03-flyway](06-extras/03-flyway/) | Миграции схемы: версии, `flyway_schema_history`, checksum | ✅ | [🌐](https://colgonchik.github.io/Visualized-Spring-Framework/#flyway) |

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

## Интерактивный сайт

**Опубликован на GitHub Pages: [colgonchik.github.io/Visualized-Spring-Framework](https://colgonchik.github.io/Visualized-Spring-Framework/)** — открывается прямо из браузера, деплоится автоматически из `main` через [GitHub Actions](.github/workflows/site-pages.yml).

В `site/` находится визуальная лаборатория на React + Vite. Она не дублирует README, а превращает все 15 учебных модулей — от component scan до AOP-прокси, conditions report и миграций Flyway — в 13 интерактивных сцен: редактируемый граф, условия, журнал, UML-диаграмма последовательности и фрагменты реального Java-кода. Боковые колонки можно сворачивать и растягивать перетаскиванием разделителей.

```bash
cd site
npm install
npm run dev
```

Откройте `http://127.0.0.1:5173`. Проверка сайта: `npm test`, `npm run build` и `npm run test:e2e`; подробности — в [site/README.md](site/README.md).

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
