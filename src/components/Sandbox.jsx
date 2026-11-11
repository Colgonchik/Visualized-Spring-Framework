import { useRef } from 'react';
import {
  ReactFlow, ReactFlowProvider, Background, BackgroundVariant, Controls, MiniMap,
  MarkerType, ConnectionLineType, applyNodeChanges, applyEdgeChanges, addEdge, useReactFlow,
} from '@xyflow/react';
import FlowNode from './FlowNode.jsx';
import { PALETTE } from '../data/scenes.js';
import Icon from './Icon.jsx';

const nodeTypes = { visual: FlowNode };

function Canvas(props) {
  const wrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const {
    nodes, edges, trace, cursor, onNodesChange, onEdgesChange, onConnect,
    onDropNode, onSelectNode, onEditStart,
  } = props;
  const activeStep = trace[cursor];
  const activeEdges = new Set(activeStep?.edgeIds || []);
  const completedEdges = new Set(trace.slice(0, cursor).flatMap((step) => step.edgeIds));
  const states = props.nodeStates;

  const renderedNodes = nodes.map((item) => ({
    ...item,
    data: { ...item.data, status: states.get(item.id) || 'idle' },
  }));
  const renderedEdges = edges.map((item) => ({
    ...item,
    animated: activeEdges.has(item.id),
    className: `${activeEdges.has(item.id) ? 'is-active' : completedEdges.has(item.id) ? 'is-done' : ''}${activeStep?.phase === 'response' && activeEdges.has(item.id) ? ' is-response' : ''}`,
    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: activeEdges.has(item.id) ? '#b8f34a' : '#395148' },
  }));

  function addAt(kind, position) {
    const template = PALETTE.find((item) => item.kind === kind);
    if (!template) return;
    onDropNode(template, position);
  }

  return (
    <div className="sandbox-canvas" ref={wrapper} onDragOver={(event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }} onDrop={(event) => {
      event.preventDefault();
      const kind = event.dataTransfer.getData('application/visual-sb-node');
      addAt(kind, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    }}>
      <ReactFlow
        nodes={renderedNodes}
        edges={renderedEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(connection) => onConnect(addEdge({ ...connection, type: 'smoothstep' }, edges))}
        onNodeClick={(_, item) => onSelectNode(item.id)}
        onPaneClick={() => onSelectNode(null)}
        onNodeDragStart={onEditStart}
        isValidConnection={(connection) => connection.source !== connection.target && !edges.some((item) => item.source === connection.source && item.target === connection.target)}
        onDropNode={undefined}
        deleteKeyCode={['Backspace', 'Delete']}
        connectionLineType={ConnectionLineType.Smoothstep}
        connectionLineStyle={{ stroke: '#b8f34a', strokeWidth: 2 }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        fitView
        fitViewOptions={{ padding: 0.17, maxZoom: 1 }}
        minZoom={0.25}
        maxZoom={1.8}
        colorMode="dark"
        nodesConnectable
        elementsSelectable
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#2b3d35" />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap position="bottom-right" pannable zoomable bgColor="#0d1512" nodeColor="#314b3d" maskColor="rgba(7, 12, 10, .72)" />
      </ReactFlow>
      <div className="canvas-hint"><Icon name="mouse" size={14} /><span>Перетаскивайте узлы · соединяйте точки · Delete удаляет</span></div>
      <div className="canvas-count">{nodes.filter((item) => !item.hidden).length} узлов <span>/</span> {edges.filter((item) => !item.hidden).length} связей</div>
      {!nodes.length && <div className="empty-canvas"><Icon name="plus" size={30} /><strong>Начните с чистого холста</strong><span>Добавьте компоненты из палитры и соедините их.</span></div>}
    </div>
  );
}

export default function Sandbox(props) {
  function handleNodesChange(changes) {
    props.onNodesChange((current) => applyNodeChanges(changes, current));
    if (changes.some((change) => change.type === 'remove')) props.onGraphEdit();
  }

  function handleEdgesChange(changes) {
    props.onEdgesChange((current) => applyEdgeChanges(changes, current));
    if (changes.some((change) => change.type === 'remove')) props.onGraphEdit();
  }

  return <ReactFlowProvider><Canvas {...props} onNodesChange={handleNodesChange} onEdgesChange={handleEdgesChange} /></ReactFlowProvider>;
}
