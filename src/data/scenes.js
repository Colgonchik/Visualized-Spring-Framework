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

export const SCENES = {
  boot: {
    number: '01',
    title: 'Запуск контейнера',
    shortTitle: 'Spring Boot',
    verb: 'Запустить контейнер',
    description: 'От аннотации до готового бина. Измените условия и посмотрите, как Boot пересоберёт маршрут.',
    targetKind: 'ready',
    defaults: { enabled: true, custom: false },
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
    description: 'Пройдите от браузера до базы данных. Отключите credentials или вызовите исключение — маршрут изменится.',
    targetKind: 'database',
    defaults: { endpoint: 'private', credentials: true, failure: false },
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
};

export const PALETTE = [
  { kind: 'component', label: 'Component', subtitle: '@Component', category: 'core', description: 'Пользовательский компонент для свободного маршрута.', breakpoint: 'ClassPathBeanDefinitionScanner#doScan', source: '01-core/01-component-scan' },
  { kind: 'auto-configuration', label: 'Auto-config', subtitle: '@AutoConfiguration', category: 'boot', description: 'Дополнительная конфигурация с условием.', breakpoint: 'ConditionEvaluator#shouldSkip', source: '02-boot/02-conditional' },
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
  if (sceneId !== 'boot') return { nodes, edges };
  return {
    nodes: nodes.map((item) => item.data.kind === 'custom-bean' ? { ...item, hidden: !options.custom } : item),
    edges: edges.map((item) => item.source === 'custom' ? { ...item, hidden: !options.custom } : item),
  };
}
