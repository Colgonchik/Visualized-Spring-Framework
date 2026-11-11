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

const BUILDERS = {
  boot: buildBoot,
  request: buildRequest,
  lifecycle: buildLifecycle,
  proxies: buildProxies,
  conditions: buildConditions,
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
