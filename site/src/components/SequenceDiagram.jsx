import { useMemo } from 'react';
import Icon from './Icon.jsx';

const LANE_W = 185;
const HEADER_H = 66;
const ROW_H = 48;
const PAD_X = 90;
const TRUNCATE = 36;

const COLORS = {
  success: '#9fc98a',
  error: '#e8947f',
  skipped: '#8d8672',
  response: '#7dd5ee',
};

function truncate(text) {
  return text.length > TRUNCATE ? `${text.slice(0, TRUNCATE - 1)}…` : text;
}

export default function SequenceDiagram({ nodes, trace, cursor, onSelect }) {
  const lifelines = useMemo(() => {
    const seen = new Map();
    trace.forEach((step) => {
      if (step.nodeId && !seen.has(step.nodeId)) {
        const node = nodes.find((item) => item.id === step.nodeId);
        seen.set(step.nodeId, node?.data.label || step.nodeId);
      }
    });
    return [...seen.entries()];
  }, [trace, nodes]);

  if (!trace.length) {
    return (
      <div className="sequence-empty">
        <Icon name="split" size={28} />
        <strong>Диаграмма последовательности</strong>
        <span>Запустите сценарий — каждый шаг станет сообщением между линиями жизни.<br />Клик по сообщению перемещает проигрыватель.</span>
      </div>
    );
  }

  const width = PAD_X * 2 + lifelines.length * LANE_W;
  const height = HEADER_H + trace.length * ROW_H + 26;
  const laneX = (index) => PAD_X + index * LANE_W + LANE_W / 2;
  const laneIndex = (id) => lifelines.findIndex(([laneId]) => laneId === id);

  return (
    <div className="sequence-wrap">
      <svg className="sequence-svg" width={width} height={height} role="img" aria-label="Диаграмма последовательности сценария">
        <defs>
          {Object.entries(COLORS).map(([status, color]) => (
            <marker key={status} id={`seq-arrow-${status}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10z" fill={color} />
            </marker>
          ))}
        </defs>
        {lifelines.map(([id, label], index) => (
          <g key={id}>
            <line x1={laneX(index)} y1={HEADER_H - 8} x2={laneX(index)} y2={height - 12} stroke="#2b3d35" strokeDasharray="3 5" />
            <rect x={laneX(index) - 78} y={10} width={156} height={36} rx="7" fill="#14201a" stroke="#2f4536" />
            <text x={laneX(index)} y={26} textAnchor="middle" fill="#cfe0c2" fontSize="10.5" fontWeight="600">{truncate(label)}</text>
            <text x={laneX(index)} y={40} textAnchor="middle" fill="#5f7a63" fontSize="8">{String(index + 1).padStart(2, '0')}</text>
          </g>
        ))}
        {trace.map((step, index) => {
          const y = HEADER_H + index * ROW_H + ROW_H / 2;
          const fromIndex = index === 0 ? laneIndex(step.nodeId) : laneIndex(trace[index - 1].nodeId);
          const toIndex = laneIndex(step.nodeId);
          const status = step.phase === 'response' ? 'response' : step.status;
          const color = COLORS[status] || COLORS.success;
          const dimmed = index > cursor;
          const opacity = dimmed ? 0.32 : 1;
          const rowClass = `seq-row${index === cursor ? ' is-current' : ''}`;
          if (step.nodeId === null || fromIndex < 0 || toIndex < 0) {
            return (
              <g key={step.id} className={rowClass} opacity={opacity} onClick={() => onSelect(index)} cursor="pointer">
                <rect x={0} y={y - ROW_H / 2} width={width} height={ROW_H} fill="transparent" />
                <text x={width / 2} y={y + 3} textAnchor="middle" fill={color} fontSize="10">{step.title}</text>
              </g>
            );
          }
          const x1 = laneX(fromIndex);
          const x2 = laneX(toIndex);
          const self = x1 === x2;
          return (
            <g key={step.id} className={rowClass} opacity={opacity} onClick={() => onSelect(index)} cursor="pointer">
              <rect x={0} y={y - ROW_H / 2} width={width} height={ROW_H} className="seq-row__hit" fill="transparent" />
              {index === cursor && <rect x={0} y={y - ROW_H / 2 + 3} width={width} height={ROW_H - 6} fill="#b8f34a09" />}
              {self ? (
                <path d={`M ${x1} ${y - 9} h 26 v 18 h -26`} fill="none" stroke={color} strokeWidth="1.6" markerEnd={`url(#seq-arrow-${status})`} />
              ) : (
                <>
                  <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth="1.6" strokeDasharray={step.phase === 'response' ? '5 4' : undefined} markerEnd={`url(#seq-arrow-${status})`} className="seq-message" />
                  <rect x={Math.min(x1, x2)} y={y - 3} width={Math.abs(x2 - x1)} height={6} fill="transparent" />
                </>
              )}
              <text x={self ? x1 + 32 : (x1 + x2) / 2} y={y - 7} textAnchor="middle" fill={color} fontSize="9.5">{truncate(step.title)}</text>
              <text x={12} y={y + 3} fill="#4d6a4f" fontSize="8">{String(index + 1).padStart(2, '0')}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
