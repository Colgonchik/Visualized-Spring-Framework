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
