import { useEffect, useMemo, useRef } from 'react';
import Icon, { NodeGlyph } from './Icon.jsx';

const STATUS_META = {
  success: { mark: '✓', label: 'УСПЕХ', className: 'is-success' },
  error: { mark: '×', label: 'ОШИБКА', className: 'is-error' },
  skipped: { mark: '–', label: 'ПРОПУЩЕН', className: 'is-skipped' },
};

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export default function StepReader({ scene, sceneId, nodes, trace, cursor, onSelect }) {
  const listRef = useRef(null);
  const nodeById = useMemo(() => new Map(nodes.map((item) => [item.id, item])), [nodes]);
  const activeIndex = cursor >= 0 ? cursor : null;
  const step = activeIndex !== null ? trace[activeIndex] : null;
  const node = step?.nodeId ? nodeById.get(step.nodeId) : null;

  useEffect(() => {
    if (activeIndex === null || !listRef.current) return;
    const item = listRef.current.children[activeIndex];
    if (item) item.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!trace.length) return null;

  return (
    <div className="reader-wrap">
      <div className="reader-rail" ref={listRef} aria-label="Список шагов">
        {trace.map((item, index) => {
          const meta = STATUS_META[item.status] || STATUS_META.success;
          const state = index < cursor ? 'is-past' : index === cursor ? 'is-current' : 'is-future';
          return (
            <button key={item.id} className={`reader-step ${state}`} onClick={() => onSelect(index)}>
              <span className="reader-step__index">{String(index + 1).padStart(2, '0')}</span>
              <span className="reader-step__body">
                <strong>{item.title}</strong>
                <small>{truncate(item.detail, 64)}</small>
              </span>
              <span className={`reader-step__mark reader-step__mark--${item.status}`}>{meta.mark}</span>
            </button>
          );
        })}
      </div>

      <div className="reader-card">
        {step ? (
          <>
            <div className="reader-card__topline">
              <span className="reader-card__counter">ШАГ {String(activeIndex + 1).padStart(2, '0')} / {String(trace.length).padStart(2, '0')}</span>
              <span className={`reader-status ${(STATUS_META[step.status] || STATUS_META.success).className}`}>{(STATUS_META[step.status] || STATUS_META.success).mark} {(STATUS_META[step.status] || STATUS_META.success).label}</span>
            </div>
            <h3>{step.title}</h3>
            <p className="reader-card__detail">{step.detail}</p>

            {node ? (
              <div className="reader-actor">
                <span className="eyebrow">КТО УЧАСТВУЕТ</span>
                <div className="reader-actor__head">
                  <span className={`node-details__icon node-details__icon--${node.data.category}`}><NodeGlyph kind={node.data.kind} size={22} /></span>
                  <div>
                    <strong>{node.data.label}</strong>
                    <code>{node.data.subtitle}</code>
                  </div>
                </div>
                <p>{node.data.description}</p>
                <div className="reader-actor__meta">
                  <div><span className="eyebrow">ТОЧКА ОСТАНОВА</span><code>{node.data.breakpoint}</code></div>
                  <div><span className="eyebrow">ИСТОЧНИК В ПРОЕКТЕ</span><code>{node.data.source}</code></div>
                </div>
              </div>
            ) : (
              <div className="reader-actor reader-actor--global">
                <span className="eyebrow">ОБЩЕЕ СОБЫТИЕ</span>
                <p>{step.phase === 'response' ? 'Этот шаг — ответ всей цепочки клиенту: он подводит итог маршрута, а не относится к одному узлу.' : 'Этот шаг описывает состояние всего маршрута сразу, а не одного узла.'}</p>
              </div>
            )}

            <div className="reader-run">
              <span className="eyebrow">ПРОВЕРИТЬ В JAVA</span>
              <code>mvn -pl {scene.module} spring-boot:run</code>
            </div>

            <div className="reader-nav">
              <button className="reader-nav__button" disabled={activeIndex <= 0} onClick={() => onSelect(activeIndex - 1)}><Icon name="previous" size={14} />Назад</button>
              <div className="reader-nav__dots" aria-hidden="true">
                {trace.map((item, index) => <span key={item.id} className={index === activeIndex ? 'is-current' : index < activeIndex ? 'is-past' : ''} />)}
              </div>
              <button className="reader-nav__button reader-nav__button--next" disabled={activeIndex >= trace.length - 1} onClick={() => onSelect(activeIndex + 1)}>Вперёд<Icon name="next" size={14} /></button>
            </div>
          </>
        ) : (
          <div className="reader-intro">
            <span className="eyebrow">ПОШАГОВЫЙ РАЗБОР · {scene.shortTitle.toUpperCase()}</span>
            <h3>{scene.title}</h3>
            <p>{scene.description}</p>
            <p className="reader-intro__hint">Маршрут собран: {trace.length} шагов. Выберите шаг слева или листайте кнопками — каждый разобран простым языком: что происходит, кто участвует и где это искать в исходниках Spring. Клавиши ← → тоже работают.</p>
            <button className="run-button" onClick={() => onSelect(0)}>Начать разбор<Icon name="arrow" size={15} /></button>
            <div className="reader-run"><span className="eyebrow">JAVA-МОДУЛЬ СЦЕНЫ</span><code>{sceneId} → {scene.module}</code></div>
          </div>
        )}
      </div>
    </div>
  );
}
