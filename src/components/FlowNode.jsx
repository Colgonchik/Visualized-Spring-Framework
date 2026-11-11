import { Handle, Position } from '@xyflow/react';
import { NodeGlyph } from './Icon.jsx';

export default function FlowNode({ data, selected }) {
  const status = data.status || 'idle';
  return (
    <div className={`flow-node flow-node--${data.category} is-${status}${selected ? ' is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} aria-label={`Вход ${data.label}`} />
      <div className="flow-node__topline">
        <span className="flow-node__icon"><NodeGlyph kind={data.kind} /></span>
        <span className="flow-node__status">{status === 'active' ? 'RUN' : status === 'error' ? 'STOP' : status === 'done' ? 'OK' : status === 'skipped' ? 'SKIP' : ''}</span>
      </div>
      <strong>{data.label}</strong>
      <span className="flow-node__subtitle">{data.subtitle}</span>
      <Handle type="source" position={Position.Right} aria-label={`Выход ${data.label}`} />
    </div>
  );
}
