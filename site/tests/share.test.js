import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeScenePayload, decodeScenePayload, parseSceneHash } from '../src/lib/share.js';

const STATE = {
  nodes: [
    { id: 'application', type: 'visual', position: { x: 0, y: 0 }, data: { kind: 'application', label: 'Application', category: 'boot' } },
  ],
  edges: [{ id: 'e1', source: 'application', target: 'application' }],
  options: { autoConfig: true },
};

test('share: payload переживает encode → decode без потерь', () => {
  const encoded = encodeScenePayload('boot', STATE);
  const decoded = decodeScenePayload(encoded);
  assert.ok(decoded);
  assert.equal(decoded.scene, 'boot');
  assert.deepEqual(decoded.nodes, STATE.nodes);
  assert.deepEqual(decoded.edges, STATE.edges);
  assert.deepEqual(decoded.options, STATE.options);
});

test('share: payload устойчив к кириллице в названиях узлов', () => {
  const state = {
    ...STATE,
    nodes: STATE.nodes.map((node) => ({ ...node, data: { ...node.data, label: 'Аудит Сервис — «тест»' } })),
  };
  const decoded = decodeScenePayload(encodeScenePayload('scan', state));
  assert.equal(decoded.nodes[0].data.label, 'Аудит Сервис — «тест»');
});

test('share: битый или пустой payload отклоняется', () => {
  assert.equal(decodeScenePayload('!!!not-base64!!!'), null);
  assert.equal(decodeScenePayload(encodeScenePayload('boot', STATE).slice(0, -4)), null);
  assert.equal(decodeScenePayload(''), null);
});

test('share: parseSceneHash отделяет id сцены от payload', () => {
  assert.deepEqual(parseSceneHash('#boot'), { id: 'boot', encoded: '' });
  assert.deepEqual(parseSceneHash('#scan/AbC-123_x'), { id: 'scan', encoded: 'AbC-123_x' });
  assert.deepEqual(parseSceneHash(''), { id: '', encoded: '' });
});
