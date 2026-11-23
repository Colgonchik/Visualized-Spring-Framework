import { useEffect, useMemo, useRef, useState } from 'react';
import Sandbox from './components/Sandbox.jsx';
import SequenceDiagram from './components/SequenceDiagram.jsx';
import Scene3D from './components/Scene3D.jsx';
import StepReader from './components/StepReader.jsx';
import Icon, { NodeGlyph } from './components/Icon.jsx';
import { PALETTE, SCENES, applyOptions, createGraph } from './data/scenes.js';
import { getSnippet } from './data/code.js';
import { createSimulation, nodeStates } from './lib/simulation.js';
import { buildShareUrl, decodeScenePayload, parseSceneHash } from './lib/share.js';

const STORAGE_PREFIX = 'visual-sb-graph-v1:';
const LAYOUT_KEY = 'visual-sb-layout-v1';
const INSPECTOR_LIMITS = [230, 480];

function loadLayout() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LAYOUT_KEY));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveLayout(layout) {
  try {
    window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
  } catch {
    // хранилище недоступно — раскладка просто не сохранится
  }
}

function sceneFromHash() {
  const { id } = parseSceneHash(window.location.hash);
  return SCENES[id] ? id : 'boot';
}

function hashPayload() {
  const { id, encoded } = parseSceneHash(window.location.hash);
  if (!encoded) return null;
  const data = decodeScenePayload(encoded);
  return data && data.scene === id && SCENES[id] ? data : null;
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

function SceneSwitcher({ sceneId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDocClick);
    return () => document.removeEventListener('pointerdown', onDocClick);
  }, [open]);
  const scene = SCENES[sceneId];
  return (
    <div className="scene-switcher" ref={ref}>
      <button className="scene-switcher__button" type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={`Сценарий: ${scene.title}`} onClick={() => setOpen((value) => !value)}>
        <span className="scene-switcher__icon"><Icon name={scene.icon} size={17} /></span>
        <span className="scene-switcher__text"><small>СЦЕНА {scene.number}</small><strong>{scene.title}</strong></span>
        <Icon name="chevron-down" size={13} className="scene-switcher__chevron" />
      </button>
      {open && (
        <div className="scene-switcher__menu" role="listbox" aria-label="Выбор сценария">
          {Object.entries(SCENES).map(([id, item]) => (
            <a key={id} href={`#${id}`} role="option" aria-selected={id === sceneId} className={`scene-switcher__option${id === sceneId ? ' is-current' : ''}`} onClick={() => setOpen(false)}>
              <span className="scene-switcher__option-icon"><Icon name={item.icon} size={16} /></span>
              <span className="scene-switcher__option-text"><small>{item.number} / {item.shortTitle}</small><strong>{item.title}</strong></span>
              <Icon name="arrow" size={13} className="scene-switcher__option-arrow" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const [sceneId, setSceneId] = useState(sceneFromHash);
  const [graph, setGraph] = useState(() => createGraph(sceneFromHash()));
  const [nodes, setNodes] = useState(() => hashPayload()?.nodes ?? loadSceneState(sceneFromHash())?.nodes ?? graph.nodes);
  const [edges, setEdges] = useState(() => hashPayload()?.edges ?? loadSceneState(sceneFromHash())?.edges ?? graph.edges);
  const [options, setOptions] = useState(() => hashPayload()?.options ?? loadSceneState(sceneFromHash())?.options ?? { ...SCENES[sceneFromHash()].defaults });
  const [trace, setTrace] = useState([]);
  const [cursor, setCursor] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [viewMode, setViewMode] = useState('graph');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showLog, setShowLog] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [layout, setLayout] = useState(loadLayout);
  const [resizing, setResizing] = useState(null);
  const logRef = useRef(null);
  const inspectorRef = useRef(null);
  const inspectorWidth = typeof layout.inspectorWidth === 'number' ? layout.inspectorWidth : null;
  const inspectorCollapsed = Boolean(layout.inspectorCollapsed);
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
      const shared = hashPayload();
      const saved = shared ?? loadSceneState(next);
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
    saveLayout(layout);
  }, [layout]);

  function startColumnDrag(event) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    event.preventDefault();
    const aside = inspectorRef.current;
    if (!aside) return;
    const startX = event.clientX;
    const startWidth = aside.offsetWidth;
    const [min, max] = INSPECTOR_LIMITS;
    setLayout((current) => ({ ...current, inspectorCollapsed: false }));
    setResizing('inspector');
    const onMove = (moveEvent) => {
      const next = Math.min(max, Math.max(min, Math.round(startWidth - (moveEvent.clientX - startX))));
      setLayout((current) => ({ ...current, inspectorWidth: next }));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      setResizing(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }

  function toggleInspector() {
    setLayout((current) => ({ ...current, inspectorCollapsed: !current.inspectorCollapsed }));
  }

  const layoutStyle = {
    '--app-inspector-w': inspectorCollapsed ? '0px' : inspectorWidth != null ? `${inspectorWidth}px` : undefined,
  };

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
    if (viewMode !== 'reader' || trace.length) return;
    const simulation = createSimulation(sceneId, nodes, edges, options);
    setTrace(simulation.steps);
  }, [viewMode, trace.length, sceneId, nodes, edges, options]);

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

  async function copySceneLink() {
    try {
      await navigator.clipboard.writeText(buildShareUrl(sceneId, { nodes, edges, options }));
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1600);
    } catch {
      // буфер обмена недоступен — ссылка не скопируется, кнопка останется в исходном виде
    }
  }

  return (
    <div className={`app-shell${resizing ? ' is-col-resizing' : ''}`}>
      <header className="topbar">
        <a className="brand" href="#boot" aria-label="Visual SB — к запуску контейнера">
          <span className="brand-mark"><Icon name="logo" size={27} /></span>
          <span><strong>VISUAL SB</strong><small>SPRING, БЕЗ МАГИИ</small></span>
        </a>
        <SceneSwitcher sceneId={sceneId} />
        <div className="topbar-right">
          <span className="version">0.5</span>
          <span className="proof">15 модулей <span>·</span> 53 теста</span>
          <button className="text-button" aria-pressed={!inspectorCollapsed} aria-label="Панель инспектора" title="Показать или скрыть правую панель" onClick={toggleInspector}><Icon name="sliders" size={15} />Инспектор</button>
          <button className="text-button" onClick={() => setShowHelp(true)}><Icon name="info" size={16} />Как это работает</button>
        </div>
      </header>

      <div className="app-layout" style={layoutStyle}>
        <main className="main-stage">
          <div className={`column-edge column-edge--right${inspectorCollapsed ? ' is-collapsed' : ''}${resizing === 'inspector' ? ' is-resizing' : ''}`}
            onPointerDown={inspectorCollapsed ? undefined : (event) => startColumnDrag(event)}
            onDoubleClick={toggleInspector}
            role="separator" aria-orientation="vertical"
            aria-label="Разделитель инспектора — потяните, чтобы изменить ширину, двойной клик скрывает панель"
            title="Потяните, чтобы изменить ширину; двойной клик — скрыть панель">
            <button className="column-toggle" type="button" aria-label={inspectorCollapsed ? 'Показать инспектор' : 'Скрыть инспектор'} aria-expanded={!inspectorCollapsed}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={toggleInspector}>
              <Icon name={inspectorCollapsed ? 'chevron-left' : 'chevron-right'} size={13} />
            </button>
          </div>
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
                  <button role="tab" aria-selected={viewMode === 'scene3d'} className={viewMode === 'scene3d' ? 'is-active' : ''} onClick={() => setViewMode('scene3d')}>3D</button>
                  <button role="tab" aria-selected={viewMode === 'reader'} className={viewMode === 'reader' ? 'is-active' : ''} onClick={() => setViewMode('reader')}>По шагам</button>
                </div>
              </div>
              <div className="canvas-actions">
                <span className="scene-badge">{scene.badge(options)}</span>
                <div className="palette-pop">
                  {paletteOpen && <div className="palette-pop__backdrop" onClick={() => setPaletteOpen(false)} />}
                  <button className="icon-button" onClick={() => setPaletteOpen((value) => !value)} aria-label="Добавить компонент" aria-expanded={paletteOpen} title="Добавить компонент на холст"><Icon name="plus" size={16} /></button>
                  {paletteOpen && (
                    <div className="palette-pop__menu">
                      <span className="eyebrow">КОМПОНЕНТЫ · нажмите, чтобы добавить</span>
                      <div className="palette-pop__grid">
                        {PALETTE.map((item) => (
                          <button key={item.kind} className={`palette-item palette-item--${item.category}`} onClick={() => { addNode(item); setPaletteOpen(false); }} aria-label={`Добавить ${item.label}`}>
                            <NodeGlyph kind={item.kind} size={20} /><span>{item.label}</span><small>{item.subtitle}</small>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button className="icon-button" onClick={copySceneLink} title="Поделиться сценой — скопировать ссылку с вашим графом" aria-label="Поделиться сценой"><Icon name={shareCopied ? 'check' : 'link'} size={16} /></button>
                <button className="icon-button" onClick={resetScene} title="Сбросить сцену" aria-label="Сбросить сцену"><Icon name="reset" size={16} /></button>
              </div>
            </div>
            {viewMode === 'graph' && (
              <Sandbox sceneId={sceneId} nodes={nodes} edges={edges} trace={trace} cursor={cursor} nodeStates={states}
                onNodesChange={setNodes} onEdgesChange={setEdges} onConnect={(next) => { setEdges(next); resetPlayback(); }}
                onGraphEdit={resetPlayback} onDropNode={addNode} onSelectNode={setSelectedNodeId} onEditStart={() => setPlaying(false)} />
            )}
            {viewMode === 'sequence' && <SequenceDiagram nodes={nodes} trace={trace} cursor={cursor} onSelect={chooseStep} />}
            {viewMode === 'scene3d' && <Scene3D nodes={nodes} trace={trace} cursor={cursor} nodeStates={states} onSelectStep={chooseStep} onInspectNode={setSelectedNodeId} />}
            {viewMode === 'reader' && <StepReader scene={scene} sceneId={sceneId} nodes={nodes} trace={trace} cursor={cursor} onSelect={chooseStep} />}
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

        <aside className={`inspector${inspectorCollapsed ? ' is-collapsed' : ''}`} ref={inspectorRef}>
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
