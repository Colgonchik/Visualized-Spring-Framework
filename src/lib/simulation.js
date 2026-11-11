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
  return { ...common, title: item.data.label, detail: item.data.description || 'Пользовательский узел включён в маршрут.' };
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
  return { ...common, title: item.data.label, detail: item.data.description || 'Пользовательский узел включён в маршрут.' };
}

export function createSimulation(sceneId, rawNodes, rawEdges, options) {
  const nodes = rawNodes.filter((item) => !item.hidden);
  const ids = new Set(nodes.map((item) => item.id));
  const edges = rawEdges.filter((item) => !item.hidden && ids.has(item.source) && ids.has(item.target));
  const startKind = sceneId === 'boot' ? 'application' : 'client';
  const targetKind = sceneId === 'boot' ? 'ready' : 'database';
  const { ordered, error } = graphOrder(nodes, edges, startKind, targetKind);
  if (error) return error;

  const mapper = sceneId === 'boot' ? bootStep : requestStep;
  const steps = [];
  for (const item of ordered) {
    const step = mapper(item, options);
    step.id = `${item.id}-${steps.length}`;
    step.edgeIds = edges.filter((link) => link.target === item.id).map((link) => link.id);
    steps.push(step);
    if (sceneId === 'request' && item.data.kind === 'auth' && step.status === 'error') {
      steps.push({ id: 'response-401', nodeId: 'client', edgeIds: edges.map((link) => link.id), phase: 'response', status: 'error',
        title: '401 · запрос остановлен', detail: 'Controller не вызывался. ExceptionTranslationFilter сформировал ответ с X-Visual-SB.' });
      return { steps, outcome: 'unauthorized' };
    }
  }
  if (sceneId === 'boot' || sceneId !== 'request') return { steps, outcome: options.enabled ? 'success' : 'error' };

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
