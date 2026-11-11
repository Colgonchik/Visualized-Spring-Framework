import test from 'node:test';
import assert from 'node:assert/strict';
import { createGraph } from '../src/data/scenes.js';
import { createSimulation, nodeStates } from '../src/lib/simulation.js';

function simulate(sceneId, options = {}) {
  const graph = createGraph(sceneId);
  const defaults = sceneId === 'boot' ? { enabled: true, custom: false } : { endpoint: 'private', credentials: true, failure: false };
  return createSimulation(sceneId, graph.nodes, graph.edges, { ...defaults, ...options });
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
  const graph = createGraph('boot');
  const nodes = graph.nodes.map((node) => node.id === 'custom' ? { ...node, hidden: false } : node);
  const edges = graph.edges.map((edge) => edge.id === 'custom-bpp' ? { ...edge, hidden: false } : edge);
  const result = createSimulation('boot', nodes, edges, { enabled: true, custom: true });
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
  const graph = createGraph('boot');
  const result = createSimulation('boot', graph.nodes.filter((node) => node.id !== 'application'), graph.edges, { enabled: true, custom: false });
  assert.equal(result.outcome, 'error');
  assert.equal(result.steps[0].title, 'Маршрут не собран');
});

test('Цикл не отправляет проигрыватель в бесконечный цикл', () => {
  const graph = createGraph('boot');
  graph.edges.push({ id: 'cycle', source: 'ready', target: 'application' });
  const result = createSimulation('boot', graph.nodes, graph.edges, { enabled: true, custom: false });
  assert.equal(result.steps[0].title, 'Обнаружен цикл');
});

test('Состояния узлов соответствуют текущему и пройденным шагам', () => {
  const graph = createGraph('boot');
  const result = createSimulation('boot', graph.nodes, graph.edges, { enabled: true, custom: false });
  const states = nodeStates(graph.nodes, result.steps, 0);
  assert.equal(states.get('application'), 'active');
  assert.equal(states.get('ready'), 'idle');
});
