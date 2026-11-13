const starterPath = '02-boot/03-starters';

const node = (id, kind, label, subtitle, x, y, category, description, breakpoint, source, extra = {}) => ({
  id,
  type: 'visual',
  position: { x, y },
  data: { label, subtitle, kind, category, description, breakpoint, source },
  ...extra,
});

const edge = (id, source, target, extra = {}) => ({
  id,
  source,
  target,
  type: 'smoothstep',
  ...extra,
});

const toggle = (key, label, hint, extra = {}) => ({ type: 'toggle', key, label, hint, ...extra });
const segment = (key, label, choices) => ({ type: 'segment', key, label, choices });

export const SCENES = {
  boot: {
    number: '01',
    title: 'Запуск контейнера',
    shortTitle: 'Spring Boot',
    verb: 'Запустить контейнер',
    icon: 'box',
    module: `${starterPath}`,
    logLabel: 'STARTUP',
    startKind: 'application',
    targetKind: 'ready',
    description: 'От аннотации до готового бина. Измените условия и посмотрите, как Boot пересоберёт маршрут.',
    defaults: { enabled: true, custom: false },
    settings: [
      toggle('enabled', 'Автоконфигурация', 'visual.greeting.enabled'),
      toggle('custom', 'Свой GreeterService', '@ConditionalOnMissingBean'),
    ],
    note(options) {
      if (!options.enabled) return { warning: true, text: 'Бин исчезнет. Runner в Java-примере не сможет запуститься.' };
      if (options.custom) return { warning: false, text: 'Ваш бин будет первым. Boot отступит.' };
      return { warning: false, text: 'Условия позволяют создать бин стартера.' };
    },
    badge: () => '@SpringBootApplication',
    visibility: [
      { when: (options) => options.custom, showNodes: ['custom'], showEdges: ['custom-bpp'] },
    ],
    nodes: [
      node('application', 'application', 'Application', '@SpringBootApplication', 0, 175, 'boot',
        'Точка входа объединяет конфигурацию, поиск компонентов и импорт автоконфигураций.',
        'SpringApplication#run', `${starterPath}/src/main/java/com/visualsb/starters/StartersApplication.java`),
      node('scan', 'scan', 'Component scan', 'поиск @Component', 225, 15, 'core',
        'Сканер ищет кандидатов в classpath и создаёт метаданные — ещё не сами объекты.',
        'ClassPathBeanDefinitionScanner#doScan', '01-core/01-component-scan'),
      node('imports', 'imports', 'Import selector', 'AutoConfiguration.imports', 225, 175, 'boot',
        'DeferredImportSelector читает список автоконфигураций из JAR-файлов и передаёт его парсеру.',
        'AutoConfigurationImportSelector#selectImports', '02-boot/01-autoconfiguration'),
      node('properties', 'properties', 'Properties', 'application.properties', 225, 335, 'boot',
        'Environment объединяет свойства. ConfigurationPropertiesBinder связывает их с полями GreeterProperties.',
        'ConfigurationPropertiesBinder#bind', `${starterPath}/src/main/resources/application.properties`),
      node('auto', 'auto-configuration', 'Greeter auto-config', '@ConditionalOnProperty', 455, 175, 'boot',
        'Автоконфигурация проверяет условия. Пользовательский бин имеет приоритет благодаря @ConditionalOnMissingBean.',
        'OnPropertyCondition#getMatchOutcome', `${starterPath}/src/main/java/com/visualsb/starters/starter/GreeterAutoConfiguration.java`),
      node('greeter', 'service', 'GreeterService', '@Bean · singleton', 680, 175, 'core',
        'Обычный объект сервиса появляется из @Bean-метода автоконфигурации. До этого момента существовало только его описание.',
        'AbstractAutowireCapableBeanFactory#doCreateBean', `${starterPath}/src/main/java/com/visualsb/starters/starter/GreeterService.java`),
      node('custom', 'custom-bean', 'Ваш GreeterService', '@Bean · пользовательский', 455, 370, 'custom',
        'Ваш @Bean обрабатывается раньше автоконфигурации. Boot видит его и не создаёт второй GreeterService.',
        'OnBeanCondition#getMatchResult', '02-boot/03-starters · ApplicationContextRunner', { hidden: true }),
      node('bpp', 'bpp', 'Post-processors', 'BeanPostProcessor', 905, 175, 'core',
        'Постпроцессоры могут инициализировать или обернуть бин. На этом этапе появляются AOP-прокси.',
        'AbstractAutowireCapableBeanFactory#initializeBean', '01-core/04-beanpostprocessor'),
      node('ready', 'ready', 'Контейнер готов', 'refresh() завершён', 1130, 175, 'success',
        'Singleton-бины созданы и готовы к работе. В реальном модуле StarterReportRunner выводит приветствие.',
        'AbstractApplicationContext#refresh', '02-boot/03-starters'),
    ],
    edges: [
      edge('app-scan', 'application', 'scan'),
      edge('app-imports', 'application', 'imports'),
      edge('imports-auto', 'imports', 'auto'),
      edge('properties-auto', 'properties', 'auto'),
      edge('auto-greeter', 'auto', 'greeter'),
      edge('greeter-bpp', 'greeter', 'bpp'),
      edge('custom-bpp', 'custom', 'bpp', { hidden: true }),
      edge('bpp-ready', 'bpp', 'ready'),
    ],
  },

  request: {
    number: '02',
    title: 'Путь HTTP-запроса',
    shortTitle: 'HTTP → Database',
    verb: 'Отправить запрос',
    icon: 'globe',
    module: '03-web/01-dispatcher-servlet',
    logLabel: 'REQUEST',
    startKind: 'client',
    targetKind: 'database',
    description: 'Пройдите от браузера до базы данных. Отключите credentials или вызовите исключение — маршрут изменится.',
    defaults: { endpoint: 'private', credentials: true, failure: false },
    settings: [
      segment('endpoint', 'Endpoint', [
        { value: 'private', label: '/private' },
        { value: 'public', label: '/public' },
      ]),
      toggle('credentials', 'Валидные credentials', 'HTTP Basic', { disabledWhen: { key: 'endpoint', equals: 'public' } }),
      toggle('failure', 'Ошибка в сервисе', 'rollback после INSERT'),
    ],
    note(options) {
      if (options.endpoint === 'public') return { warning: false, text: 'permitAll: логин не нужен, фильтры остаются.' };
      if (!options.credentials) return { warning: true, text: 'Ожидается 401. Контроллер не будет вызван.' };
      if (options.failure) return { warning: true, text: 'Исключение отменит INSERT. Ответ — 500.' };
      return { warning: false, text: 'Ожидается 200 OK и JSON в ответе.' };
    },
    badge: (options) => `GET /${options.endpoint}`,
    nodes: [
      node('client', 'client', 'Browser', 'HTTP client', 0, 140, 'web',
        'Клиент отправляет GET-запрос. Для /private в заголовке Authorization передаются учебные credentials.',
        'curl -u user:pass http://localhost:8080/private', '05-security/01-filter-chain'),
      node('filter', 'filter', 'FilterChainProxy', 'SecurityFilterChain', 200, 140, 'security',
        'Фильтры выполняются до DispatcherServlet. VisualHeaderFilter добавляет X-Visual-SB даже при отказе.',
        'FilterChainProxy#doFilterInternal', '05-security/01-filter-chain'),
      node('auth', 'auth', 'Authentication', 'BasicAuthenticationFilter', 400, 140, 'security',
        'HTTP Basic превращается в Authentication. Для /public правило permitAll не требует логина.',
        'BasicAuthenticationFilter#doFilterInternal', '05-security/01-filter-chain'),
      node('dispatcher', 'dispatcher', 'DispatcherServlet', 'getHandler → doDispatch', 600, 140, 'web',
        'Диспетчер выбирает HandlerMapping, HandlerAdapter и цепочку interceptors для запроса.',
        'DispatcherServlet#doDispatch', '03-web/01-dispatcher-servlet'),
      node('interceptor', 'interceptor', 'Interceptor', 'preHandle()', 800, 140, 'web',
        'Interceptor уже знает выбранный handler. preHandle может разрешить или остановить вызов контроллера.',
        'HandlerExecutionChain#applyPreHandle', '03-web/01-dispatcher-servlet'),
      node('controller', 'controller', 'HelloController', '@GetMapping', 800, 350, 'web',
        'Связанные аргументы передаются в метод. Возвращённый объект позже станет JSON через HttpMessageConverter.',
        'InvocableHandlerMethod#invokeForRequest', '03-web/01-dispatcher-servlet'),
      node('transaction', 'transaction', 'NoteService', '@Transactional', 600, 350, 'data',
        'Вызов проходит через AOP-прокси. TransactionInterceptor открывает транзакцию до метода сервиса.',
        'TransactionInterceptor#invoke', '04-data/01-jpa-transactions'),
      node('repository', 'repository', 'NoteRepository', 'Spring Data proxy', 400, 350, 'data',
        'Репозиторий — динамический прокси интерфейса. Стандартные операции делегируются реализации JPA.',
        'JpaRepositoryFactory#getRepository', '04-data/01-jpa-transactions'),
      node('database', 'database', 'H2 Database', 'INSERT · SELECT', 200, 350, 'data',
        'Hibernate генерирует SQL. При ошибке сервиса уже выполненный INSERT будет отменён транзакцией.',
        'JpaTransactionManager#doCommit / #doRollback', '04-data/01-jpa-transactions'),
    ],
    edges: [
      edge('client-filter', 'client', 'filter'),
      edge('filter-auth', 'filter', 'auth'),
      edge('auth-dispatcher', 'auth', 'dispatcher'),
      edge('dispatcher-interceptor', 'dispatcher', 'interceptor'),
      edge('interceptor-controller', 'interceptor', 'controller'),
      edge('controller-transaction', 'controller', 'transaction'),
      edge('transaction-repository', 'transaction', 'repository'),
      edge('repository-database', 'repository', 'database'),
    ],
  },

  lifecycle: {
    number: '03',
    title: 'Жизненный цикл бина',
    shortTitle: 'Bean Lifecycle',
    verb: 'Создать бин',
    icon: 'cycle',
    module: '01-core/03-bean-lifecycle',
    logLabel: 'LIFECYCLE',
    startKind: 'bean-definition',
    targetKind: 'ready-bean',
    description: 'От чертежа BeanDefinition до готового объекта. Сломайте init-этап или попросите BPP обернуть бин в прокси.',
    defaults: { initFailure: false, proxyWrap: false },
    settings: [
      toggle('initFailure', 'Ошибка в init-методе', '@PostConstruct бросает исключение'),
      toggle('proxyWrap', 'Обёртка в прокси', 'BeanPostProcessor возвращает прокси'),
    ],
    note(options) {
      if (options.initFailure) return { warning: true, text: 'Исключение на init-этапе уничтожит бин и остановит контекст — как в реальном модуле.' };
      if (options.proxyWrap) return { warning: false, text: 'BPP подменит объект: в контекст попадёт прокси, а не LifeCycleBean. Это мостик к сцене 04.' };
      return { warning: false, text: 'Все восемь событий модуля 03 пройдут по порядку. Порядок init-этапов зафиксирован спецификацией.' };
    },
    badge: () => 'LifeCycleBean · 8 событий',
    nodes: [
      node('definition', 'bean-definition', 'BeanDefinition', 'чертёж бина', 0, 140, 'core',
        'Метаданные из модуля 02: класс, scope, конструктор, initMethod/destroyMethod. Живого объекта ещё нет.',
        'DefaultListableBeanFactory#getBeanDefinition', '01-core/03-bean-lifecycle'),
      node('instantiate', 'instantiate', 'Instantiate', 'конструктор', 210, 140, 'core',
        'createBeanInstance выбирает конструктор и вызывает new. @Autowired-поля на этом шаге ещё null.',
        'AbstractAutowireCapableBeanFactory#createBeanInstance', '01-core/03-bean-lifecycle'),
      node('populate', 'populate', 'Populate', 'внедрение зависимостей', 210, 330, 'core',
        'populateBean заполняет @Autowired-поля и вызывает setter-ы. Работать с зависимостями безопасно начиная отсюда.',
        'AbstractAutowireCapableBeanFactory#populateBean', '01-core/03-bean-lifecycle'),
      node('init', 'init', 'Initialization', '@PostConstruct → afterPropertiesSet', 440, 330, 'core',
        'Init-этапы идут в фиксированном порядке: @PostConstruct, затем InitializingBean#afterPropertiesSet, затем initMethod из @Bean.',
        'AbstractAutowireCapableBeanFactory#initializeBean', '01-core/03-bean-lifecycle'),
      node('bpp', 'bpp', 'Post-processors', 'after-обработка', 440, 140, 'core',
        'postProcessAfterInitialization — последняя точка, где бин можно подменить. Так появляются AOP-прокси.',
        'AbstractAutowireCapableBeanFactory#initializeBean', '01-core/04-beanpostprocessor'),
      node('ready', 'ready-bean', 'Бин готов', 'singleton в контексте', 670, 140, 'success',
        'Объект доступен остальным бинам. При закрытии контекста: @PreDestroy → DisposableBean → destroyMethod.',
        'DefaultListableBeanFactory#preInstantiateSingletons', '01-core/03-bean-lifecycle'),
    ],
    edges: [
      edge('definition-instantiate', 'definition', 'instantiate'),
      edge('instantiate-populate', 'instantiate', 'populate'),
      edge('populate-init', 'populate', 'init'),
      edge('init-bpp', 'init', 'bpp'),
      edge('bpp-ready', 'bpp', 'ready'),
    ],
  },

  proxies: {
    number: '04',
    title: 'AOP-прокси и @Transactional',
    shortTitle: 'AOP Proxies',
    verb: 'Вызвать transfer()',
    icon: 'split',
    module: '01-core/05-aop-proxies',
    logLabel: 'PROXY CALL',
    startKind: 'caller',
    targetKind: 'commit',
    description: 'Почему бин в runtime — не ваш класс. Переключите тип прокси и посмотрите, что делает самовызов this.',
    defaults: { proxyType: 'cglib', internalCall: false, failure: false },
    settings: [
      segment('proxyType', 'Тип прокси', [
        { value: 'jdk', label: 'JDK' },
        { value: 'cglib', label: 'CGLIB' },
      ]),
      toggle('internalCall', 'Самовызов this.transfer()', 'минует прокси'),
      toggle('failure', 'Исключение в методе', 'ROLLBACK вместо COMMIT'),
    ],
    note(options) {
      if (options.failure) return { warning: true, text: 'Исключение покинет @Transactional-метод — LoggingTransactionManager напечатает ROLLBACK.' };
      if (options.internalCall) return { warning: true, text: 'this — настоящий объект, не прокси. Внутренний вызов выполнится без своей транзакции.' };
      if (options.proxyType === 'jdk') return { warning: false, text: 'JDK-прокси реализует интерфейс бина: без интерфейса он невозможен.' };
      return { warning: false, text: 'CGLIB наследует класс бина — дефолт Spring Boot. Final-методы он перехватить не сможет.' };
    },
    badge: (options) => options.proxyType === 'jdk' ? 'jdk.proxy…$Proxy42' : 'AccountServiceImpl$$SpringCGLIB$$0',
    visibility: [
      {
        when: (options) => options.internalCall,
        showNodes: ['selfcall'],
        showEdges: ['target-selfcall', 'selfcall-commit'],
        hideEdges: ['target-commit'],
      },
    ],
    nodes: [
      node('caller', 'caller', 'Ваш код', 'accountService.transfer()', 0, 140, 'core',
        'Вы вызываете метод бина. Но в контексте лежит не AccountServiceImpl, а его прокси — подмена прошла ещё при старте.',
        'JdkDynamicAopProxy#invoke / CglibAopProxy$DynamicAdvisedInterceptor#intercept', '01-core/05-aop-proxies'),
      node('proxy', 'proxy', 'Прокси', 'JDK или CGLIB', 210, 140, 'core',
        'JDK-прокси реализует интерфейс бина, CGLIB — наследует класс. Оба делегируют вызов цепочке advice.',
        'ProxyFactory#getProxy', '01-core/05-aop-proxies'),
      node('interceptor', 'tx-interceptor', 'TransactionInterceptor', 'invoke()', 430, 140, 'core',
        'Перехватчик открывает транзакцию ДО метода и решает между commit и rollback ПОСЛЕ него.',
        'TransactionInterceptor#invoke', '01-core/05-aop-proxies'),
      node('target', 'target-method', 'AccountServiceImpl', 'настоящий объект', 430, 330, 'core',
        'Метод настоящего объекта выполняется внутри транзакции. this внутри — тоже настоящий объект, не прокси.',
        'AccountServiceImpl#transfer', '01-core/05-aop-proxies'),
      node('selfcall', 'self-call', 'this.transfer()', 'внутри объекта', 210, 330, 'custom',
        'Самовызов идёт напрямую в объект, минуя прокси. Перехватчик не участвует — внутренний метод остаётся без транзакции.',
        'AccountServiceImpl#selfCallDemo', '01-core/05-aop-proxies', { hidden: true }),
      node('commit', 'commit', 'COMMIT / ROLLBACK', 'LoggingTransactionManager', 660, 140, 'success',
        'Учебный менеджер транзакций печатает решение: COMMIT при нормальном выходе, ROLLBACK при исключении.',
        'AbstractPlatformTransactionManager#commit / #rollback', '01-core/05-aop-proxies'),
    ],
    edges: [
      edge('caller-proxy', 'caller', 'proxy'),
      edge('proxy-interceptor', 'proxy', 'interceptor'),
      edge('interceptor-target', 'interceptor', 'target'),
      edge('target-selfcall', 'target', 'selfcall', { hidden: true }),
      edge('selfcall-commit', 'selfcall', 'commit', { hidden: true }),
      edge('target-commit', 'target', 'commit'),
    ],
  },

  conditions: {
    number: '05',
    title: 'Условия создания бинов',
    shortTitle: 'Conditions',
    verb: 'Оценить условия',
    icon: 'sliders',
    module: '02-boot/02-conditional',
    logLabel: 'CONDITIONS',
    startKind: 'condition-evaluator',
    targetKind: 'report',
    description: 'Три условия решают, появится ли FeatureService. Отчёт покажет совпадения и отказы — без единой ошибки.',
    defaults: { property: true, jackson: true, userBean: false },
    settings: [
      toggle('property', 'Property включена', 'feature.notifications.enabled'),
      toggle('jackson', 'Jackson в classpath', '@ConditionalOnClass(ObjectMapper)'),
      toggle('userBean', 'Свой FeatureService', '@ConditionalOnMissingBean'),
    ],
    note(options) {
      const blocked = !options.property || !options.jackson || options.userBean;
      if (options.userBean) return { warning: false, text: 'Пользовательский бин имеет приоритет. Автоконфигурация уступит и отчитается об этом.' };
      if (blocked) return { warning: true, text: 'Хотя бы одно условие провалено — бин не появится, и это нормальное поведение, а не ошибка.' };
      return { warning: false, text: 'Все условия выполнены. FeatureService будет зарегистрирован в контексте.' };
    },
    badge: () => 'ConditionEvaluator#shouldSkip',
    nodes: [
      node('evaluator', 'condition-evaluator', 'ConditionEvaluator', 'shouldSkip()', 0, 140, 'boot',
        'Перед регистрацией каждого @Bean Boot оценивает его @Conditional. Решение принимается на уровне метаданных.',
        'ConditionEvaluator#shouldSkip', '02-boot/02-conditional'),
      node('onproperty', 'condition-property', '@ConditionalOnProperty', 'feature.notifications.enabled', 220, 15, 'boot',
        'Сравнивает значение property с havingValue. Несовпадение — определение бина молча пропускается.',
        'OnPropertyCondition#getMatchOutcome', '02-boot/02-conditional'),
      node('onclass', 'condition-class', '@ConditionalOnClass', 'ObjectMapper', 220, 175, 'boot',
        'Проверяет наличие класса в classpath. При провале класс бина даже не загружается в JVM.',
        'OnClassCondition#getMatchOutcome', '02-boot/02-conditional'),
      node('onbean', 'condition-bean', '@ConditionalOnMissingBean', 'пользовательская замена', 220, 335, 'boot',
        'Уступает, если пользователь уже определил бин того же типа. Приоритет пользователя — фундамент стартеров.',
        'OnBeanCondition#getMatchOutcome', '02-boot/02-conditional'),
      node('feature', 'feature-service', 'FeatureService', 'кандидат @Bean', 470, 175, 'boot',
        'Кандидат регистрируется, только если все условия пройдены и пользовательский бин отсутствует.',
        'ConfigurationClassBeanDefinitionReader#loadBeanDefinitions', '02-boot/02-conditional'),
      node('report', 'report', 'Conditions report', 'positive / negative matches', 700, 175, 'success',
        'Actuator /actuator/conditions и флаг --debug показывают каждое решение. Результат сверяйте с /actuator/beans.',
        'ConditionsReportEndpoint#conditions', '02-boot/04-conditions-report'),
    ],
    edges: [
      edge('evaluator-property', 'evaluator', 'onproperty'),
      edge('evaluator-class', 'evaluator', 'onclass'),
      edge('evaluator-bean', 'evaluator', 'onbean'),
      edge('property-feature', 'onproperty', 'feature'),
      edge('class-feature', 'onclass', 'feature'),
      edge('bean-feature', 'onbean', 'feature'),
      edge('feature-report', 'feature', 'report'),
    ],
  },

  scan: {
    number: '06',
    title: 'Поиск компонентов',
    shortTitle: 'Component Scan',
    verb: 'Просканировать classpath',
    icon: 'layers',
    module: '01-core/01-component-scan',
    logLabel: 'SCAN',
    startKind: 'application',
    targetKind: 'ready',
    description: 'Как @ComponentScan находит классы. Отключите фильтр — внутренний компонент проберётся в контекст.',
    defaults: { excluded: true, internal: false },
    settings: [
      toggle('excluded', 'Регекс-фильтр excluded.*', 'FilterType.REGEX'),
      toggle('internal', 'InternalComponent в excluded', 'внутренний пакет'),
    ],
    note(options) {
      if (options.internal && options.excluded) return { warning: true, text: 'InternalComponent будет отброшен фильтром. Это не ошибка — так задумано в модуле 01.' };
      if (options.internal) return { warning: true, text: 'Фильтр выключен: InternalComponent попадёт в контекст — в реальном модуле его скрывают.' };
      if (!options.excluded) return { warning: false, text: 'Без фильтра сканируется всё подряд, включая внутренние пакеты.' };
      return { warning: false, text: 'Фильтр отбраковывает excluded\\..* до создания метаданных.' };
    },
    badge: () => '@ComponentScan',
    visibility: [
      { when: (options) => options.internal, showNodes: ['internal'], showEdges: ['base-internal', 'internal-filter'] },
    ],
    nodes: [
      node('application', 'application', 'ComponentScanApplication', '@SpringBootApplication', 0, 175, 'boot',
        '@ComponentScan ищет стереотипы от базового пакета вниз. Фильтры настраиваются прямо на аннотации.',
        'ClassPathBeanDefinitionScanner#doScan', '01-core/01-component-scan'),
      node('base', 'scan', 'Базовый пакет', 'com.visualsb.componentscan', 220, 175, 'core',
        'Сканирование идёт от пакета приложения: подпакеты component, service, repository проверяются рекурсивно.',
        'ClassPathScanningCandidateComponentProvider#findCandidateComponents', '01-core/01-component-scan'),
      node('plain', 'component', 'plainComponent', '@Component', 440, 60, 'core',
        'Компонент без явного имени: имя бина генерируется из имени класса.',
        'AnnotationBeanNameGenerator#buildDefaultBeanName', '01-core/01-component-scan · component/PlainComponent.java'),
      node('named', 'component', 'renamedComponent', '@Component("renamedComponent")', 440, 175, 'core',
        'Явное имя бина в аннотации. Под этим именем он ляжет в контекст.',
        'AnnotationBeanNameGenerator#generateBeanName', '01-core/01-component-scan · component/NamedComponent.java'),
      node('internal', 'component', 'internalComponent', 'пакет excluded', 440, 290, 'custom',
        'Компонент из внутреннего пакета. Регекс-фильтр исключает его из сканирования.',
        'RegexPatternTypeExcludeFilter#match', '01-core/01-component-scan · excluded/InternalComponent.java', { hidden: true }),
      node('filter', 'condition-evaluator', 'Exclude filter', 'excluded\\..*', 680, 175, 'boot',
        'Фильтр отбраковывает кандидатов до создания BeanDefinition. Решение принимается на уровне метаданных classpath.',
        'ClassPathBeanDefinitionScanner#addExcludeFilter', '01-core/01-component-scan'),
      node('registry', 'ready', 'BeanDefinition зарегистрированы', 'beanMap пополнена', 900, 175, 'success',
        'Кандидаты стали метаданными в BeanFactory. Объекты появятся позже — на этапе instantiate.',
        'DefaultListableBeanFactory#registerBeanDefinition', '01-core/01-component-scan'),
    ],
    edges: [
      edge('app-base', 'application', 'base'),
      edge('base-plain', 'base', 'plain'),
      edge('base-named', 'base', 'named'),
      edge('base-internal', 'base', 'internal', { hidden: true }),
      edge('plain-filter', 'plain', 'filter'),
      edge('named-filter', 'named', 'filter'),
      edge('internal-filter', 'internal', 'filter', { hidden: true }),
      edge('filter-registry', 'filter', 'registry'),
    ],
  },

  definition: {
    number: '07',
    title: 'Метаданные бина',
    shortTitle: 'BeanDefinition',
    verb: 'Зарегистрировать метаданные',
    icon: 'file',
    module: '01-core/02-bean-definition',
    logLabel: 'METADATA',
    startKind: 'auto-configuration',
    targetKind: 'instantiation-point',
    description: 'Определение бина — ещё не объект. Зарегистрируйте «greeter» программно и отложите создание expensiveService.',
    defaults: { programmatic: true, lazy: false },
    settings: [
      toggle('programmatic', 'Программная регистрация', 'registerBeanDefinition("greeter")'),
      toggle('lazy', 'expensiveService → lazy', 'setLazyInit(true)'),
    ],
    note(options) {
      if (options.lazy && options.programmatic) return { warning: false, text: 'Метаданные правятся до создания объектов — оба приёма из DefinitionInspector.' };
      if (options.lazy) return { warning: false, text: 'containsSingleton("expensiveService") будет false до первого getBean.' };
      if (!options.programmatic) return { warning: false, text: 'Без программной регистрации останутся только @Bean-определения из AppConfig.' };
      return { warning: false, text: 'RootBeanDefinition — только чертёж. Экземпляра не существует.' };
    },
    badge: () => 'BeanDefinition · metadata only',
    visibility: [
      { when: (options) => options.programmatic, showNodes: ['greeterDef'], showEdges: ['reader-greeter', 'greeter-registry'] },
      { when: (options) => options.lazy, showNodes: ['lazyDef'], showEdges: ['reader-lazy', 'lazy-registry'] },
      { when: (options) => !options.programmatic && !options.lazy, showEdges: ['reader-fallback'] },
    ],
    nodes: [
      node('config', 'auto-configuration', 'AppConfig', '@Configuration + @Bean', 0, 175, 'boot',
        'Класс конфигурации описывает бины через @Bean-методы. Описание — ещё не объект.',
        'ConfigurationClassPostProcessor#processConfigBeanDefinitions', '01-core/02-bean-definition'),
      node('reader', 'metadata-reader', 'DefinitionInspector', 'RegistryPostProcessor', 230, 175, 'core',
        'Точка входа в реестр: можно зарегистрировать определение программно и изменить метаданные до создания бинов.',
        'BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry', '01-core/02-bean-definition · DefinitionInspector.java'),
      node('greeterDef', 'bean-metadata', 'BeanDefinition «greeter»', 'RootBeanDefinition', 460, 60, 'core',
        'Метаданные: класс, scope, конструктор, lazy. Экземпляра нет и не будет, пока его не попросят.',
        'RootBeanDefinition#setBeanClass', '01-core/02-bean-definition · DefinitionInspector.java'),
      node('lazyDef', 'bean-metadata', 'expensiveService', 'lazyInit = true', 460, 220, 'core',
        'DefinitionInspector выставил lazyInit=true: объект не создаётся при старте контекста.',
        'BeanDefinition#setLazyInit', '01-core/02-bean-definition · DefinitionInspector.java', { hidden: true }),
      node('registry', 'definition-registry', 'BeanDefinition map', 'beanFactory без объектов', 690, 175, 'core',
        'Реестр метаданных заполнен. containsSingleton() == false — живых объектов пока нет.',
        'DefaultListableBeanFactory#registerBeanDefinition', '01-core/02-bean-definition'),
      node('instance', 'instantiation-point', 'Экземпляр по требованию', 'getBean("expensiveService")', 920, 175, 'success',
        'Первый getBean запускает конвейер из сцены 03. До этого момента жили только метаданные.',
        'AbstractBeanFactory#doGetBean', '01-core/02-bean-definition · DefinitionReportRunner.java'),
    ],
    edges: [
      edge('config-reader', 'config', 'reader'),
      edge('reader-greeter', 'reader', 'greeterDef'),
      edge('reader-lazy', 'reader', 'lazyDef', { hidden: true }),
      edge('reader-fallback', 'reader', 'registry', { hidden: true }),
      edge('greeter-registry', 'greeterDef', 'registry'),
      edge('lazy-registry', 'lazyDef', 'registry', { hidden: true }),
      edge('registry-instance', 'registry', 'instance'),
    ],
  },

  postprocessor: {
    number: '08',
    title: 'Точки расширения BPP',
    shortTitle: 'BeanPostProcessor',
    verb: 'Обработать бин',
    icon: 'cpu',
    module: '01-core/04-beanpostprocessor',
    logLabel: 'BPP',
    startKind: 'service',
    targetKind: 'caller',
    description: 'BeanPostProcessor видит каждый бин. Дайте ему @Logged и интерфейс — получите прокси с логированием.',
    defaults: { logged: true, iface: true },
    settings: [
      toggle('logged', '@Logged на классе', 'маркерная аннотация'),
      toggle('iface', 'Интерфейс GreetingService', 'нужен для JDK-прокси'),
    ],
    note(options) {
      if (options.logged && !options.iface) return { warning: true, text: 'JDK-прокси невозможен без интерфейса — BPP вернёт исходный бин, как в условии LoggingPostProcessor.' };
      if (!options.logged) return { warning: false, text: 'Без @Logged постпроцессор не трогает бин — вызовы пойдут напрямую.' };
      return { warning: false, text: 'Оба условия выполнены — бин будет заменён на JDK-прокси.' };
    },
    badge: () => 'BeanPostProcessor',
    visibility: [
      {
        when: (options) => options.logged && options.iface,
        showNodes: ['proxyBean'],
        showEdges: ['after-proxyBean', 'proxyBean-methodCall'],
        hideEdges: ['after-methodCall'],
      },
    ],
    nodes: [
      node('target', 'service', 'GreetingServiceImpl', '@Logged · @Component', 0, 175, 'core',
        'Обычный сервис с маркерной аннотацией @Logged и интерфейсом GreetingService.',
        'AbstractAutowireCapableBeanFactory#doCreateBean', '01-core/04-beanpostprocessor · GreetingServiceImpl.java'),
      node('before', 'bpp', 'postProcessBefore', 'все BPP подряд', 230, 175, 'core',
        'До init-методов каждый BPP видит бин и может вернуть другой объект.',
        'AbstractAutowireCapableBeanFactory#applyBeanPostProcessorsBeforeInitialization', '01-core/04-beanpostprocessor'),
      node('init', 'init', 'Initialization', '@PostConstruct', 230, 330, 'core',
        'Стандартный init-конвейер между before- и after-обработкой.',
        'AbstractAutowireCapableBeanFactory#initializeBean', '01-core/03-bean-lifecycle'),
      node('after', 'bpp', 'postProcessAfter', 'проверка @Logged', 460, 175, 'core',
        'LoggingPostProcessor решает: вернуть бин как есть или JDK-прокси с логированием.',
        'LoggingPostProcessor#postProcessAfterInitialization', '01-core/04-beanpostprocessor · LoggingPostProcessor.java'),
      node('proxyBean', 'proxy', 'JDK-прокси', 'LoggingInvocationHandler', 690, 175, 'core',
        'Proxy.newProxyInstance вернул обёртку. В контексте живёт прокси, а не GreetingServiceImpl.',
        'Proxy#newProxyInstance', '01-core/04-beanpostprocessor · LoggingInvocationHandler.java', { hidden: true }),
      node('methodCall', 'caller', 'greetingService.greet()', 'вызов из вашего кода', 920, 175, 'success',
        'Если бин стал прокси, вызов сначала попадает в LoggingInvocationHandler.',
        'LoggingInvocationHandler#invoke', '01-core/04-beanpostprocessor'),
    ],
    edges: [
      edge('target-before', 'target', 'before'),
      edge('before-init', 'before', 'init'),
      edge('init-after', 'init', 'after'),
      edge('after-proxyBean', 'after', 'proxyBean', { hidden: true }),
      edge('proxyBean-methodCall', 'proxyBean', 'methodCall', { hidden: true }),
      edge('after-methodCall', 'after', 'methodCall'),
    ],
  },

  autoconfig: {
    number: '09',
    title: 'Автоконфигурация молча',
    shortTitle: 'Auto-configuration',
    verb: 'Собрать приложение',
    icon: 'box',
    module: '02-boot/01-autoconfiguration',
    logLabel: 'AUTO-CONFIG',
    startKind: 'application',
    targetKind: 'ready',
    description: 'Одна аннотация — и Boot сам собирает контекст. Уберите Jackson и посмотрите, как фильтр отсеивает лишнее.',
    defaults: { jackson: true, userBean: false },
    settings: [
      toggle('jackson', 'Jackson в classpath', '@ConditionalOnClass'),
      toggle('userBean', 'Свой @Bean ObjectMapper', 'AppConfig имеет приоритет'),
    ],
    note(options) {
      if (options.userBean) return { warning: false, text: 'Ваш бин первым — JacksonAutoConfiguration отступит через @ConditionalOnMissingBean.' };
      if (!options.jackson) return { warning: true, text: 'Без Jackson его авто-конфигурация пропускается — так же WebFlux-конфигурация исчезает без webflux-starter.' };
      return { warning: false, text: 'JacksonAutoConfiguration пройдёт фильтр и добавит свой ObjectMapper.' };
    },
    badge: (options) => options.jackson ? 'кандидаты → подборка' : 'кандидаты отсеяны',
    visibility: [
      {
        when: (options) => options.userBean,
        showNodes: ['userOverride'],
        showEdges: ['selected-userOverride', 'userOverride-contextReady'],
        hideEdges: ['selected-contextReady'],
      },
    ],
    nodes: [
      node('application', 'application', 'AutoconfigurationApplication', '@SpringBootApplication', 0, 175, 'boot',
        'Одна аннотация запускает цепочку: component scan + @EnableAutoConfiguration + properties.',
        'SpringApplication#run', '02-boot/01-autoconfiguration'),
      node('enableAuto', 'imports', '@EnableAutoConfiguration', 'imports из всех JAR', 220, 175, 'boot',
        'Импорт-селектор читает списки автоконфигураций из META-INF/spring/*.imports каждого стартера на classpath.',
        'AutoConfigurationImportSelector#getAutoConfigurationEntry', '02-boot/01-autoconfiguration'),
      node('candidates', 'properties', 'Кандидаты собраны', 'сотни конфигураций', 440, 60, 'boot',
        'Boot знает множество конфигураций, но включит только подходящие под ваш classpath.',
        'AutoConfigurationImportSelector#selectImports', '02-boot/01-autoconfiguration'),
      node('classFilter', 'condition-class', '@ConditionalOnClass', 'Jackson на classpath?', 440, 220, 'boot',
        'Фильтр по classpath: нет класса — конфигурация молча пропускается. Так исчезают web-kafka-webflux конфигурации без своих стартеров.',
        'OnClassCondition#getMatchOutcome', '02-boot/02-conditional'),
      node('selected', 'auto-configuration', 'JacksonAutoConfiguration', 'прошла фильтры', 680, 175, 'boot',
        'Прошедшие фильтры конфигурации становятся обычными @Configuration — их бины попадут в контекст.',
        'ConfigurationClassBeanDefinitionReader#loadBeanDefinitions', '02-boot/01-autoconfiguration'),
      node('userOverride', 'custom-bean', 'Ваш ObjectMapper', '@Bean в AppConfig', 680, 360, 'custom',
        'Пользовательский @Bean имеет приоритет: авто-конфигурация отступит, если бин того же типа уже есть.',
        'OnBeanCondition#getMatchOutcome', '02-boot/01-autoconfiguration · AppConfig.java', { hidden: true }),
      node('contextReady', 'ready', 'Контекст собран', 'ваши + авто бины', 920, 175, 'success',
        'Итог: ваши бины + подошедшие авто-конфигурации. В модуле AutoconfigReportRunner печатает состав.',
        'AbstractApplicationContext#refresh', '02-boot/01-autoconfiguration'),
    ],
    edges: [
      edge('app-enable', 'application', 'enableAuto'),
      edge('enable-candidates', 'enableAuto', 'candidates'),
      edge('candidates-classFilter', 'candidates', 'classFilter'),
      edge('classFilter-selected', 'classFilter', 'selected'),
      edge('selected-contextReady', 'selected', 'contextReady'),
      edge('selected-userOverride', 'selected', 'userOverride', { hidden: true }),
      edge('userOverride-contextReady', 'userOverride', 'contextReady', { hidden: true }),
    ],
  },

  report: {
    number: '10',
    title: 'Чтение conditions report',
    shortTitle: 'Conditions Report',
    verb: 'Сформировать отчёт',
    icon: 'list',
    module: '02-boot/04-conditions-report',
    logLabel: 'REPORT',
    startKind: 'application',
    targetKind: 'actuator-endpoint',
    description: 'Boot объясняет каждое решение. Включите --debug, задайте property — и сверьте отчёт с фактическими бинами.',
    defaults: { debug: true, detailed: false },
    settings: [
      toggle('debug', '--debug при старте', 'печать отчёта в консоль'),
      toggle('detailed', 'visual.report.detailed=true', 'второй бин ReportService'),
    ],
    note(options) {
      if (!options.debug) return { warning: true, text: 'Без --debug консольный отчёт не печатается — останется только Actuator.' };
      if (options.detailed) return { warning: false, text: 'detailedReportService попадёт в positiveMatches — negativeMatches опустеет.' };
      return { warning: false, text: 'Отчёт покажет и совпадения, и отказы: negativeMatches — норма, а не ошибка.' };
    },
    badge: () => '--debug · /actuator/conditions',
    nodes: [
      node('appStart', 'application', 'Запуск с --debug', 'ConditionsReportApplication', 0, 175, 'boot',
        'Флаг --debug просит Boot печатать решения условий в консоль при старте.',
        'ConditionEvaluationReportLoggingApplicationListener', '02-boot/04-conditions-report'),
      node('evaluation', 'condition-evaluator', 'ConditionEvaluationReport', 'события условий', 230, 175, 'boot',
        'Каждое решение @Conditional фиксируется: какая конфигурация совпала или отсеялась и почему.',
        'ConditionEvaluationReport#recordEvaluation', '02-boot/04-conditions-report'),
      node('positive', 'positive-matches', 'positiveMatches', 'что создано', 460, 60, 'success',
        'Условия, которые прошли. Почти гарантия бина — финальную сверку делайте с /actuator/beans.',
        'ReportConfiguration · --debug log', '02-boot/04-conditions-report'),
      node('negative', 'negative-matches', 'negativeMatches', 'что отсеялось', 460, 220, 'custom',
        'Отказы — норма: так выглядит большинство автоконфигураций, не подошедших под classpath.',
        'ReportConfiguration · --debug log', '02-boot/04-conditions-report'),
      node('actuators', 'actuator-endpoint', '/actuator/conditions', '+ /actuator/beans', 690, 175, 'success',
        'Работающее приложение отдаёт те же решения по HTTP. Сверяйте отчёт с фактическими бинами.',
        'ConditionsReportEndpoint#conditions', '02-boot/04-conditions-report'),
    ],
    edges: [
      edge('start-evaluation', 'appStart', 'evaluation'),
      edge('evaluation-positive', 'evaluation', 'positive'),
      edge('evaluation-negative', 'evaluation', 'negative'),
      edge('positive-actuators', 'positive', 'actuators'),
      edge('negative-actuators', 'negative', 'actuators'),
    ],
  },

  lombok: {
    number: '11',
    title: 'Компиляция с Lombok',
    shortTitle: 'Lombok',
    verb: 'Скомпилировать',
    icon: 'code',
    module: '06-extras/01-lombok',
    logLabel: 'COMPILE',
    startKind: 'source-file',
    targetKind: 'generated-use',
    description: 'От 15 строк исходника до готовых методов в .class. Уберите @Builder — вызов builder() не скомпилируется.',
    defaults: { builder: true, plain: false },
    settings: [
      toggle('builder', '@Builder на классе', 'builder() + build()'),
      toggle('plain', 'Рукописный эквивалент', 'UserAccountPlain · ~130 строк'),
    ],
    note(options) {
      if (!options.builder) return { warning: true, text: 'builder() не сгенерируется — тест модуля упадёт ещё на этапе компиляции.' };
      if (options.plain) return { warning: false, text: 'Сравните: @Data-версия — 15 строк против ~130 строк руками. Поведение совпадает, это проверяет тест.' };
      return { warning: false, text: 'APT допишет getters, equals, toString и builder прямо в синтаксическое дерево — до байткода.' };
    },
    badge: (options) => options.builder ? '@Data @Builder @AllArgsConstructor' : '@Data @AllArgsConstructor',
    visibility: [
      { when: (options) => options.plain, showNodes: ['plain'], showEdges: ['ast-plain'] },
    ],
    nodes: [
      node('source', 'source-file', 'UserAccount.java', '@Data @Builder', 0, 140, 'core',
        'Четыре поля и три аннотации — 15 строк. Getters, equals, toString и builder не написаны руками вообще.',
        'UserAccount.java · javac', '06-extras/01-lombok · UserAccount.java'),
      node('apt', 'apt', 'javac + Lombok', 'annotation processing', 230, 140, 'core',
        'Lombok — процессор аннотаций: он изменяет синтаксическое дерево компилятора, а не генерирует соседние .java-файлы.',
        'lombok.launch.AnnotationProcessorHider', '06-extras/01-lombok · pom.xml'),
      node('ast', 'ast', 'AST дополнен', 'методы появились в дереве', 460, 140, 'core',
        'В дерево добавлены getUsername(), equals(), toString(), builder() и конструктор. Байткод ещё не сгенерирован.',
        'Lombok AST transformers', '06-extras/01-lombok · plain/UserAccountPlain.java'),
      node('plain', 'plain-class', 'UserAccountPlain', '~130 строк руками', 460, 330, 'custom',
        'Тот же контракт без Lombok: getters, setters, equals, hashCode, toString и Builder пишет человек. Тест проверяет, что поведение совпадает.',
        'plain/UserAccountPlain.java', '06-extras/01-lombok · plain/UserAccountPlain.java', { hidden: true }),
      node('bytecode', 'bytecode', 'UserAccount.class', 'обычный байткод', 690, 140, 'core',
        'javap -p покажет все методы. Следов Lombok в .class нет — в runtime библиотеки не существует.',
        'javap -p target/classes/.../UserAccount.class', '06-extras/01-lombok · javap'),
      node('usage', 'generated-use', 'Сгенерированное в работе', 'builder() · getters', 920, 140, 'success',
        'UserService собирает аккаунт через builder; equals, hashCode и toString проверяются тремя тестами модуля.',
        'LombokApplicationTests', '06-extras/01-lombok · UserService.java'),
    ],
    edges: [
      edge('source-apt', 'source', 'apt'),
      edge('apt-ast', 'apt', 'ast'),
      edge('ast-bytecode', 'ast', 'bytecode'),
      edge('ast-plain', 'ast', 'plain', { hidden: true }),
      edge('bytecode-usage', 'bytecode', 'usage'),
    ],
  },

  validation: {
    number: '12',
    title: 'Bean Validation',
    shortTitle: 'Validation',
    verb: 'Проверить данные',
    icon: 'shield',
    module: '06-extras/02-validation',
    logLabel: 'VALIDATE',
    startKind: 'dto',
    targetKind: 'validation-result',
    description: 'Ограничения на полях DTO, каскад @Valid и собственный валидатор. Испортите данные — нарушения соберутся в отчёт.',
    defaults: { validData: true, cascade: true },
    settings: [
      toggle('validData', 'Данные валидны', 'RegistrationRequest корректен'),
      toggle('cascade', '@Valid на address', 'каскад во вложенный Address'),
    ],
    note(options) {
      if (!options.validData) return { warning: true, text: `${options.cascade ? 6 : 4} нарушений соберутся в Set<ConstraintViolation> — в веб-приложении это 400 Bad Request.` };
      if (!options.cascade) return { warning: true, text: 'Без @Valid вложенный Address не проверяется: город и индекс останутся без надзора.' };
      return { warning: false, text: 'Все ограничения пройдены — объект можно передавать в бизнес-логику.' };
    },
    badge: (options) => options.validData ? '0 violations' : `${options.cascade ? 6 : 4} violations`,
    visibility: [
      { when: (options) => options.cascade, showNodes: ['nested'], showEdges: ['validator-nested', 'nested-violations'] },
    ],
    nodes: [
      node('dto', 'dto', 'RegistrationRequest', 'record + аннотации', 0, 175, 'core',
        'Инварианты объявлены на компонентах record — компилятор копирует аннотации на порождённые поля, движок читает их оттуда.',
        'RegistrationRequest.java', '06-extras/02-validation · RegistrationRequest.java'),
      node('validator', 'validator', 'Validator', 'LocalValidatorFactoryBean', 230, 175, 'boot',
        'Бин из ValidationAutoConfiguration: spring-boot-starter-validation подтянул Hibernate Validator, адаптер делает его Spring-бином.',
        'ValidationAutoConfiguration', '06-extras/02-validation · ValidationReportRunner.java'),
      node('builtin', 'constraint-builtin', 'Встроенные', '@NotBlank · @Email · @Min', 470, 25, 'core',
        'Стандартные ограничения из jakarta.validation.constraints. Сообщения — шаблоны: {min}, {max}, ${validatedValue}.',
        'ValidatorImpl#validate (Hibernate Validator)', '06-extras/02-validation · RegistrationRequest.java'),
      node('custom', 'constraint-custom', '@StrongPassword', 'свой ConstraintValidator', 470, 175, 'custom',
        'Аннотация-декларация ссылается на StrongPasswordValidator с логикой проверки. Движок находит валидатор по этой ссылке.',
        'StrongPasswordValidator#isValid', '06-extras/02-validation · StrongPasswordValidator.java'),
      node('nested', 'constraint-nested', 'Каскад @Valid', 'Address внутри', 470, 325, 'core',
        'Движок спускается во вложенный объект только при @Valid — иначе ограничения Address молча игнорируются.',
        'ValidatorImpl · cascaded validation', '06-extras/02-validation · Address.java'),
      node('violations', 'violations', 'ConstraintViolation', 'путь + сообщение', 710, 175, 'custom',
        'Каждое нарушение: propertyPath (например address.city), интерполированное сообщение и отклонённое значение.',
        'ConstraintViolationImpl', '06-extras/02-validation · ValidationReportRunner.java'),
      node('result', 'validation-result', 'Вердикт', 'использовать / отклонить', 940, 175, 'success',
        'Ноль нарушений — объект уходит в бизнес-логику. В веб-слое невалидный @Valid-аргумент превращается в 400.',
        'ValidationReportRunner#run', '06-extras/02-validation · ValidationApplicationTests.java'),
    ],
    edges: [
      edge('dto-validator', 'dto', 'validator'),
      edge('validator-builtin', 'validator', 'builtin'),
      edge('validator-custom', 'validator', 'custom'),
      edge('validator-nested', 'validator', 'nested'),
      edge('builtin-violations', 'builtin', 'violations'),
      edge('custom-violations', 'custom', 'violations'),
      edge('nested-violations', 'nested', 'violations'),
      edge('violations-result', 'violations', 'result'),
    ],
  },

  flyway: {
    number: '13',
    title: 'Миграции Flyway',
    shortTitle: 'Flyway',
    verb: 'Запустить migrate()',
    icon: 'database',
    module: '06-extras/03-flyway',
    logLabel: 'MIGRATE',
    startKind: 'migration-scripts',
    targetKind: 'ready',
    description: 'V1 и V2 применятся при старте, история запишется в flyway_schema_history. Измените V1 задним числом — checksum не сойдётся.',
    defaults: { newMigration: false, modified: false },
    settings: [
      toggle('newMigration', 'Новая V3__add_bio', 'ALTER TABLE вперёд'),
      toggle('modified', 'Правка V1 задним числом', 'checksum mismatch'),
    ],
    note(options) {
      if (options.modified) return { warning: true, text: 'При старте Flyway сверит checksum и откажется работать. Правильный путь — новая миграция V3.' };
      if (options.newMigration) return { warning: false, text: 'V1 и V2 уже в истории — применится только V3, в своей транзакции.' };
      return { warning: false, text: 'Diff с историей: V1 и V2 новые — будут применены по возрастанию версий.' };
    },
    badge: (options) => options.modified ? 'validate failed' : `migrate: ${options.newMigration ? 3 : 2} версии`,
    visibility: [
      { when: (options) => options.newMigration, showNodes: ['v3'], showEdges: ['scripts-v3', 'v3-engine'] },
    ],
    nodes: [
      node('scripts', 'migration-scripts', 'db/migration', 'V1 · V2 в classpath', 0, 175, 'core',
        'SQL-файлы лежат в ресурсах и попадают в classpath. Имя — контракт: V<версия>__<описание>.sql.',
        'ClasspathScanner · db/migration', '06-extras/03-flyway · V1__create_users.sql'),
      node('v3', 'migration-file', 'V3__add_bio.sql', 'ALTER TABLE users', 230, 330, 'custom',
        'Изменения схемы — только новым файлом: применённые миграции не редактируют никогда.',
        'Flyway#migrate · pending', '06-extras/03-flyway · README · эксперимент 1', { hidden: true }),
      node('engine', 'flyway-engine', 'Flyway#migrate', 'FlywayAutoConfiguration', 230, 175, 'boot',
        'Бин Flyway создаёт автоконфигурация, а migrate() выполняется до остальных бинов данных — JPA всегда видит готовую схему.',
        'Flyway#migrate', '06-extras/03-flyway · application.properties'),
      node('history', 'schema-history', 'flyway_schema_history', 'версии + checksum', 470, 175, 'data',
        'Источник истины: какие версии применены, когда и с каким checksum. По ней Flyway считает diff и ловит правки задним числом.',
        'TableSchemaHistory (Flyway)', '06-extras/03-flyway · FlywayReportRunner.java'),
      node('schema', 'database', 'Таблица users', 'DDL + 3 строки', 700, 175, 'data',
        'V1 создал таблицу, V2 посеял данные. Каждая миграция выполняется в собственной транзакции.',
        'FlywayReportRunner · SELECT COUNT(*)', '06-extras/03-flyway · V2__seed_users.sql'),
      node('app', 'ready', 'Приложение стартовало', 'FlywayReportRunner', 930, 175, 'success',
        'Схема готова до старта бизнес-бинов. Повторный запуск ничего не применит — миграции идемпотентны по истории.',
        'FlywayReportRunner#run', '06-extras/03-flyway · FlywayApplicationTests.java'),
    ],
    edges: [
      edge('scripts-engine', 'scripts', 'engine'),
      edge('scripts-v3', 'scripts', 'v3', { hidden: true }),
      edge('v3-engine', 'v3', 'engine', { hidden: true }),
      edge('engine-history', 'engine', 'history'),
      edge('history-schema', 'history', 'schema'),
      edge('schema-app', 'schema', 'app'),
    ],
  },
};

export const PALETTE = [
  { kind: 'component', label: 'Component', subtitle: '@Component', category: 'core', description: 'Пользовательский компонент для свободного маршрута.', breakpoint: 'ClassPathBeanDefinitionScanner#doScan', source: '01-core/01-component-scan' },
  { kind: 'bean-definition', label: 'Bean', subtitle: '@Bean lifecycle', category: 'core', description: 'Обычный бин с конвейером создания.', breakpoint: 'AbstractAutowireCapableBeanFactory#doCreateBean', source: '01-core/03-bean-lifecycle' },
  { kind: 'auto-configuration', label: 'Auto-config', subtitle: '@AutoConfiguration', category: 'boot', description: 'Дополнительная конфигурация с условием.', breakpoint: 'ConditionEvaluator#shouldSkip', source: '02-boot/02-conditional' },
  { kind: 'condition-evaluator', label: 'Condition', subtitle: '@Conditional', category: 'boot', description: 'Условие, решающее судьбу определения бина.', breakpoint: 'ConditionEvaluator#shouldSkip', source: '02-boot/02-conditional' },
  { kind: 'proxy', label: 'Proxy', subtitle: 'JDK / CGLIB', category: 'core', description: 'Прокси вокруг бина: advice вместо прямого вызова.', breakpoint: 'JdkDynamicAopProxy#invoke', source: '01-core/05-aop-proxies' },
  { kind: 'properties', label: 'Property source', subtitle: 'Environment', category: 'boot', description: 'Источник конфигурации приложения.', breakpoint: 'ConfigurationPropertiesBinder#bind', source: '02-boot/03-starters' },
  { kind: 'filter', label: 'Filter', subtitle: 'OncePerRequestFilter', category: 'security', description: 'Фильтр вокруг последующей цепочки.', breakpoint: 'OncePerRequestFilter#doFilter', source: '05-security/01-filter-chain' },
  { kind: 'controller', label: 'Controller', subtitle: '@RestController', category: 'web', description: 'Обработчик HTTP-запроса.', breakpoint: 'InvocableHandlerMethod#invokeForRequest', source: '03-web/01-dispatcher-servlet' },
  { kind: 'transaction', label: 'Service', subtitle: '@Transactional', category: 'data', description: 'Сервис с транзакционной границей.', breakpoint: 'TransactionInterceptor#invoke', source: '04-data/01-jpa-transactions' },
  { kind: 'repository', label: 'Repository', subtitle: 'JpaRepository', category: 'data', description: 'Прокси репозитория Spring Data.', breakpoint: 'JpaRepositoryFactory#getRepository', source: '04-data/01-jpa-transactions' },
  { kind: 'database', label: 'Database', subtitle: 'JDBC / SQL', category: 'data', description: 'Конечное хранилище данных.', breakpoint: 'JpaTransactionManager#doCommit', source: '04-data/01-jpa-transactions' },
];

export function createGraph(sceneId) {
  const scene = SCENES[sceneId];
  return {
    nodes: scene.nodes.map((item) => ({ ...item, position: { ...item.position }, data: { ...item.data } })),
    edges: scene.edges.map((item) => ({ ...item })),
  };
}

export function applyOptions(sceneId, options, nodes, edges) {
  const scene = SCENES[sceneId];
  if (!scene?.visibility?.length) return { nodes, edges };
  const hiddenNodeIds = new Set();
  const hiddenEdgeIds = new Set();
  scene.visibility.forEach((rule) => {
    const active = rule.when(options);
    const nodeIds = active ? (rule.hideNodes || []) : (rule.showNodes || []);
    const edgeIds = active ? (rule.hideEdges || []) : (rule.showEdges || []);
    nodeIds.forEach((id) => hiddenNodeIds.add(id));
    edgeIds.forEach((id) => hiddenEdgeIds.add(id));
  });
  return {
    nodes: nodes.map((item) => hiddenNodeIds.has(item.id) ? { ...item, hidden: true } : { ...item, hidden: false }),
    edges: edges.map((item) => hiddenEdgeIds.has(item.id) ? { ...item, hidden: true } : { ...item, hidden: false }),
  };
}
