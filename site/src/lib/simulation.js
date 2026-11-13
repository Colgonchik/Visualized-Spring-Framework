import { SCENES } from '../data/scenes.js';

function errorTrace(title, detail) {
  return { steps: [{ id: 'invalid', title, detail, status: 'error', nodeId: null, edgeIds: [] }], outcome: 'error' };
}

function graphOrder(nodes, edges, startKind, targetKind) {
  const start = nodes.find((item) => item.data.kind === startKind);
  const target = nodes.find((item) => item.data.kind === targetKind);
  if (!start || !target) {
    return { error: errorTrace('Маршрут не собран', `Добавьте стартовый узел ${startKind} и конечный узел ${targetKind}, затем соедините их.`) };
  }

  const adjacency = new Map(nodes.map((item) => [item.id, []]));
  edges.forEach((item) => {
    if (adjacency.has(item.source) && adjacency.has(item.target)) adjacency.get(item.source).push(item.target);
  });
  const connected = new Set([start.id]);
  const queue = [start.id];
  while (queue.length) {
    const current = queue.shift();
    const neighbors = [...adjacency.get(current)];
    nodes.forEach((item) => {
      if (edges.some((link) => link.target === current && link.source === item.id)) neighbors.push(item.id);
    });
    neighbors.forEach((next) => {
      if (!connected.has(next)) {
        connected.add(next);
        queue.push(next);
      }
    });
  }

  const relevant = nodes.filter((item) => connected.has(item.id));
  const incoming = new Map(relevant.map((item) => [item.id, 0]));
  edges.forEach((item) => {
    if (incoming.has(item.source) && incoming.has(item.target)) incoming.set(item.target, incoming.get(item.target) + 1);
  });
  const available = relevant.filter((item) => incoming.get(item.id) === 0).map((item) => item.id);
  const ordered = [];
  while (available.length) {
    const id = available.shift();
    ordered.push(nodes.find((item) => item.id === id));
    adjacency.get(id).filter((next) => incoming.has(next)).forEach((next) => {
      incoming.set(next, incoming.get(next) - 1);
      if (incoming.get(next) === 0) available.push(next);
    });
  }
  if (ordered.length !== relevant.length) {
    return { error: errorTrace('Обнаружен цикл', 'Учебный маршрут должен быть направленным графом без циклов. Удалите обратное соединение.') };
  }
  if (!ordered.some((item) => item.id === target.id)) {
    return { error: errorTrace('Нет связи с целью', 'Соедините стартовый узел с конечным компонентом сцены.') };
  }
  return { ordered };
}

function toSteps(ordered, edges, mapper, options) {
  const steps = [];
  for (const item of ordered) {
    const step = mapper(item, options);
    step.id = `${item.id}-${steps.length}`;
    step.edgeIds = edges.filter((link) => link.target === item.id).map((link) => link.id);
    steps.push(step);
  }
  return steps;
}

const fallbackStep = (item) => ({ nodeId: item.id, status: 'success', edgeIds: [], title: item.data.label, detail: item.data.description || 'Пользовательский узел включён в маршрут.' });

function bootStep(item, options) {
  const common = { nodeId: item.id, status: 'success', edgeIds: [] };
  const descriptions = {
    application: ['Точка входа найдена', '@SpringBootApplication запускает сборку контекста.'],
    scan: ['Компоненты обнаружены', 'Classpath просканирован. В BeanFactory появились BeanDefinition.'],
    imports: ['Кандидаты импортированы', 'Import selector прочитал AutoConfiguration.imports.'],
    properties: ['Настройки прочитаны', `visual.greeting.enabled = ${options.enabled}`],
    bpp: ['Постобработка завершена', 'BeanPostProcessor проверил бин и вернул его контейнеру.'],
    'custom-bean': ['Выбран ваш бин', 'Пользовательский GreeterService создан раньше автоконфигурации.'],
  };
  if (descriptions[item.data.kind]) {
    const [title, detail] = descriptions[item.data.kind];
    return { ...common, title, detail };
  }
  if (item.data.kind === 'auto-configuration') {
    const skipped = !options.enabled || options.custom;
    const reason = !options.enabled ? 'visual.greeting.enabled = false' : 'пользовательский @Bean уже существует';
    return { ...common, title: skipped ? 'Автоконфигурация отступила' : 'Условия выполнены',
      detail: skipped ? `@Conditional: ${reason}.` : '@ConditionalOnProperty и @ConditionalOnMissingBean разрешают создание.',
      status: skipped ? 'skipped' : 'success' };
  }
  if (item.data.kind === 'service') {
    const skipped = !options.enabled || options.custom;
    return { ...common, title: skipped ? 'Бин стартера не создан' : 'GreeterService создан',
      detail: skipped ? 'Boot не регистрирует собственный GreeterService.' : '@Bean-метод вернул объект; singleton сохранён в контексте.',
      status: skipped ? 'skipped' : 'success' };
  }
  if (item.data.kind === 'ready') {
    if (!options.enabled) return { ...common, status: 'error', title: 'Приложение не запустилось', detail: 'StarterReportRunner требует отсутствующий GreeterService — так устроен реальный Java-пример.' };
    return { ...common, title: 'Контекст готов', detail: 'StarterReportRunner может получить GreeterService и напечатать приветствие.' };
  }
  return fallbackStep(item);
}

function requestStep(item, options) {
  const common = { nodeId: item.id, status: 'success', edgeIds: [] };
  const descriptions = {
    client: ['Запрос сформирован', `GET /${options.endpoint}${options.endpoint === 'private' && options.credentials ? ' · Authorization: Basic •••' : ''}`],
    filter: ['Цепочка фильтров', 'VisualHeaderFilter добавил X-Visual-SB. Запрос ещё не попал в MVC.'],
    dispatcher: ['Handler выбран', 'RequestMappingHandlerMapping нашёл @GetMapping; DispatcherServlet получил HandlerExecutionChain.'],
    interceptor: ['preHandle() → true', 'Interceptor разрешил вызов контроллера.'],
    controller: ['Контроллер вызван', 'Аргументы связаны с параметрами запроса. Метод вернул Java-объект.'],
    transaction: ['Транзакция начата', 'AOP-прокси вызвал TransactionInterceptor до метода сервиса.'],
    repository: ['Вызов repository proxy', 'Spring Data делегировал операцию реализации JPA.'],
    database: [options.failure ? 'INSERT выполнен, commit ещё нет' : 'Работа с БД завершена', options.failure ? 'Сейчас сервис выбросит IllegalStateException.' : 'Hibernate выполнил SQL; транзакция готова к commit.'],
  };
  if (item.data.kind === 'auth') {
    if (options.endpoint === 'public') return { ...common, title: 'Доступ разрешён', detail: 'permitAll: фильтры Security выполняются, но аутентификация не требуется.' };
    if (!options.credentials) return { ...common, status: 'error', title: '401 Unauthorized', detail: 'Credentials отсутствуют или неверны. AuthorizationFilter не пускает запрос дальше.' };
    return { ...common, title: 'Пользователь аутентифицирован', detail: 'Authentication сохранён в SecurityContext. Запрос может двигаться дальше.' };
  }
  if (descriptions[item.data.kind]) {
    const [title, detail] = descriptions[item.data.kind];
    return { ...common, title, detail };
  }
  return fallbackStep(item);
}

function lifecycleStep(item, options) {
  const common = { nodeId: item.id, status: 'success', edgeIds: [] };
  const descriptions = {
    'bean-definition': ['Чертёж найден', 'BeanDefinition LifeCycleBean получена из BeanFactory. Живого объекта ещё нет.'],
    instantiate: ['Объект создан', 'createBeanInstance вызвал конструктор. @Autowired-поля пока null.'],
    populate: ['Зависимости внедрены', 'populateBean заполнил поля. С этого шага зависимостями безопасно пользоваться.'],
  };
  if (descriptions[item.data.kind]) {
    const [title, detail] = descriptions[item.data.kind];
    return { ...common, title, detail };
  }
  if (item.data.kind === 'init') {
    if (options.initFailure) {
      return { ...common, status: 'error', title: 'Init-этап упал', detail: '@PostConstruct бросил исключение. Spring оборачивает его в BeanCreationException — бин не будет создан.' };
    }
    return { ...common, title: 'Инициализация завершена', detail: '@PostConstruct → afterPropertiesSet → customInit в фиксированном порядке. Порядок проверяется тестом модуля 03.' };
  }
  if (item.data.kind === 'bpp') {
    if (options.proxyWrap) {
      return { ...common, title: 'Бин обёрнут в прокси', detail: 'BeanPostProcessor вернул прокси вместо исходного объекта. В контексте живёт обёртка — так работает @Transactional (сцена 04).' };
    }
    return { ...common, title: 'Post-обработка завершена', detail: 'Бин прошёл postProcessAfterInitialization без изменений.' };
  }
  if (item.data.kind === 'ready-bean') {
    if (options.initFailure) {
      return { ...common, status: 'error', title: 'Контекст не поднялся', detail: 'Упавший singleton останавливает всё приложение — так же ведёт себя реальный модуль 03.' };
    }
    return { ...common, title: 'Бин готов', detail: options.proxyWrap
      ? 'В контексте живёт прокси LifeCycleBean. Все вызовы идут через обёртку.'
      : 'LifeCycleBean доступен остальным бинам. Порядок всех событий зафиксирован в LifecycleLog.' };
  }
  return fallbackStep(item);
}

function proxyStep(item, options) {
  const common = { nodeId: item.id, status: 'success', edgeIds: [] };
  if (item.data.kind === 'caller') {
    return { ...common, title: 'Вызов принят прокси', detail: 'В переменной accountService лежит прокси. Вызов перехвачен до настоящего объекта.' };
  }
  if (item.data.kind === 'proxy') {
    const detail = options.proxyType === 'jdk'
      ? 'JDK-прокси: jdk.proxy2.$Proxy… реализует интерфейс бина. Без интерфейса этот тип невозможен.'
      : 'CGLIB-прокси: AccountServiceImpl$$SpringCGLIB$$0 наследует класс бина. Final-методы перехватить не выйдет.';
    return { ...common, title: 'Прокси перехватило вызов', detail };
  }
  if (item.data.kind === 'tx-interceptor') {
    return { ...common, title: 'Транзакция открыта', detail: 'TransactionInterceptor вызвал BEGIN до метода. Advice из @Transactional применён.' };
  }
  if (item.data.kind === 'target-method') {
    return { ...common, title: 'Настоящий метод выполняется', detail: 'Код AccountServiceImpl.transfer() работает внутри открытой транзакции.' };
  }
  if (item.data.kind === 'self-call') {
    return { ...common, status: 'skipped', title: 'this-вызов миновал прокси', detail: 'transfer() вызван напрямую из объекта. Перехватчик не участвует — внутренний вызов выполнился без своей транзакции.' };
  }
  if (item.data.kind === 'commit') {
    if (options.failure) {
      return { ...common, status: 'error', title: 'ROLLBACK', detail: 'Исключение покинуло @Transactional-метод. LoggingTransactionManager печатает ROLLBACK.' };
    }
    return { ...common, title: 'COMMIT', detail: options.internalCall
      ? 'Внешняя транзакция зафиксирована, но внутренний this-вызов остался без своей.'
      : 'Метод завершился без исключений. LoggingTransactionManager печатает COMMIT.' };
  }
  return fallbackStep(item);
}

function conditionStep(item, options) {
  const common = { nodeId: item.id, status: 'success', edgeIds: [] };
  if (item.data.kind === 'condition-evaluator') {
    return { ...common, title: 'Оценка условий начата', detail: 'У каждого @Bean проверяются аннотации @Conditional. Решение принимается до создания объекта.' };
  }
  if (item.data.kind === 'condition-property') {
    if (!options.property) {
      return { ...common, status: 'skipped', title: 'Property не совпала', detail: 'feature.notifications.enabled ≠ true. Условие провалено — без ошибки, определение пропускается.' };
    }
    return { ...common, title: 'Property совпала', detail: 'feature.notifications.enabled = true. @ConditionalOnProperty выполнено.' };
  }
  if (item.data.kind === 'condition-class') {
    if (!options.jackson) {
      return { ...common, status: 'skipped', title: 'Класса нет в classpath', detail: 'ObjectMapper отсутствует. Условие провалено; класс бина даже не загружается в JVM.' };
    }
    return { ...common, title: 'Класс найден в classpath', detail: 'ObjectMapper доступен — @ConditionalOnClass выполнено.' };
  }
  if (item.data.kind === 'condition-bean') {
    if (options.userBean) {
      return { ...common, status: 'skipped', title: 'Уступает пользовательскому бину', detail: 'В контексте уже есть ваш FeatureService. @ConditionalOnMissingBean запрещает дубль.' };
    }
    return { ...common, title: 'Пользовательский бин не найден', detail: '@ConditionalOnMissingBean выполнено — автоконфигурация может создать бин.' };
  }
  if (item.data.kind === 'feature-service') {
    const blocked = !options.property || !options.jackson || options.userBean;
    if (blocked) {
      const reason = options.userBean ? 'пользовательский @Bean имеет приоритет' : 'хотя бы одно условие провалено';
      return { ...common, status: 'skipped', title: 'Бин не зарегистрирован', detail: `FeatureService пропущен: ${reason}. В отчёте это negativeMatches.` };
    }
    return { ...common, title: 'FeatureService зарегистрирован', detail: 'Все условия выполнены. BeanDefinition попала в контекст — объект появится при старте.' };
  }
  if (item.data.kind === 'report') {
    const matched = [options.property, options.jackson, !options.userBean].filter(Boolean).length;
    return { ...common, title: 'Отчёт сформирован', detail: `positiveMatches: ${matched} · negativeMatches: ${3 - matched}. В модуле 04 это /actuator/conditions и --debug.` };
  }
  return fallbackStep(item);
}

function buildBoot(ordered, edges, options) {
  return { steps: toSteps(ordered, edges, bootStep, options), outcome: options.enabled ? 'success' : 'error' };
}

function buildRequest(ordered, edges, options) {
  const steps = [];
  for (const item of ordered) {
    const step = requestStep(item, options);
    step.id = `${item.id}-${steps.length}`;
    step.edgeIds = edges.filter((link) => link.target === item.id).map((link) => link.id);
    steps.push(step);
    if (item.data.kind === 'auth' && step.status === 'error') {
      steps.push({ id: 'response-401', nodeId: 'client', edgeIds: edges.map((link) => link.id), phase: 'response', status: 'error',
        title: '401 · запрос остановлен', detail: 'Controller не вызывался. ExceptionTranslationFilter сформировал ответ с X-Visual-SB.' });
      return { steps, outcome: 'unauthorized' };
    }
  }
  const failed = options.failure;
  if (failed) {
    const transaction = ordered.find((item) => item.data.kind === 'transaction');
    steps.push({ id: 'rollback', nodeId: transaction?.id, edgeIds: [], status: 'error', title: 'rollback',
      detail: 'IllegalStateException покинуло @Transactional-метод. INSERT отменён; count() не изменился.' });
  }
  steps.push({ id: 'response', nodeId: 'client', edgeIds: edges.map((link) => link.id), phase: 'response', status: failed ? 'error' : 'success',
    title: failed ? '500 · изменения отменены' : '200 OK · application/json',
    detail: failed ? 'Исключение прошло через MVC; в учебной модели возвращается ошибка. Данные не сохранены.' : 'HttpMessageConverter превратил объект в JSON. Фильтры завершают работу в обратном порядке.' });
  return { steps, outcome: failed ? 'rollback' : 'success' };
}

function buildLifecycle(ordered, edges, options) {
  return { steps: toSteps(ordered, edges, lifecycleStep, options), outcome: options.initFailure ? 'error' : 'success' };
}

function buildProxies(ordered, edges, options) {
  return { steps: toSteps(ordered, edges, proxyStep, options), outcome: options.failure ? 'rollback' : 'success' };
}

function buildConditions(ordered, edges, options) {
  return { steps: toSteps(ordered, edges, conditionStep, options), outcome: 'success' };
}

function scanStep(item, options) {
  const common = { nodeId: item.id, status: 'success', edgeIds: [] };
  if (item.data.kind === 'application') {
    return { ...common, title: 'Сканирование запущено', detail: '@ComponentScan читает basePackages и индекс classpath.' };
  }
  if (item.data.kind === 'scan') {
    return { ...common, title: 'Базовый пакет обойден', detail: 'Найдены классы со стереотипами @Component, @Service, @Repository.' };
  }
  if (item.id === 'plain') {
    return { ...common, title: 'Кандидат принят', detail: 'Имя бина сгенерируется из класса: plainComponent.' };
  }
  if (item.id === 'named') {
    return { ...common, title: 'Кандидат принят', detail: 'Явное имя из аннотации: renamedComponent.' };
  }
  if (item.id === 'internal') {
    if (!options.excluded) {
      return { ...common, title: 'InternalComponent принят', detail: 'Фильтр выключен — внутренний компонент попадёт в контекст.' };
    }
    return { ...common, status: 'skipped', title: 'InternalComponent отброшен', detail: 'Регекс excluded\\..* сработал до регистрации метаданных.' };
  }
  if (item.id === 'filter') {
    return { ...common, title: options.excluded ? 'Фильтр применён' : 'Фильтр отключён',
      detail: options.excluded ? 'Кандидаты из excluded.* отсеяны до создания BeanDefinition.' : 'Ничего не отбраковывается: сканируется всё подряд.' };
  }
  if (item.data.kind === 'ready') {
    const internalFate = options.internal && options.excluded ? ' internalComponent исключён фильтром.' : '';
    return { ...common, title: 'BeanDefinition зарегистрированы', detail: `plainComponent и renamedComponent стали метаданными.${internalFate}` };
  }
  return fallbackStep(item);
}

function definitionStep(item, options) {
  const common = { nodeId: item.id, status: 'success', edgeIds: [] };
  if (item.data.kind === 'auto-configuration') {
    return { ...common, title: 'Описания собраны', detail: '@Bean-методы AppConfig превращены в метаданные — объектов нет.' };
  }
  if (item.data.kind === 'metadata-reader') {
    return { ...common, title: 'Реестр открыт', detail: 'BeanDefinitionRegistryPostProcessor может править определения до создания бинов.' };
  }
  if (item.id === 'greeterDef') {
    return { ...common, title: '«greeter» зарегистрирован программно', detail: 'new RootBeanDefinition(Greeter.class) — только метаданные, экземпляра нет.' };
  }
  if (item.id === 'lazyDef') {
    return { ...common, title: 'lazyInit = true', detail: 'expensiveService не будет создан при старте контекста.' };
  }
  if (item.data.kind === 'definition-registry') {
    const parts = [];
    if (options.programmatic) parts.push('greeter (программно)');
    parts.push('timeProvider (@Bean)');
    if (options.lazy) parts.push('expensiveService помечен lazy');
    return { ...common, title: 'Реестр метаданных заполнен', detail: `${parts.join(', ')}. containsSingleton() == false — живых объектов нет.` };
  }
  if (item.data.kind === 'instantiation-point') {
    if (options.lazy) {
      return { ...common, title: 'Создание отложено до getBean', detail: 'В модуле 02 containsSingleton("expensiveService") == false до первого запроса.' };
    }
    return { ...common, title: 'Экземпляр создан при старте', detail: 'Singleton прошёл конвейер создания ещё до завершения run().' };
  }
  return fallbackStep(item);
}

function postprocessorStep(item, options) {
  const common = { nodeId: item.id, status: 'success', edgeIds: [] };
  const proxied = options.logged && options.iface;
  if (item.data.kind === 'service') {
    return { ...common, title: 'Бин создан', detail: 'GreetingServiceImpl прошёл populate и готов к обработке постпроцессорами.' };
  }
  if (item.id === 'before') {
    return { ...common, title: 'Before-обработка', detail: 'Каждый BPP получил бин до init-методов.' };
  }
  if (item.data.kind === 'init') {
    return { ...common, title: 'Init-этапы выполнены', detail: '@PostConstruct и afterPropertiesSet отработали между before и after.' };
  }
  if (item.id === 'after') {
    if (!options.logged) {
      return { ...common, status: 'skipped', title: 'Нет @Logged', detail: 'LoggingPostProcessor вернул бин без изменений — аннотации-маркера нет.' };
    }
    if (!options.iface) {
      return { ...common, status: 'skipped', title: 'Нет интерфейса', detail: 'JDK-прокси невозможен — бин без интерфейса, возвращён исходный объект.' };
    }
    return { ...common, title: 'Бин заменён на прокси', detail: 'Proxy.newProxyInstance вернул обёртку с LoggingInvocationHandler.' };
  }
  if (item.data.kind === 'proxy') {
    return { ...common, title: 'В контексте — прокси', detail: 'Все вызовы greet() пойдут через handler с замером времени.' };
  }
  if (item.data.kind === 'caller') {
    if (proxied) {
      return { ...common, title: 'Вызов перехвачен', detail: 'LoggingInvocationHandler залогировал вызов и делегировал в GreetingServiceImpl.' };
    }
    return { ...common, title: 'Прямой вызов', detail: 'Обёртки нет — вызов попал сразу в реализацию без логирования.' };
  }
  return fallbackStep(item);
}

function autoconfigStep(item, options) {
  const common = { nodeId: item.id, status: 'success', edgeIds: [] };
  if (item.data.kind === 'application') {
    return { ...common, title: 'Автоконфигурация запущена', detail: '@EnableAutoConfiguration передал управление import-селектору.' };
  }
  if (item.data.kind === 'imports') {
    return { ...common, title: 'Список кандидатов прочитан', detail: 'Все *.imports из JAR на classpath собраны в единый список кандидатов.' };
  }
  if (item.id === 'candidates') {
    return { ...common, title: 'Кандидаты собраны', detail: 'Сотни автоконфигураций ждут фильтрации по условиям.' };
  }
  if (item.id === 'classFilter') {
    if (options.jackson) {
      return { ...common, title: 'Jackson найден', detail: 'JacksonAutoConfiguration проходит @ConditionalOnClass.' };
    }
    return { ...common, status: 'skipped', title: 'Jackson нет в classpath', detail: 'Конфигурация отсеяна на фильтре — так исчезают web-, kafka-, webflux-автоконфигурации без своих стартеров.' };
  }
  if (item.id === 'selected') {
    if (!options.jackson) {
      return { ...common, status: 'skipped', title: 'Не прошла фильтр', detail: 'Без Jackson эта конфигурация не регистрируется.' };
    }
    if (options.userBean) {
      return { ...common, status: 'skipped', title: 'Отступила перед вашим бином', detail: 'ObjectMapper уже определён в AppConfig — @ConditionalOnMissingBean сработал.' };
    }
    return { ...common, title: 'Конфигурация принята', detail: 'JacksonAutoConfiguration добавит ObjectMapper в контекст.' };
  }
  if (item.id === 'userOverride') {
    return { ...common, title: 'Ваш @Bean зарегистрирован', detail: 'AppConfig#objectMapper имеет приоритет над автоконфигурацией.' };
  }
  if (item.data.kind === 'ready') {
    if (options.userBean) {
      return { ...common, title: 'Контекст собран', detail: 'ObjectMapper в контексте — ваш, из AppConfig.' };
    }
    if (!options.jackson) {
      return { ...common, title: 'Контекст собран без ObjectMapper', detail: 'Ни авто, ни ваш — бина нет. Вызовы getBean(ObjectMapper) упадут.' };
    }
    return { ...common, title: 'Контекст собран', detail: 'Ваши бины + JacksonAutoConfiguration. AutoconfigReportRunner печатает состав.' };
  }
  return fallbackStep(item);
}

function reportStep(item, options) {
  const common = { nodeId: item.id, status: 'success', edgeIds: [] };
  if (item.data.kind === 'application') {
    if (!options.debug) {
      return { ...common, status: 'skipped', title: 'Отчёт отключён', detail: 'Без --debug решения условий не печатаются. Данные всё ещё доступны через Actuator.' };
    }
    return { ...common, title: 'Отладка включена', detail: '--debug: Boot напечатает CONDITIONS EVALUATION REPORT в консоль.' };
  }
  if (item.data.kind === 'condition-evaluator') {
    return { ...common, title: 'Решения собраны', detail: 'Каждый @Conditional оставил запись: конфигурация и исход оценки.' };
  }
  if (item.data.kind === 'positive-matches') {
    if (options.detailed) {
      return { ...common, title: 'positiveMatches: оба бина', detail: 'visual.report.detailed=true — reportService и detailedReportService созданы.' };
    }
    return { ...common, title: 'positiveMatches: reportService', detail: 'Обычный отчёт создан. detailedReportService сюда не попал.' };
  }
  if (item.data.kind === 'negative-matches') {
    if (options.detailed) {
      return { ...common, title: 'negativeMatches пуст', detail: 'Все условия модуля 04 выполнены — отказы закончились.' };
    }
    return { ...common, title: 'negativeMatches: detailedReportService', detail: '@ConditionalOnProperty(visual.report.detailed) не совпала — так задумано, ошибки нет.' };
  }
  if (item.data.kind === 'actuator-endpoint') {
    return { ...common, title: 'Actuator отвечает', detail: 'GET /actuator/conditions показывает те же группы; /actuator/beans — фактический список бинов.' };
  }
  return fallbackStep(item);
}

function buildScan(ordered, edges, options) {
  return { steps: toSteps(ordered, edges, scanStep, options), outcome: 'success' };
}

function buildDefinition(ordered, edges, options) {
  return { steps: toSteps(ordered, edges, definitionStep, options), outcome: 'success' };
}

function buildPostprocessor(ordered, edges, options) {
  return { steps: toSteps(ordered, edges, postprocessorStep, options), outcome: 'success' };
}

function buildAutoconfig(ordered, edges, options) {
  return { steps: toSteps(ordered, edges, autoconfigStep, options), outcome: 'success' };
}

function buildReport(ordered, edges, options) {
  return { steps: toSteps(ordered, edges, reportStep, options), outcome: 'success' };
}

function lombokStep(item, options) {
  const common = { nodeId: item.id, status: 'success', edgeIds: [] };
  if (item.data.kind === 'source-file') {
    return { ...common, title: 'Исходник прочитан', detail: 'UserAccount.java: четыре поля и три аннотации. 15 строк — ни одного метода руками.' };
  }
  if (item.data.kind === 'apt') {
    return { ...common, title: 'APT изменил дерево', detail: 'Lombok — annotation processor: он редактирует синтаксическое дерево javac, а не создаёт соседние .java-файлы.' };
  }
  if (item.data.kind === 'ast') {
    return { ...common, title: 'Методы появились в AST', detail: options.builder
      ? 'getters, setters, equals, hashCode, toString, all-args-конструктор и builder() — всё дописано в дерево.'
      : 'getters, setters, equals, hashCode, toString и all-args-конструктор. Без @Builder метода builder() в дереве нет.' };
  }
  if (item.data.kind === 'plain-class') {
    return { ...common, title: 'Рукописный двойник', detail: 'UserAccountPlain: ~130 строк делают то же самое. Тест модуля проверяет, что поведение совпадает.' };
  }
  if (item.data.kind === 'bytecode') {
    return { ...common, title: '.class сгенерирован', detail: options.builder
      ? 'javap -p покажет builder() и вложенный UserAccount$UserAccountBuilder.'
      : 'javap -p покажет методы @Data. Класса UserAccount$UserAccountBuilder в байткоде нет.' };
  }
  if (item.data.kind === 'generated-use') {
    if (!options.builder) {
      return { ...common, status: 'error', title: 'Компиляция сломана', detail: 'UserAccount.builder() не существует без @Builder — LombokApplicationTests падает на этапе compile, а не в runtime.' };
    }
    return { ...common, title: 'builder() скомпилирован и работает', detail: 'UserService собирает аккаунт: UserAccount.builder()…build(). Три теста модуля зелёные.' };
  }
  return fallbackStep(item);
}

function validationStep(item, options) {
  const common = { nodeId: item.id, status: 'success', edgeIds: [] };
  if (item.data.kind === 'dto') {
    return { ...common, title: 'DTO описывает свои инварианты', detail: 'Аннотации на компонентах record копируются компилятором на поля — движок читает их оттуда.' };
  }
  if (item.data.kind === 'validator') {
    return { ...common, title: 'Validator готов', detail: 'LocalValidatorFactoryBean из ValidationAutoConfiguration — адаптер над Hibernate Validator, внедряется как обычный бин.' };
  }
  if (item.data.kind === 'constraint-builtin') {
    if (!options.validData) {
      return { ...common, status: 'error', title: 'Нарушения: username, email, age', detail: '«ne» короче 3 символов, «not-an-email» не email, 12 меньше 18.' };
    }
    return { ...common, title: 'Встроенные ограничения пройдены', detail: '@NotBlank, @Size, @Email, @Min/@Max — все шаблоны сообщений остались неиспользованными.' };
  }
  if (item.data.kind === 'constraint-custom') {
    if (!options.validData) {
      return { ...common, status: 'error', title: '@StrongPassword отклонил «weak»', detail: 'StrongPasswordValidator: минимум 8 символов, хотя бы одна цифра и заглавная буква.' };
    }
    return { ...common, title: 'Собственный валидатор пропустил пароль', detail: 'StrongPasswordValidator#isValid вернул true: длина, цифра и заглавная на месте.' };
  }
  if (item.data.kind === 'constraint-nested') {
    if (!options.validData) {
      return { ...common, status: 'error', title: 'address.city, address.zipCode', detail: 'Каскад @Valid добрался до вложенного объекта: пустой город и индекс из трёх цифр.' };
    }
    return { ...common, title: 'Address проверен каскадом', detail: '@Valid на поле address включил спуск во вложенный объект: город и индекс валидны.' };
  }
  if (item.data.kind === 'violations') {
    if (!options.validData) {
      const count = options.cascade ? 6 : 4;
      return { ...common, status: 'error', title: `${count} нарушений собраны`, detail: 'Set<ConstraintViolation>: propertyPath вида address.city + интерполированное сообщение каждого ограничения.' };
    }
    return { ...common, title: '0 нарушений', detail: 'Множество ConstraintViolation пусто — данные соответствуют контракту.' };
  }
  if (item.data.kind === 'validation-result') {
    if (!options.validData) {
      return { ...common, status: 'error', title: 'Объект отклонён', detail: 'В веб-приложении тот же движок включается @Valid на аргументе контроллера — клиент получит 400 Bad Request.' };
    }
    return { ...common, title: 'Данные под контролем', detail: 'Запрос валиден — объект можно передавать в бизнес-логику. Проверяется тестом модуля 12.' };
  }
  return fallbackStep(item);
}

function flywayStep(item, options) {
  const common = { nodeId: item.id, status: 'success', edgeIds: [] };
  if (item.data.kind === 'migration-scripts') {
    return { ...common, title: 'Скрипты найдены в classpath', detail: options.newMigration
      ? 'classpath:db/migration — V1__create_users.sql, V2__seed_users.sql и новая V3__add_bio.sql.'
      : 'classpath:db/migration — V1__create_users.sql и V2__seed_users.sql.' };
  }
  if (item.data.kind === 'migration-file') {
    return { ...common, title: 'Новая миграция V3', detail: 'ALTER TABLE users ADD COLUMN bio — изменение схемы вперёд. Файлы V1 и V2 не тронуты.' };
  }
  if (item.data.kind === 'flyway-engine') {
    if (options.modified) {
      return { ...common, status: 'error', title: 'Validate failed', detail: 'Checksum файла V1 не сошёлся с записью в истории — скрипт изменили после применения. Flyway отказывается продолжать.' };
    }
    return { ...common, title: 'Diff с историей посчитан', detail: options.newMigration
      ? 'V1 и V2 уже применены — выполнится только V3, в своей транзакции.'
      : 'V1 и V2 новые — будут выполнены по возрастанию версий, каждая в транзакции.' };
  }
  if (item.data.kind === 'schema-history') {
    if (options.modified) {
      return { ...common, status: 'error', title: 'Запись не сошлась', detail: 'checksum в flyway_schema_history ≠ checksum файла V1. Так Flyway ловит правки задним числом.' };
    }
    return { ...common, title: `История: ${options.newMigration ? 3 : 2} записи`, detail: 'version, description, checksum, success — по строке на применённую миграцию.' };
  }
  if (item.data.kind === 'database') {
    if (options.modified) {
      return { ...common, status: 'skipped', title: 'Схема не тронута', detail: 'При провале validate миграции не применяются — база остаётся в прошлом состоянии.' };
    }
    return { ...common, title: 'Таблица users готова', detail: options.newMigration
      ? 'CREATE TABLE из V1, INSERT из V2, ALTER TABLE из V3.'
      : 'CREATE TABLE из V1 и INSERT трёх строк из V2.' };
  }
  if (item.data.kind === 'ready') {
    if (options.modified) {
      return { ...common, status: 'error', title: 'Контекст не поднялся', detail: 'FlywayMigrationInitializer бросил исключение — приложение падает на старте, а не работает с разъехавшейся схемой.' };
    }
    return { ...common, title: 'Приложение готово', detail: 'SELECT COUNT(*) = 3. Повторный старт ничего не применит — миграции идемпотентны по истории.' };
  }
  return fallbackStep(item);
}

function buildLombok(ordered, edges, options) {
  return { steps: toSteps(ordered, edges, lombokStep, options), outcome: options.builder ? 'success' : 'error' };
}

function buildValidation(ordered, edges, options) {
  return { steps: toSteps(ordered, edges, validationStep, options), outcome: options.validData ? 'success' : 'error' };
}

function buildFlyway(ordered, edges, options) {
  return { steps: toSteps(ordered, edges, flywayStep, options), outcome: options.modified ? 'error' : 'success' };
}

const BUILDERS = {
  boot: buildBoot,
  request: buildRequest,
  lifecycle: buildLifecycle,
  proxies: buildProxies,
  conditions: buildConditions,
  scan: buildScan,
  definition: buildDefinition,
  postprocessor: buildPostprocessor,
  autoconfig: buildAutoconfig,
  report: buildReport,
  lombok: buildLombok,
  validation: buildValidation,
  flyway: buildFlyway,
};

export function createSimulation(sceneId, rawNodes, rawEdges, options) {
  const scene = SCENES[sceneId];
  const nodes = rawNodes.filter((item) => !item.hidden);
  const ids = new Set(nodes.map((item) => item.id));
  const edges = rawEdges.filter((item) => !item.hidden && ids.has(item.source) && ids.has(item.target));
  const { ordered, error } = graphOrder(nodes, edges, scene.startKind, scene.targetKind);
  if (error) return error;
  return BUILDERS[sceneId](ordered, edges, options);
}

export function nodeStates(nodes, trace, cursor) {
  const result = new Map(nodes.map((item) => [item.id, 'idle']));
  if (cursor < 0 || !trace.length) return result;
  trace.slice(0, cursor + 1).forEach((step) => {
    if (!step.nodeId) return;
    result.set(step.nodeId, step.status === 'error' ? 'error' : step.status === 'skipped' ? 'skipped' : 'done');
  });
  const active = trace[cursor];
  if (active?.nodeId) result.set(active.nodeId, active.status === 'error' ? 'error' : active.status === 'skipped' ? 'skipped' : 'active');
  return result;
}
