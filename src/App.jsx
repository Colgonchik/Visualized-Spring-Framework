import { useEffect, useMemo, useRef, useState } from 'react';
import Sandbox from './components/Sandbox.jsx';
import SequenceDiagram from './components/SequenceDiagram.jsx';
import Icon, { NodeGlyph } from './components/Icon.jsx';
import { PALETTE, SCENES, applyOptions, createGraph } from './data/scenes.js';
import { getSnippet } from './data/code.js';
import { createSimulation, nodeStates } from './lib/simulation.js';

const STORAGE_PREFIX = 'visual-sb-graph-v1:';

function sceneFromHash() {
  const id = window.location.hash.replace('#', '');
  return SCENES[id] ? id : 'boot';
}

function loadSceneState(sceneId) {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + sceneId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges) || !parsed.options || typeof parsed.options !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSceneState(sceneId, state) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + sceneId, JSON.stringify(state));
  } catch {
    // хранилище недоступно — сцена просто не сохранится
  }
}

function clearSceneState(sceneId) {
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + sceneId);
  } catch {
    // ignore
  }
}

function Toggle({ label, hint, checked, onChange, disabled = false }) {
  return (
    <div className={`setting${disabled ? ' is-disabled' : ''}`}>
      <div><span>{label}</span>{hint && <code>{hint}</code>}</div>
      <button className={`toggle${checked ? ' is-on' : ''}`} type="button" role="switch" aria-label={label} aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}>
        <span />
      </button>
    </div>
  );
}

function SceneSettings({ scene, options, onChange }) {
  return scene.settings.map((setting) => {
    if (setting.type === 'toggle') {
      const disabled = setting.disabledWhen ? options[setting.disabledWhen.key] === setting.disabledWhen.equals : false;
      return <Toggle key={setting.key} label={setting.label} hint={setting.hint} checked={Boolean(options[setting.key])} disabled={disabled} onChange={(value) => onChange(setting.key, value)} />;
    }
    return (
      <div key={setting.key} className="setting endpoint-setting">
        <span>{setting.label}</span>
        <div className="segmented">
          {setting.choices.map((choice) => (
            <button key={choice.value} className={options[setting.key] === choice.value ? 'is-active' : ''} onClick={() => onChange(setting.key, choice.value)}>{choice.label}</button>
          ))}
        </div>
      </div>
    );
  });
}

function App() {
  const [sceneId, setSceneId] = useState(sceneFromHash);
  const [graph, setGraph] = useState(() => createGraph(sceneFromHash()));
  const [nodes, setNodes] = useState(() => loadSceneState(sceneFromHash())?.nodes ?? graph.nodes);
  const [edges, setEdges] = useState(() => loadSceneState(sceneFromHash())?.edges ?? graph.edges);
  const [options, setOptions] = useState(() => loadSceneState(sceneFromHash())?.options ?? { ...SCENES[sceneFromHash()].defaults });
  const [trace, setTrace] = useState([]);
  const [cursor, setCursor] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [viewMode, setViewMode] = useState('graph');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showLog, setShowLog] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const logRef = useRef(null);
  const scene = SCENES[sceneId];
  const current = trace[cursor];
  const finished = trace.length > 0 && cursor === trace.length - 1;
  const states = useMemo(() => nodeStates(nodes, trace, cursor), [nodes, trace, cursor]);
  const inspectedNode = nodes.find((item) => item.id === selectedNodeId) || nodes.find((item) => item.id === current?.nodeId);
  const inspectedSnippet = inspectedNode ? getSnippet(sceneId, inspectedNode.id) : null;
  const note = scene.note(options);

  useEffect(() => {
    const syncScene = () => {
      const next = sceneFromHash();
      const nextGraph = createGraph(next);
      const saved = loadSceneState(next);
      setSceneId(next);
      setNodes(saved?.nodes ?? nextGraph.nodes);
      setEdges(saved?.edges ?? nextGraph.edges);
      setOptions(saved?.options ?? { ...SCENES[next].defaults });
      setTrace([]);
      setCursor(-1);
      setPlaying(false);
      setSelectedNodeId(null);
    };
    window.addEventListener('hashchange', syncScene);
    return () => window.removeEventListener('hashchange', syncScene);
  }, []);

  useEffect(() => {
    document.title = `${scene.title} — Visual SB`;
  }, [scene.title]);

  useEffect(() => {
    saveSceneState(sceneId, { nodes, edges, options });
  }, [sceneId, nodes, edges, options]);

  useEffect(() => {
    if (!playing || !trace.length || finished) {
      if (finished) setPlaying(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setCursor((value) => value + 1), 1100 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, trace, finished, speed, cursor]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [cursor, showLog]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setShowHelp(false);
        return;
      }
      if (showHelp) return;
      if (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        nextStep();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (cursor > 0) chooseStep(cursor - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function resetPlayback() {
    setTrace([]);
    setCursor(-1);
    setPlaying(false);
  }

  function changeOption(key, value) {
    const next = { ...options, [key]: value };
    const updated = applyOptions(sceneId, next, nodes, edges);
    setOptions(next);
    setNodes(updated.nodes);
    setEdges(updated.edges);
    resetPlayback();
  }

  function run() {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (!trace.length || finished) {
      const simulation = createSimulation(sceneId, nodes, edges, options);
      setTrace(simulation.steps);
      setCursor(0);
      setSelectedNodeId(simulation.steps[0]?.nodeId || null);
    }
    setPlaying(true);
    setShowLog(true);
  }

  function chooseStep(index) {
    setPlaying(false);
    setCursor(index);
    setSelectedNodeId(trace[index]?.nodeId || null);
  }

  function nextStep() {
    setPlaying(false);
    if (!trace.length) {
      const simulation = createSimulation(sceneId, nodes, edges, options);
      setTrace(simulation.steps);
      setCursor(0);
      setSelectedNodeId(simulation.steps[0]?.nodeId || null);
    } else if (!finished) {
      chooseStep(cursor + 1);
    }
  }

  function resetScene() {
    if (!window.confirm('Вернуть исходный граф и настройки этой сцены?')) return;
    const fresh = createGraph(sceneId);
    clearSceneState(sceneId);
    setNodes(fresh.nodes);
    setEdges(fresh.edges);
    setOptions({ ...scene.defaults });
    setSelectedNodeId(null);
    resetPlayback();
  }

  function addNode(template, position) {
    const id = `${template.kind}-${crypto.randomUUID()}`;
    const index = nodes.length;
    const item = {
      id,
      type: 'visual',
      position: position || { x: 110 + (index % 4) * 48, y: 70 + (index % 3) * 70 },
      data: { ...template },
    };
    setNodes((currentNodes) => [...currentNodes.map((node) => ({ ...node, selected: false })), { ...item, selected: true }]);
    setSelectedNodeId(id);
    resetPlayback();
  }

  function deleteSelected() {
    if (!selectedNodeId) return;
    setNodes((currentNodes) => currentNodes.filter((item) => item.id !== selectedNodeId));
    setEdges((currentEdges) => currentEdges.filter((item) => item.source !== selectedNodeId && item.target !== selectedNodeId));
    setSelectedNodeId(null);
    resetPlayback();
  }

  function renameNode(label) {
    setNodes((currentNodes) => currentNodes.map((item) => item.id === selectedNodeId ? { ...item, data: { ...item.data, label } } : item));
    resetPlayback();
  }

  async function copyCommand() {
    await navigator.clipboard.writeText(`mvn -pl ${scene.module} spring-boot:run`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#boot" aria-label="Visual SB — к запуску контейнера">
          <span className="brand-mark"><Icon name="logo" size={27} /></span>
          <span><strong>VISUAL SB</strong><small>SPRING, БЕЗ МАГИИ</small></span>
        </a>
        <div className="topbar-center"><span className="live-dot" />ИНТЕРАКТИВНАЯ ЛАБОРАТОРИЯ<span className="version">MVP 0.3</span></div>
        <div className="topbar-right"><span className="proof">12 модулей <span>·</span> 43 теста</span><button className="text-button" onClick={() => setShowHelp(true)}><Icon name="info" size={16} />Как это работает</button></div>
      </header>

      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-section scenes-nav">
            <span className="eyebrow">СЦЕНАРИИ</span>
            {Object.entries(SCENES).map(([id, item]) => (
              <a key={id} href={`#${id}`} className={`scene-link${sceneId === id ? ' is-current' : ''}`} aria-current={sceneId === id ? 'page' : undefined}>
                <span className="scene-link__icon"><Icon name={item.icon} size={20} /></span>
                <span><small>{item.number} / {item.shortTitle}</small><strong>{item.title}</strong></span>
                <Icon name="arrow" size={15} className="scene-link__arrow" />
              </a>
            ))}
          </div>
          <div className="sidebar-section palette-section">
            <div className="section-label"><span className="eyebrow">КОМПОНЕНТЫ</span><Icon name="plus" size={15} /></div>
            <p className="sidebar-hint">Перетащите на холст<br />или нажмите, чтобы добавить</p>
            <div className="palette">
              {PALETTE.map((item) => (
                <button key={item.kind} className={`palette-item palette-item--${item.category}`} draggable onDragStart={(event) => {
                  event.dataTransfer.setData('application/visual-sb-node', item.kind);
                  event.dataTransfer.effectAllowed = 'copy';
                }} onClick={() => addNode(item)} title={`Добавить ${item.label}`} aria-label={`Добавить ${item.label}`}>
                  <NodeGlyph kind={item.kind} size={20} /><span>{item.label}</span><small>{item.subtitle}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="sidebar-foot"><span className="live-dot" />Граф можно изменять</div>
        </aside>

        <main className="main-stage">
          <div className="scene-heading">
            <div><div className="eyebrow scene-number">СЦЕНА {scene.number}<span className="eyebrow-line" />{scene.shortTitle.toUpperCase()}</div><h1>{scene.title}<span className="title-dot">.</span></h1><p>{scene.description}</p></div>
            <div className="model-label"><Icon name="cpu" size={17} /><span>Модель выполняется в браузере<br /><small>Java-примеры — в репозитории</small></span></div>
          </div>

          <section className="workspace" aria-label="Интерактивная песочница">
            <div className="canvas-topline">
              <div className="canvas-title">
                <span className={`live-dot${playing ? ' is-pulsing' : ''}`} />{playing ? 'ВЫПОЛНЯЕТСЯ' : finished ? 'СЦЕНАРИЙ ЗАВЕРШЁН' : 'ГОТОВ К ЗАПУСКУ'}
                <div className="view-switch" role="tablist" aria-label="Вид трассировки">
                  <button role="tab" aria-selected={viewMode === 'graph'} className={viewMode === 'graph' ? 'is-active' : ''} onClick={() => setViewMode('graph')}>Граф</button>
                  <button role="tab" aria-selected={viewMode === 'sequence'} className={viewMode === 'sequence' ? 'is-active' : ''} onClick={() => setViewMode('sequence')}>Последовательность</button>
                </div>
              </div>
              <div className="canvas-actions"><span className="scene-badge">{scene.badge(options)}</span><button className="icon-button" onClick={resetScene} title="Сбросить сцену" aria-label="Сбросить сцену"><Icon name="reset" size={16} /></button></div>
            </div>
            {viewMode === 'graph' ? (
              <Sandbox sceneId={sceneId} nodes={nodes} edges={edges} trace={trace} cursor={cursor} nodeStates={states}
                onNodesChange={setNodes} onEdgesChange={setEdges} onConnect={(next) => { setEdges(next); resetPlayback(); }}
                onGraphEdit={resetPlayback} onDropNode={addNode} onSelectNode={setSelectedNodeId} onEditStart={() => setPlaying(false)} />
            ) : (
              <SequenceDiagram nodes={nodes} trace={trace} cursor={cursor} onSelect={chooseStep} />
            )}
            <div className="playback">
              <button className={`run-button${playing ? ' is-playing' : ''}`} onClick={run}><Icon name={playing ? 'pause' : 'play'} size={16} />{playing ? 'Пауза' : finished ? 'Запустить снова' : trace.length ? 'Продолжить' : scene.verb}</button>
              <div className="step-buttons"><button className="icon-button" aria-label="Предыдущий шаг" disabled={cursor <= 0} onClick={() => chooseStep(cursor - 1)}><Icon name="previous" size={15} /></button><button className="icon-button" aria-label="Следующий шаг" disabled={finished} onClick={nextStep}><Icon name="next" size={15} /></button></div>
              <div className="playback-progress" aria-label={`Шаг ${cursor + 1} из ${trace.length}`}><div className="progress-track"><span style={{ width: trace.length ? `${((cursor + 1) / trace.length) * 100}%` : '0%' }} /></div><span>{trace.length ? `${String(cursor + 1).padStart(2, '0')} / ${String(trace.length).padStart(2, '0')}` : 'готов к запуску'}</span></div>
              <div className="speed-control" aria-label="Скорость воспроизведения">{[1, 2, 4].map((value) => <button key={value} className={speed === value ? 'is-active' : ''} onClick={() => setSpeed(value)} aria-pressed={speed === value}>{value}×</button>)}</div>
            </div>
            <div className={`event-log${showLog ? '' : ' is-collapsed'}`}>
              <div className="log-heading"><button onClick={() => setShowLog((value) => !value)} aria-expanded={showLog}><Icon name="code" size={15} /><span>Журнал событий</span><span className="log-count">{trace.length ? `${cursor + 1}/${trace.length}` : '—'}</span></button><span>{current?.phase === 'response' ? 'RESPONSE' : scene.logLabel}</span></div>
              {showLog && <div className="log-body" ref={logRef} aria-live="polite">
                {!trace.length && <div className="log-empty"><span className="log-prompt">›_</span><div>Здесь появится трассировка.<br /><small>Нажмите «{scene.verb}» или выберите следующий шаг.</small></div></div>}
                {trace.slice(0, cursor + 1).map((step, index) => <button key={step.id} className={`log-entry log-entry--${step.status}${index === cursor ? ' is-current' : ''}`} onClick={() => chooseStep(index)}><span className="log-index">{String(index + 1).padStart(2, '0')}</span><span className="log-marker">{step.status === 'error' ? '×' : step.status === 'skipped' ? '–' : '✓'}</span><span className="log-message"><strong>{step.title}</strong>{index === cursor && <small>{step.detail}</small>}</span><Icon name="arrow" size={13} /></button>)}
              </div>}
            </div>
          </section>
        </main>

        <aside className="inspector">
          <section className="inspector-section settings-section">
            <div className="section-label"><span className="eyebrow">УСЛОВИЯ СЦЕНАРИЯ</span><Icon name="cpu" size={15} /></div>
            <SceneSettings scene={scene} options={options} onChange={changeOption} />
            <div className={`condition-note${note.warning ? ' is-warning' : ''}`}><Icon name={note.warning ? 'warning' : 'info'} size={15} /><span>{note.text}</span></div>
          </section>

          <section className="inspector-section node-inspector">
            <div className="section-label"><span className="eyebrow">ПОД КАПОТОМ</span><span className="tiny-label">INSPECTOR</span></div>
            {inspectedNode ? <div className="node-details" key={inspectedNode.id}>
              <div className={`node-details__icon node-details__icon--${inspectedNode.data.category}`}><NodeGlyph kind={inspectedNode.data.kind} size={25} /></div>
              {selectedNodeId ? <label className="node-name-input"><span>Название узла</span><input value={inspectedNode.data.label} onChange={(event) => renameNode(event.target.value)} aria-label="Название узла" /></label> : <h2>{inspectedNode.data.label}</h2>}
              <code className="node-annotation">{inspectedNode.data.subtitle}</code>
              <p>{inspectedNode.data.description}</p>
              <div className="breakpoint"><span className="eyebrow">ТОЧКА ОСТАНОВА</span><code>{inspectedNode.data.breakpoint}</code></div>
              <div className="source-path"><span className="eyebrow">ИСТОЧНИК В ПРОЕКТЕ</span><code>{inspectedNode.data.source}</code></div>
              {selectedNodeId && <button className="delete-button" onClick={deleteSelected}><Icon name="trash" size={14} />Удалить узел</button>}
              {inspectedSnippet && <div className="code-snippet"><span className="eyebrow">КОД ИЗ МОДУЛЯ · {inspectedSnippet.file}</span><pre><code>{inspectedSnippet.code}</code></pre></div>}
            </div> : <div className="inspector-empty"><div className="empty-orbit"><Icon name="mouse" size={24} /></div><h2>Исследуйте граф</h2><p>Нажмите на узел, чтобы увидеть его роль, класс Spring, точку останова и код из модуля.</p><span><Icon name="link" size={14} />Потяните от точки на узле, чтобы создать связь</span></div>}
          </section>
          <section className="real-run"><div><span className="live-dot" /><strong>Нужен настоящий Spring?</strong></div><p>Запустите проверенный Java-модуль из корня проекта.</p><code>mvn -pl {scene.module} spring-boot:run</code><button onClick={copyCommand}><Icon name={copied ? 'check' : 'code'} size={14} />{copied ? 'Скопировано' : 'Копировать команду'}</button></section>
        </aside>
      </div>

      {showHelp && <div className="modal-backdrop" onClick={() => setShowHelp(false)}><section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={(event) => event.stopPropagation()}><button className="icon-button modal-close" aria-label="Закрыть" onClick={() => setShowHelp(false)}><Icon name="close" /></button><span className="eyebrow">VISUAL SB / КРАТКИЙ ТУР</span><h2 id="help-title">Не просто смотреть.<br />Собрать и сломать.</h2><div className="help-grid"><div><span>01</span><h3>Запустите сцену</h3><p>Play запускает маршрут. Пауза, стрелки ← → и журнал позволяют исследовать каждый шаг. Вид «Последовательность» показывает те же шаги как UML-диаграмму.</p></div><div><span>02</span><h3>Измените условия</h3><p>Выключите property, добавьте свой бин или уберите credentials. Маршрут и исход изменятся.</p></div><div><span>03</span><h3>Постройте свой граф</h3><p>Добавляйте компоненты из палитры. Перетаскивайте узлы, соединяйте их точки и удаляйте через Delete. Граф сохраняется в браузере.</p></div><div><span>04</span><h3>Проверьте в Java</h3><p>Это модель, а не JVM в браузере. Инспектор показывает код из реальных модулей, а команда в панели запускает настоящий пример.</p></div></div><button className="run-button" onClick={() => setShowHelp(false)}>В лабораторию<Icon name="arrow" size={16} /></button></section></div>}
    </div>
  );
}

export default App;
