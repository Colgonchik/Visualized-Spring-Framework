# Протокол разведки: команды по фазам

## Фаза 1. Первичная разведка

```bash
ls                      # корневые файлы
cat pom.xml | head -50  # артефакт, parent, модули, java.version
cat README.md           # заявленное назначение
find . -name "application*.properties" -o -name "application*.yml"
```

## Фаза 2. Карта структуры

```bash
find src -type d | sort                       # пакеты
find src -name "*.java" | sort                # все классы с путями
find src -name "*.java" | wc -l               # количество классов
```

## Фаза 3. Точки входа

```bash
grep -rn "public static void main" src/
grep -rn "@SpringBootApplication\|@ComponentScan\|@EnableAutoConfiguration" src/
grep -rn "CommandLineRunner\|ApplicationRunner" src/
```

## Фаза 4. Анализ зависимостей

```bash
cat <module>/pom.xml                    # зависимости и scope
mvn -q dependency:tree -Dincludes=groupId:artifactId   # конкретная ветка дерева
```

Что фиксировать: стартеры (что привлекают транзитивно), тестовые зависимости, управление версиями (parent BOM).

## Фаза 5. Определение паттерна

```bash
grep -rln "@Configuration\|@Bean" src/main/java/     # явная конфигурация
grep -rln "@Component\|@Service\|@Repository" src/main/java/  # сканируемые бины
grep -rln "PostProcessor\|Aware\b" src/main/java/    # точки расширения
```

Классифицируй по таблице паттернов из SKILL.md, подкрепив каждый вывод путём к файлу.
