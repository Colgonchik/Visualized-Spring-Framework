// Фрагменты реального кода из Java-модулей репозитория.
// Ключ: [sceneId][nodeId] — совпадает с узлами из scenes.js.
export const CODE_SNIPPETS = {
  boot: {
    application: {
      file: '02-boot/03-starters/.../StartersApplication.java',
      lang: 'java',
      code: `@SpringBootApplication
public class StartersApplication {

    public static void main(String[] args) {
        SpringApplication.run(StartersApplication.class, args);
    }
}`,
    },
    scan: {
      file: '01-core/01-component-scan/.../ComponentScanApplication.java',
      lang: 'java',
      code: `@SpringBootApplication
@ComponentScan(excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\\\.visualsb\\\\.componentscan\\\\.excluded\\\\..*"))
public class ComponentScanApplication {`,
    },
    imports: {
      file: '02-boot/03-starters/.../META-INF/spring/...AutoConfiguration.imports',
      lang: 'text',
      code: `com.visualsb.starters.starter.GreeterAutoConfiguration`,
    },
    properties: {
      file: '02-boot/03-starters/application.properties',
      lang: 'properties',
      code: `spring.application.name=starters
spring.main.banner-mode=off
visual.greeting.name=Visual SB`,
    },
    auto: {
      file: '02-boot/03-starters/.../GreeterAutoConfiguration.java',
      lang: 'java',
      code: `@AutoConfiguration
@EnableConfigurationProperties(GreeterProperties.class)
@ConditionalOnProperty(prefix = "visual.greeting",
        name = "enabled", havingValue = "true", matchIfMissing = true)
public class GreeterAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public GreeterService greeterService(GreeterProperties properties) {
        return new GreeterService(properties);
    }
}`,
    },
    greeter: {
      file: '02-boot/03-starters/.../GreeterService.java',
      lang: 'java',
      code: `public class GreeterService {

    private final GreeterProperties properties;

    public GreeterService(GreeterProperties properties) {
        this.properties = properties;
    }

    public String greet() {
        return properties.getMessage() + ", " + properties.getName() + "!";
    }
}`,
    },
    custom: {
      file: '02-boot/03-starters/.../StartersApplicationTests.java',
      lang: 'java',
      code: `// Пользовательский @Bean: стартер отступает,
// потому что @ConditionalOnMissingBean видит ваш бин.
private final ApplicationContextRunner contextRunner =
        new ApplicationContextRunner()
            .withConfiguration(
                AutoConfigurations.of(GreeterAutoConfiguration.class));`,
    },
    bpp: {
      file: '01-core/04-beanpostprocessor/.../LoggingPostProcessor.java',
      lang: 'java',
      code: `@Component
public class LoggingPostProcessor implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        Class<?> beanClass = bean.getClass();
        if (!beanClass.isAnnotationPresent(Logged.class)
                || beanClass.getInterfaces().length == 0) {
            return bean;
        }
        return Proxy.newProxyInstance(
                beanClass.getClassLoader(),
                beanClass.getInterfaces(),
                new LoggingInvocationHandler(bean));
    }
}`,
    },
    ready: {
      file: '02-boot/03-starters/.../StarterReportRunner.java',
      lang: 'java',
      code: `@Component
public class StarterReportRunner implements CommandLineRunner {

    private final ApplicationContext context;
    private final GreeterService greeterService;

    public StarterReportRunner(ApplicationContext context,
                               GreeterService greeterService) {
        this.context = context;
        this.greeterService = greeterService;
    }

    @Override
    public void run(String... args) {
        System.out.println("greet(): " + greeterService.greet());
    }
}`,
    },
  },

  request: {
    client: {
      file: 'терминал',
      lang: 'bash',
      code: `$ curl -u user:pass http://localhost:8080/private`,
    },
    filter: {
      file: '05-security/01-filter-chain/.../VisualHeaderFilter.java',
      lang: 'java',
      code: `class VisualHeaderFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        response.setHeader("X-Visual-SB", "security-chain");
        chain.doFilter(request, response);
    }
}`,
    },
    auth: {
      file: '05-security/01-filter-chain/.../SecurityConfiguration.java',
      lang: 'java',
      code: `@Bean
SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(requests -> requests
                    .requestMatchers("/public").permitAll()
                    .anyRequest().authenticated())
            .httpBasic(Customizer.withDefaults())
            .addFilterBefore(new VisualHeaderFilter(),
                    SecurityContextHolderFilter.class);
    return http.build();
}`,
    },
    dispatcher: null,
    interceptor: {
      file: '03-web/01-dispatcher-servlet/.../TraceInterceptor.java',
      lang: 'java',
      code: `@Override
public boolean preHandle(HttpServletRequest request,
        HttpServletResponse response, Object handler) {
    trace.record("2. interceptor.preHandle");
    return true;
}`,
    },
    controller: {
      file: '03-web/01-dispatcher-servlet/.../HelloController.java',
      lang: 'java',
      code: `@RestController
class HelloController {

    @GetMapping("/api/hello")
    Greeting hello(@RequestParam(defaultValue = "Spring MVC") String name) {
        trace.record("3. controller");
        return new Greeting("Привет, " + name + "!");
    }
}`,
    },
    transaction: {
      file: '04-data/01-jpa-transactions/.../NoteService.java',
      lang: 'java',
      code: `@Service
public class NoteService {

    @Transactional
    public Note save(String text) {
        return repository.save(new Note(text));
    }

    @Transactional
    public void saveThenFail(String text) {
        repository.save(new Note(text));
        repository.flush();
        throw new IllegalStateException(
                "Демонстрационная ошибка: транзакция будет откачена");
    }
}`,
    },
    repository: {
      file: '04-data/01-jpa-transactions/.../NoteRepository.java',
      lang: 'java',
      code: `public interface NoteRepository extends JpaRepository<Note, Long> {
}
// Интерфейса достаточно: Spring Data создаёт прокси-реализацию сам.`,
    },
    database: {
      file: '04-data/01-jpa-transactions/.../Note.java',
      lang: 'java',
      code: `@Entity
public class Note {

    @Id
    @GeneratedValue
    private Long id;

    private String text;

    public Note(String text) {
        this.text = text;
    }
}`,
    },
  },

  lifecycle: {
    definition: {
      file: '01-core/03-bean-lifecycle/.../AppConfig.java',
      lang: 'java',
      code: `@Configuration
public class AppConfig {

    @Bean(initMethod = "customInit",
          destroyMethod = "customDestroy")
    public LifeCycleBean lifeCycleBean(LifecycleLog log) {
        return new LifeCycleBean(log);
    }
}`,
    },
    instantiate: {
      file: '01-core/03-bean-lifecycle/.../LifeCycleBean.java',
      lang: 'java',
      code: `public class LifeCycleBean
        implements BeanNameAware, InitializingBean, DisposableBean {

    public LifeCycleBean(LifecycleLog log) {
        this.log = log;
        event("constructor",
              "1. Конструктор: экземпляр создан (instantiate)");
    }`,
    },
    populate: {
      file: '01-core/03-bean-lifecycle/.../LifeCycleBean.java',
      lang: 'java',
      code: `    @Autowired
    public void setCollaborator(Collaborator collaborator) {
        this.collaborator = collaborator;
        event("populate",
              "2. Сеттер-инъекция: зависимости внедрены (populate)");
    }`,
    },
    init: {
      file: '01-core/03-bean-lifecycle/.../LifeCycleBean.java',
      lang: 'java',
      code: `    @PostConstruct
    public void postConstruct() {
        event("postConstruct", "5. @PostConstruct");
    }

    @Override
    public void afterPropertiesSet() {
        event("afterPropertiesSet",
              "6. InitializingBean#afterPropertiesSet");
    }

    public void customInit() {
        event("customInit", "7. customInit: initMethod из @Bean");
    }`,
    },
    bpp: {
      file: '01-core/03-bean-lifecycle/.../LifecyclePostProcessor.java',
      lang: 'java',
      code: `@Component
public class LifecyclePostProcessor implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(
            Object bean, String beanName) {
        if (bean instanceof LifeCycleBean) {
            log.add("bppAfter");
            System.out.println(">>> 8. postProcessAfterInitialization");
        }
        return bean;
    }
}`,
    },
    ready: {
      file: '01-core/03-bean-lifecycle/.../LifeCycleBean.java',
      lang: 'java',
      code: `    public String hello() {
        return "бин '" + beanName + "' готов, collaborator = "
                + collaborator.getClass().getSimpleName();
    }
// Порядок событий 1–8 зафиксирован в LifecycleLog
// и проверяется BeanLifecycleApplicationTests.`,
    },
  },

  proxies: {
    caller: {
      file: '01-core/05-aop-proxies/.../AopReportRunner.java',
      lang: 'java',
      code: `System.out.println("=== 1. transfer(): нормальный вызов ===");
System.out.println("Результат: " + accountService.transfer("a", "b"));

System.out.println("=== 3. selfCallDemo(): this.transfer() ===");
System.out.println("Результат: " + accountService.selfCallDemo());`,
    },
    proxy: {
      file: '01-core/05-aop-proxies/.../AccountServiceImpl.java',
      lang: 'java',
      code: `@Service
public class AccountServiceImpl implements AccountService {

    @Override
    @Transactional
    public String transfer(String from, String to) {
        return "перевод " + from + " -> " + to + " выполнен";
    }`,
    },
    interceptor: {
      file: '01-core/05-aop-proxies/.../LoggingTransactionManager.java',
      lang: 'java',
      code: `@Override
protected void doBegin(Object transaction,
        TransactionDefinition definition) {
    events.add("begin");
    System.out.println(">>> [tx] BEGIN");
}`,
    },
    target: {
      file: '01-core/05-aop-proxies/.../AccountServiceImpl.java',
      lang: 'java',
      code: `    @Override
    @Transactional
    public String transfer(String from, String to) {
        // этот код выполняется внутри BEGIN…COMMIT,
        // хотя в методе нет ни одной строчки про транзакции
        return "перевод " + from + " -> " + to + " выполнен";
    }`,
    },
    selfcall: {
      file: '01-core/05-aop-proxies/.../AccountServiceImpl.java',
      lang: 'java',
      code: `    @Override
    public String selfCallDemo() {
        return this.transfer("a", "b");
        // this — настоящий объект, а не прокси:
        // перехватчик транзакции в этот вызов не попадает
    }`,
    },
    commit: {
      file: '01-core/05-aop-proxies/.../LoggingTransactionManager.java',
      lang: 'java',
      code: `@Override
protected void doCommit(DefaultTransactionStatus status) {
    events.add("commit");
    System.out.println(">>> [tx] COMMIT");
}

@Override
protected void doRollback(DefaultTransactionStatus status) {
    events.add("rollback");
    System.out.println(">>> [tx] ROLLBACK");
}`,
    },
  },

  conditions: {
    evaluator: {
      file: '02-boot/02-conditional/.../OnFullModeCondition.java',
      lang: 'java',
      code: `public class OnFullModeCondition implements Condition {

    @Override
    public boolean matches(ConditionContext context,
            AnnotatedTypeMetadata metadata) {
        return "full".equals(System.getProperty("demo.mode"));
    }
}
// Свое условие — тот же контракт, что у @ConditionalOnProperty`,
    },
    onproperty: {
      file: '02-boot/02-conditional/.../FeatureConfig.java',
      lang: 'java',
      code: `    @Bean
    @ConditionalOnProperty(prefix = "feature.notifications",
            name = "enabled", havingValue = "true")
    public NotificationService notificationService() {
        return new NotificationService();
    }`,
    },
    onclass: {
      file: '02-boot/02-conditional/.../FeatureConfig.java',
      lang: 'java',
      code: `    @Bean
    @ConditionalOnClass(ObjectMapper.class)
    public JacksonReportService jacksonReportService() {
        return new JacksonReportService();
    }`,
    },
    onbean: {
      file: '02-boot/03-starters/.../GreeterAutoConfiguration.java',
      lang: 'java',
      code: `    @Bean
    @ConditionalOnMissingBean
    public GreeterService greeterService(
            GreeterProperties properties) {
        // не выполнится, если пользователь
        // определил свой GreeterService
        return new GreeterService(properties);
    }`,
    },
    feature: {
      file: '02-boot/02-conditional/.../NotificationService.java',
      lang: 'java',
      code: `public class NotificationService {

    public String status() {
        return "уведомления включены";
    }
}
// Появится в контексте, только если
// feature.notifications.enabled=true`,
    },
    report: {
      file: '02-boot/04-conditions-report/.../ReportConfiguration.java',
      lang: 'java',
      code: `    @Bean
    ReportService reportService() {
        return new ReportService("обычный отчёт");
    }

    @Bean
    @ConditionalOnProperty(prefix = "visual.report",
            name = "detailed", havingValue = "true")
    ReportService detailedReportService() {
        return new ReportService("подробный отчёт");
    }`,
    },
  },

  scan: {
    application: {
      file: '01-core/01-component-scan/.../ComponentScanApplication.java',
      lang: 'java',
      code: `@SpringBootApplication
@ComponentScan(excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\\\.visualsb\\\\.componentscan\\\\.excluded\\\\..*"))
public class ComponentScanApplication {`,
    },
    base: {
      file: '01-core/01-component-scan/.../ScanReportRunner.java',
      lang: 'java',
      code: `private static final String BASE_PACKAGE =
        "com.visualsb.componentscan";

// печатает бины, найденные сканированием:
Arrays.stream(context.getBeanDefinitionNames())
        .filter(name -> isUserBean(
            registry.getBeanDefinition(name)))
        .sorted()
        .forEach(name -> System.out.println(name));`,
    },
    plain: {
      file: '01-core/01-component-scan/.../PlainComponent.java',
      lang: 'java',
      code: `@Component
public class PlainComponent {
}
// имя бина сгенерируется из имени класса: plainComponent`,
    },
    named: {
      file: '01-core/01-component-scan/.../NamedComponent.java',
      lang: 'java',
      code: `@Component("renamedComponent")
public class NamedComponent {
}
// явное имя бина — оно и попадёт в контекст`,
    },
    internal: {
      file: '01-core/01-component-scan/.../excluded/InternalComponent.java',
      lang: 'java',
      code: `package com.visualsb.componentscan.excluded;

@Component
public class InternalComponent {
}
// этот пакет закрыт регекс-фильтром
// excluded\\\\..* — бина не будет`,
    },
    filter: {
      file: '01-core/01-component-scan/.../ComponentScanApplication.java',
      lang: 'java',
      code: `@ComponentScan(excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\\\.visualsb\\\\.componentscan\\\\.excluded\\\\..*"))
// фильтр срабатывает до регистрации BeanDefinition`,
    },
    registry: {
      file: '01-core/01-component-scan/.../ScanReportRunner.java',
      lang: 'java',
      code: `System.out.println("Бин 'internalComponent' в контексте: "
        + (context.containsBean("internalComponent")
            ? "есть"
            : "ОТСУТСТВУЕТ (исключён exclude-фильтром)"));`,
    },
  },

  definition: {
    config: {
      file: '01-core/02-bean-definition/.../config/AppConfig.java',
      lang: 'java',
      code: `@Configuration
public class AppConfig {

    @Bean
    public TimeProvider timeProvider() {
        return new TimeProvider();
    }
}`,
    },
    reader: {
      file: '01-core/02-bean-definition/.../DefinitionInspector.java',
      lang: 'java',
      code: `@Component
public class DefinitionInspector
        implements BeanDefinitionRegistryPostProcessor {

    @Override
    public void postProcessBeanDefinitionRegistry(
            BeanDefinitionRegistry registry) {
        BeanDefinition definition =
                new RootBeanDefinition(Greeter.class);
        registry.registerBeanDefinition("greeter", definition);
    }`,
    },
    greeterDef: {
      file: '01-core/02-bean-definition/.../DefinitionInspector.java',
      lang: 'java',
      code: `BeanDefinition definition = new RootBeanDefinition(Greeter.class);
registry.registerBeanDefinition("greeter", definition);
System.out.println(">>> [registry] 'greeter' зарегистрирован программно. "
        + "Экземпляра ещё нет — только метаданные.");`,
    },
    lazyDef: {
      file: '01-core/02-bean-definition/.../DefinitionInspector.java',
      lang: 'java',
      code: `beanFactory.getBeanDefinition("expensiveService")
        .setLazyInit(true);
System.out.println(">>> [beanFactory] 'expensiveService': "
        + "метаданные изменены -> lazyInit=true. "
        + "Объект не будет создан при старте.");`,
    },
    registry: {
      file: '01-core/02-bean-definition/.../DefinitionReportRunner.java',
      lang: 'java',
      code: `BeanDefinition bd = beanFactory.getBeanDefinition(name);
System.out.printf("%-18s %-34s %-10s %s%n",
        name, bd.getClass().getSimpleName(),
        bd.getScope(), bd.isLazyInit());
System.out.println("Экземпляр expensiveService создан при старте? "
        + beanFactory.containsSingleton("expensiveService"));`,
    },
    instance: {
      file: '01-core/02-bean-definition/.../service/ExpensiveService.java',
      lang: 'java',
      code: `@Component
public class ExpensiveService {

    public ExpensiveService() {
        System.out.println(">>> ExpensiveService: конструктор вызван, "
                + "экземпляр создан");
    }

    public String work() {
        return "работа выполнена";
    }
}`,
    },
  },

  postprocessor: {
    target: {
      file: '01-core/04-beanpostprocessor/.../GreetingServiceImpl.java',
      lang: 'java',
      code: `@Logged
@Component
public class GreetingServiceImpl
        implements GreetingService {

    @Override
    public String greet(String name) {
        return "Привет, " + name + "!";
    }
}`,
    },
    before: {
      file: '01-core/04-beanpostprocessor/.../LoggingPostProcessor.java',
      lang: 'java',
      code: `@Component
public class LoggingPostProcessor
        implements BeanPostProcessor {
    // Spring вызывает его для КАЖДОГО бина:
    // postProcessBeforeInitialization -> init ->
    // postProcessAfterInitialization
}`,
    },
    init: {
      file: '01-core/04-beanpostprocessor/.../Logged.java',
      lang: 'java',
      code: `@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Logged {
}
// маркерная аннотация: сама ничего не делает,
// её читает LoggingPostProcessor`,
    },
    after: {
      file: '01-core/04-beanpostprocessor/.../LoggingPostProcessor.java',
      lang: 'java',
      code: `Class<?> beanClass = bean.getClass();
if (!beanClass.isAnnotationPresent(Logged.class)
        || beanClass.getInterfaces().length == 0) {
    return bean;
}
return Proxy.newProxyInstance(
        beanClass.getClassLoader(),
        beanClass.getInterfaces(),
        new LoggingInvocationHandler(bean));`,
    },
    proxyBean: {
      file: '01-core/04-beanpostprocessor/.../LoggingInvocationHandler.java',
      lang: 'java',
      code: `public class LoggingInvocationHandler
        implements InvocationHandler {

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) {
        long start = System.nanoTime();
        System.out.println(">>> [proxy] вызов " + method.getName() + "()");
        Object result = method.invoke(target, args);
        System.out.println(">>> [proxy] завершён за "
                + (System.nanoTime() - start) / 1_000 + " мкс");
        return result;
    }
}`,
    },
    methodCall: {
      file: '01-core/04-beanpostprocessor/.../BppReportRunner.java',
      lang: 'java',
      code: `System.out.println("Класс бина greetingService в runtime: "
        + greetingService.getClass().getName());
System.out.println("Это JDK-прокси? "
        + Proxy.isProxyClass(greetingService.getClass()));

System.out.println("Ответ: " + greetingService.greet("мир"));`,
    },
  },

  autoconfig: {
    application: {
      file: '02-boot/01-autoconfiguration/.../AutoconfigurationApplication.java',
      lang: 'java',
      code: `@SpringBootApplication
public class AutoconfigurationApplication {

    public static void main(String[] args) {
        SpringApplication.run(
                AutoconfigurationApplication.class, args);
    }
}
// одна аннотация = scan + EnableAutoConfiguration
// + ConfigurationProperties`,
    },
    enableAuto: {
      file: '02-boot/01-autoconfiguration/.../AppConfig.java',
      lang: 'java',
      code: `@Configuration
public class AppConfig {

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
                .enable(SerializationFeature.INDENT_OUTPUT);
    }
}
// ваш @Bean имеет приоритет над авто-конфигурацией`,
    },
    candidates: {
      file: '02-boot/03-starters/.../AutoConfiguration.imports',
      lang: 'text',
      code: `# так выглядит список кандидатов
# в любом стартере Spring Boot:
com.visualsb.starters.starter.GreeterAutoConfiguration
# у настоящих стартеров — десятки строк`,
    },
    classFilter: {
      file: '02-boot/02-conditional/.../FeatureConfig.java',
      lang: 'java',
      code: `    @Bean
    @ConditionalOnClass(ObjectMapper.class)
    public JacksonReportService jacksonReportService() {
        return new JacksonReportService();
    }
// нет класса в classpath —
// определение пропускается без ошибки`,
    },
    selected: {
      file: '02-boot/03-starters/.../GreeterAutoConfiguration.java',
      lang: 'java',
      code: `@AutoConfiguration
@ConditionalOnProperty(prefix = "visual.greeting",
        name = "enabled", havingValue = "true",
        matchIfMissing = true)
public class GreeterAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public GreeterService greeterService(
            GreeterProperties properties) {
        return new GreeterService(properties);
    }
}`,
    },
    userOverride: {
      file: '02-boot/01-autoconfiguration/.../AppConfig.java',
      lang: 'java',
      code: `    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
                .enable(SerializationFeature.INDENT_OUTPUT);
    }
// так выглядит замена авто-конфигурации:
// бин того же типа, объявленный вами`,
    },
    contextReady: {
      file: '02-boot/01-autoconfiguration/.../AutoconfigReportRunner.java',
      lang: 'java',
      code: `System.out.println("Бины типа ObjectMapper: "
        + Arrays.toString(context
            .getBeanNamesForType(ObjectMapper.class)));
System.out.println("jacksonObjectMapper (от автоконфигурации): "
        + context.containsBean("jacksonObjectMapper"));
System.out.println("Наш objectMapper с INDENT_OUTPUT? "
        + objectMapper.isEnabled(SerializationFeature.INDENT_OUTPUT));`,
    },
  },

  report: {
    appStart: {
      file: '02-boot/04-conditions-report · запуск',
      lang: 'bash',
      code: `$ mvn spring-boot:run -Dspring-boot.run.arguments=--debug

================ CONDITIONS EVALUATION REPORT ================`,
    },
    evaluation: {
      file: '02-boot/04-conditions-report/.../ReportConfiguration.java',
      lang: 'java',
      code: `@Configuration(proxyBeanMethods = false)
class ReportConfiguration {

    @Bean
    ReportService reportService() {
        return new ReportService("обычный отчёт");
    }`,
    },
    positive: {
      file: '02-boot/04-conditions-report · вывод --debug',
      lang: 'text',
      code: `positiveMatches:
  ReportConfiguration#reportService
      @ConditionalOnProperty ... matched`,
    },
    negative: {
      file: '02-boot/04-conditions-report · вывод --debug',
      lang: 'text',
      code: `negativeMatches:
  ReportConfiguration#detailedReportService
      @ConditionalOnProperty ... did not match
      (visual.report.detailed не задано)`,
    },
    actuators: {
      file: '02-boot/04-conditions-report/.../ActuatorReportRunner.java',
      lang: 'java',
      code: `System.out.println("http://localhost:8080/actuator/conditions"
        + " -> positiveMatches / negativeMatches");
System.out.println("http://localhost:8080/actuator/beans"
        + " -> фактические бины контекста");`,
    },
  },
};

export function getSnippet(sceneId, nodeId) {
  return CODE_SNIPPETS[sceneId]?.[nodeId] ?? null;
}
