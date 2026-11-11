import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENES, applyOptions, createGraph } from '../src/data/scenes.js';
import { getSnippet } from '../src/data/code.js';
import { createSimulation, nodeStates } from '../src/lib/simulation.js';

// Узлы, чей код живёт внутри самого Spring — в репозитории их нет.
const SNIPPET_ALLOWLIST = new Set(['request:dispatcher']);

function simulate(sceneId, options = {}) {
  const graph = createGraph(sceneId);
  const merged = { ...SCENES[sceneId].defaults, ...options };
  const applied = applyOptions(sceneId, merged, graph.nodes, graph.edges);
  return createSimulation(sceneId, applied.nodes, applied.edges, merged);
}

test('Boot создаёт GreeterService при выполненных условиях', () => {
  const result = simulate('boot');
  assert.equal(result.outcome, 'success');
  assert.equal(result.steps.at(-1).title, 'Контекст готов');
  assert.equal(result.steps.find((step) => step.nodeId === 'greeter').status, 'success');
  assert.equal(result.steps.some((step) => step.nodeId === 'custom'), false);
});

test('Boot отключает starter и показывает ошибку реального Runner', () => {
  const result = simulate('boot', { enabled: false });
  assert.equal(result.outcome, 'error');
  assert.equal(result.steps.find((step) => step.nodeId === 'auto').status, 'skipped');
  assert.equal(result.steps.at(-1).title, 'Приложение не запустилось');
});

test('Пользовательский бин заставляет автоконфигурацию отступить', () => {
  const result = simulate('boot', { custom: true });
  assert.equal(result.outcome, 'success');
  assert.equal(result.steps.find((step) => step.nodeId === 'auto').status, 'skipped');
  assert.equal(result.steps.find((step) => step.nodeId === 'greeter').status, 'skipped');
  assert.equal(result.steps.find((step) => step.nodeId === 'custom').status, 'success');
});

test('Авторизованный /private возвращает 200', () => {
  const result = simulate('request');
  assert.equal(result.outcome, 'success');
  assert.equal(result.steps.at(-1).title, '200 OK · application/json');
  assert.equal(result.steps.at(-1).phase, 'response');
});

test('Отсутствие credentials останавливает /private с 401', () => {
  const result = simulate('request', { credentials: false });
  assert.equal(result.outcome, 'unauthorized');
  assert.equal(result.steps.at(-1).title, '401 · запрос остановлен');
  assert.equal(result.steps.some((step) => step.nodeId === 'controller'), false);
});

test('permitAll разрешает /public без credentials', () => {
  const result = simulate('request', { endpoint: 'public', credentials: false });
  assert.equal(result.outcome, 'success');
  assert.match(result.steps.find((step) => step.nodeId === 'auth').detail, /permitAll/);
});

test('Исключение отменяет INSERT', () => {
  const result = simulate('request', { failure: true });
  assert.equal(result.outcome, 'rollback');
  assert.equal(result.steps.at(-2).title, 'rollback');
  assert.equal(result.steps.at(-1).title, '500 · изменения отменены');
});

test('Lifecycle: бин проходит конвейер и становится готовым', () => {
  const result = simulate('lifecycle');
  assert.equal(result.outcome, 'success');
  assert.equal(result.steps.at(-1).title, 'Бин готов');
  assert.equal(result.steps.find((step) => step.nodeId === 'init').status, 'success');
});

test('Lifecycle: ошибка в init-методе роняет контекст', () => {
  const result = simulate('lifecycle', { initFailure: true });
  assert.equal(result.outcome, 'error');
  assert.equal(result.steps.find((step) => step.nodeId === 'init').status, 'error');
  assert.equal(result.steps.at(-1).title, 'Контекст не поднялся');
});

test('Lifecycle: BPP оборачивает бин в прокси', () => {
  const result = simulate('lifecycle', { proxyWrap: true });
  assert.equal(result.outcome, 'success');
  assert.equal(result.steps.find((step) => step.nodeId === 'bpp').title, 'Бин обёрнут в прокси');
  assert.match(result.steps.at(-1).detail, /прокси/);
});

test('Proxies: CGLIB-вызов завершается COMMIT', () => {
  const result = simulate('proxies');
  assert.equal(result.outcome, 'success');
  assert.equal(result.steps.at(-1).title, 'COMMIT');
  assert.match(result.steps.find((step) => step.nodeId === 'proxy').detail, /CGLIB/);
});

test('Proxies: JDK-прокси объясняет требование интерфейса', () => {
  const result = simulate('proxies', { proxyType: 'jdk' });
  assert.equal(result.outcome, 'success');
  assert.match(result.steps.find((step) => step.nodeId === 'proxy').detail, /JDK/);
});

test('Proxies: самовызов this минует прокси', () => {
  const result = simulate('proxies', { internalCall: true });
  assert.equal(result.outcome, 'success');
  assert.equal(result.steps.find((step) => step.nodeId === 'selfcall').status, 'skipped');
  assert.match(result.steps.find((step) => step.nodeId === 'selfcall').title, /миновал прокси/);
});

test('Proxies: исключение в методе даёт ROLLBACK', () => {
  const result = simulate('proxies', { failure: true });
  assert.equal(result.outcome, 'rollback');
  assert.equal(result.steps.at(-1).status, 'error');
  assert.equal(result.steps.at(-1).title, 'ROLLBACK');
});

test('Conditions: все условия выполнены — бин зарегистрирован', () => {
  const result = simulate('conditions');
  assert.equal(result.outcome, 'success');
  assert.equal(result.steps.find((step) => step.nodeId === 'feature').status, 'success');
  assert.match(result.steps.at(-1).detail, /positiveMatches: 3/);
});

test('Conditions: провал условия прячет бин, отчёт считает отказы', () => {
  const result = simulate('conditions', { property: false });
  assert.equal(result.outcome, 'success');
  assert.equal(result.steps.find((step) => step.nodeId === 'onproperty').status, 'skipped');
  assert.equal(result.steps.find((step) => step.nodeId === 'feature').status, 'skipped');
  assert.match(result.steps.at(-1).detail, /positiveMatches: 2 · negativeMatches: 1/);
});

test('Conditions: пользовательский бин отключает автоконфигурацию без ошибки', () => {
  const result = simulate('conditions', { userBean: true });
  assert.equal(result.steps.find((step) => step.nodeId === 'onbean').status, 'skipped');
  assert.equal(result.steps.find((step) => step.nodeId === 'feature').status, 'skipped');
  assert.equal(result.steps.at(-1).status, 'success');
});

test('Добавленный и соединённый компонент входит в трассировку', () => {
  const graph = createGraph('boot');
  graph.nodes.push({ id: 'extra', data: { kind: 'component', label: 'AuditService' } });
  graph.edges = graph.edges.filter((edge) => edge.id !== 'bpp-ready');
  graph.edges.push({ id: 'bpp-extra', source: 'bpp', target: 'extra' }, { id: 'extra-ready', source: 'extra', target: 'ready' });
  const result = createSimulation('boot', graph.nodes, graph.edges, { enabled: true, custom: false });
  assert.equal(result.steps.find((step) => step.nodeId === 'extra').title, 'AuditService');
  assert.equal(result.outcome, 'success');
});

test('Удаление стартового узла объясняет нерабочий маршрут', () => {
  const graph = createGraph('lifecycle');
  const result = createSimulation('lifecycle', graph.nodes.filter((node) => node.id !== 'definition'), graph.edges, { initFailure: false, proxyWrap: false });
  assert.equal(result.outcome, 'error');
  assert.equal(result.steps[0].title, 'Маршрут не собран');
});

test('Цикл не отправляет проигрыватель в бесконечный цикл', () => {
  const graph = createGraph('conditions');
  graph.edges.push({ id: 'cycle', source: 'report', target: 'evaluator' });
  const result = createSimulation('conditions', graph.nodes, graph.edges, { property: true, jackson: true, userBean: false });
  assert.equal(result.steps[0].title, 'Обнаружен цикл');
});

test('Состояния узлов соответствуют текущему и пройденным шагам', () => {
  const graph = createGraph('boot');
  const result = createSimulation('boot', graph.nodes, graph.edges, { enabled: true, custom: false });
  const states = nodeStates(graph.nodes, result.steps, 0);
  assert.equal(states.get('application'), 'active');
  assert.equal(states.get('ready'), 'idle');
});

test('Scan: фильтр отбрасывает InternalComponent до метаданных', () => {
  const result = simulate('scan', { internal: true });
  assert.equal(result.outcome, 'success');
  assert.equal(result.steps.find((step) => step.nodeId === 'internal').status, 'skipped');
  assert.match(result.steps.find((step) => step.nodeId === 'registry').detail, /internalComponent исключён фильтром/);
});

test('Scan: без фильтра внутренний компонент регистрируется', () => {
  const result = simulate('scan', { internal: true, excluded: false });
  assert.equal(result.steps.find((step) => step.nodeId === 'internal').status, 'success');
  assert.equal(result.steps.find((step) => step.nodeId === 'filter').title, 'Фильтр отключён');
});

test('Definition: метаданные без объектов, lazy откладывает создание', () => {
  const result = simulate('definition', { lazy: true });
  assert.equal(result.outcome, 'success');
  assert.match(result.steps.find((step) => step.nodeId === 'registry').detail, /containsSingleton\(\) == false/);
  assert.match(result.steps.find((step) => step.nodeId === 'lazyDef').title, /lazyInit/);
  assert.equal(result.steps.find((step) => step.nodeId === 'instance').title, 'Создание отложено до getBean');
});

test('Definition: без программной регистрации greeter не появляется', () => {
  const result = simulate('definition', { programmatic: false });
  assert.equal(result.steps.some((step) => step.nodeId === 'greeterDef'), false);
  assert.match(result.steps.find((step) => step.nodeId === 'registry').detail, /timeProvider/);
});

test('Postprocessor: прокси только при @Logged и интерфейсе одновременно', () => {
  const proxied = simulate('postprocessor');
  assert.equal(proxied.steps.find((step) => step.nodeId === 'after').title, 'Бин заменён на прокси');
  assert.equal(proxied.steps.find((step) => step.nodeId === 'methodCall').title, 'Вызов перехвачен');
  const noLog = simulate('postprocessor', { logged: false });
  assert.equal(noLog.steps.find((step) => step.nodeId === 'after').status, 'skipped');
  assert.match(noLog.steps.find((step) => step.nodeId === 'after').title, /@Logged/);
  assert.equal(noLog.steps.find((step) => step.nodeId === 'methodCall').title, 'Прямой вызов');
  const noIface = simulate('postprocessor', { iface: false });
  assert.match(noIface.steps.find((step) => step.nodeId === 'after').detail, /интерфейс/);
});

test('Autoconfig: без Jackson конфигурация отсеяна на фильтре', () => {
  const result = simulate('autoconfig', { jackson: false });
  assert.equal(result.steps.find((step) => step.nodeId === 'classFilter').status, 'skipped');
  assert.equal(result.steps.find((step) => step.nodeId === 'selected').status, 'skipped');
  assert.match(result.steps.find((step) => step.nodeId === 'contextReady').title, /без ObjectMapper/);
});

test('Autoconfig: пользовательский @Bean заставляет авто-конфигурацию отступить', () => {
  const result = simulate('autoconfig', { userBean: true });
  assert.equal(result.steps.find((step) => step.nodeId === 'selected').status, 'skipped');
  assert.match(result.steps.find((step) => step.nodeId === 'selected').detail, /@ConditionalOnMissingBean/);
  assert.equal(result.steps.find((step) => step.nodeId === 'userOverride').status, 'success');
});

test('Report: detailed переносит бин из negativeMatches в positiveMatches', () => {
  const base = simulate('report');
  assert.match(base.steps.find((step) => step.nodeId === 'negative').title, /detailedReportService/);
  const detailed = simulate('report', { detailed: true });
  assert.match(detailed.steps.find((step) => step.nodeId === 'positive').title, /оба бина/);
  assert.equal(detailed.steps.find((step) => step.nodeId === 'negative').title, 'negativeMatches пуст');
});

test('Report: без --debug консольный отчёт отключён', () => {
  const result = simulate('report', { debug: false });
  assert.equal(result.steps.find((step) => step.nodeId === 'appStart').status, 'skipped');
  assert.equal(result.steps.at(-1).status, 'success');
});

test('У каждого узла сцен есть сниппет кода из Java-модуля', () => {
  for (const [sceneId, scene] of Object.entries(SCENES)) {
    for (const node of scene.nodes) {
      const key = `${sceneId}:${node.id}`;
      const snippet = getSnippet(sceneId, node.id);
      if (SNIPPET_ALLOWLIST.has(key)) {
        assert.equal(snippet, null, `${key} не должен иметь сниппета`);
      } else {
        assert.ok(snippet, `${key} — сниппет не найден`);
        assert.ok(snippet.code.length > 20, `${key} — сниппет слишком короткий`);
        assert.ok(snippet.file.length > 3, `${key} — не указан файл`);
      }
    }
  }
});
