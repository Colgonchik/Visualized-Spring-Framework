import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';

const FOCAL = 520;
const DEPTH = 250;
const CAM_DIST = 200;
const CARD_W = 178;
const CARD_H = 86;
const ACCENTS = { boot: '#baa3e9', web: '#81cee8', security: '#c1a0e1', data: '#e7c379', custom: '#f2b982' };

function hashOf(text) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  return hash;
}

function layout(items, trace) {
  const placed = new Map();
  const order = [];
  trace.forEach((step) => {
    if (step.nodeId && !placed.has(step.nodeId) && items.some((item) => item.id === step.nodeId)) {
      const index = order.length;
      placed.set(step.nodeId, {
        x: (index % 2 === 0 ? -1 : 1) * (150 + (index % 3) * 24),
        y: ((index % 3) - 1) * 78,
        z: -index * DEPTH,
        index,
      });
      order.push(step.nodeId);
    }
  });
  const back = -(order.length + 2) * DEPTH;
  items.forEach((item) => {
    if (placed.has(item.id)) return;
    const hash = hashOf(item.id);
    placed.set(item.id, {
      x: (hash % 2 === 0 ? -1 : 1) * (300 + (hash % 4) * 70),
      y: ((hash % 5) - 2) * 64,
      z: back - (hash % 3) * DEPTH,
      index: null,
    });
  });
  return placed;
}

function drawCard(ctx, node, spot, sx, sy, scale, alpha) {
  const width = CARD_W * scale;
  const height = CARD_H * scale;
  const accent = ACCENTS[node.data.category] || '#b8f34a';
  const status = spot.status;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(sx - width / 2, sy - height / 2);

  if (status === 'active') {
    ctx.shadowColor = '#b8f34a66';
    ctx.shadowBlur = 26 * scale;
  } else if (status === 'error') {
    ctx.shadowColor = '#e87b6755';
    ctx.shadowBlur = 20 * scale;
  }

  ctx.beginPath();
  const radius = 8 * scale;
  ctx.roundRect(0, 0, width, height, radius);
  ctx.fillStyle = '#131e17';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = Math.max(1, 1.4 * scale);
  ctx.strokeStyle = status === 'active' ? '#b8f34a' : status === 'error' ? '#e87b67' : status === 'done' ? '#587548' : '#354b3c';
  if (status === 'skipped') ctx.setLineDash([4 * scale, 3 * scale]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = accent;
  ctx.globalAlpha = alpha * 0.85;
  ctx.beginPath();
  ctx.roundRect(0, 10 * scale, 2.5 * scale, height - 20 * scale, 2 * scale);
  ctx.fill();

  const label = node.data.label.length > 24 ? `${node.data.label.slice(0, 23)}…` : node.data.label;
  ctx.fillStyle = status === 'skipped' ? '#a59b81' : '#e3ece2';
  ctx.font = `500 ${Math.max(7, 11.5 * scale)}px 'DM Sans', 'Segoe UI', sans-serif`;
  ctx.fillText(label, 12 * scale, 24 * scale, width - 22 * scale);

  ctx.fillStyle = '#8b9f8d';
  ctx.font = `${Math.max(6, 8 * scale)}px 'IBM Plex Mono', Consolas, monospace`;
  const subtitle = (node.data.subtitle || '').length > 34 ? `${node.data.subtitle.slice(0, 33)}…` : (node.data.subtitle || '');
  ctx.fillText(subtitle, 12 * scale, 42 * scale, width - 22 * scale);

  if (spot.index !== null) {
    ctx.fillStyle = accent;
    ctx.font = `600 ${Math.max(6, 8 * scale)}px 'IBM Plex Mono', Consolas, monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(String(spot.index + 1).padStart(2, '0'), width - 9 * scale, 18 * scale);
    ctx.textAlign = 'left';
  }
  if (status === 'active') {
    ctx.strokeStyle = '#b8f34a55';
    ctx.lineWidth = Math.max(1, scale);
    ctx.beginPath();
    ctx.roundRect(-4 * scale, -4 * scale, width + 8 * scale, height + 8 * scale, radius + 3 * scale);
    ctx.stroke();
  }
  ctx.restore();
}

export default function Scene3D({ nodes, trace, cursor, nodeStates, onSelectStep, onInspectNode }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const pointer = useRef({ x: 0, y: 0 });
  const projected = useRef([]);
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  const spots = useMemo(() => layout(nodes, trace), [nodes, trace]);
  const stepIndexByNode = useMemo(() => {
    const map = new Map();
    trace.forEach((step, index) => {
      if (step.nodeId && !map.has(step.nodeId)) map.set(step.nodeId, index);
    });
    return map;
  }, [trace]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    const observer = new ResizeObserver(() => {
      setSize({ width: wrap.clientWidth, height: wrap.clientHeight });
    });
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.width || !size.height) return undefined;
    const context = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const current = trace[cursor];
    const targetNode = current?.nodeId ? spots.get(current.nodeId) : null;
    const fallback = trace.length ? spots.get(trace[Math.floor(trace.length / 2)]?.nodeId) : null;
    const anchor = targetNode || fallback || { x: 0, y: 0, z: -DEPTH };
    const camera = { x: anchor.x * 0.8, y: anchor.y * 0.8, z: anchor.z + CAM_DIST + 140 };
    let raf = 0;

    const render = (time) => {
      const parallax = reducedMotion ? { x: 0, y: 0 } : pointer.current;
      const targetX = anchor.x * 0.8 + parallax.x * 36;
      const targetY = anchor.y * 0.8 + parallax.y * 26;
      const targetZ = anchor.z + CAM_DIST;
      camera.x += (targetX - camera.x) * 0.09;
      camera.y += (targetY - camera.y) * 0.09;
      camera.z += (targetZ - camera.z) * 0.09;

      context.clearRect(0, 0, size.width, size.height);
      context.strokeStyle = '#4a634c';
      context.globalAlpha = 0.09;
      context.lineWidth = 1;
      [[0, 0], [size.width, 0], [0, size.height], [size.width, size.height]].forEach(([cx, cy]) => {
        context.beginPath();
        context.moveTo(size.width / 2, size.height / 2);
        context.lineTo(cx, cy);
        context.stroke();
      });
      context.globalAlpha = 1;

      const project = (x, y, z) => {
        const dz = camera.z - z;
        const scale = FOCAL / (FOCAL + dz);
        return {
          scale,
          x: size.width / 2 + (x - camera.x) * scale,
          y: size.height / 2 + (y - camera.y) * scale,
          dz,
        };
      };

      const drawnEdges = [];
      for (let index = 1; index < trace.length; index += 1) {
        const from = spots.get(trace[index - 1].nodeId);
        const to = spots.get(trace[index].nodeId);
        if (!from || !to) continue;
        const a = project(from.x, from.y, from.z);
        const b = project(to.x, to.y, to.z);
        if (a.dz < -FOCAL + 60 || b.dz < -FOCAL + 60) continue;
        drawnEdges.push({ a, b, done: index <= cursor, current: index === cursor, response: trace[index].phase === 'response' });
      }
      drawnEdges.forEach((edge) => {
        const alpha = edge.current ? 0.95 : edge.done ? 0.55 : 0.3;
        context.strokeStyle = edge.current ? '#b8f34a' : edge.response && edge.done ? '#7dd5ee' : edge.done ? '#4c6b45' : '#2c4034';
        context.globalAlpha = alpha;
        context.lineWidth = edge.current ? 2.2 : 1.4;
        if (edge.current) {
          context.shadowColor = '#b8f34a88';
          context.shadowBlur = 8;
        }
        context.beginPath();
        context.moveTo(edge.a.x, edge.a.y);
        context.lineTo(edge.b.x, edge.b.y);
        context.stroke();
        context.shadowBlur = 0;
      });
      context.globalAlpha = 1;

      const items = nodes
        .filter((node) => spots.has(node.id))
        .map((node) => {
          const spot = spots.get(node.id);
          const bob = reducedMotion ? 0 : Math.sin(time / 900 + (spot.index ?? hashOf(node.id) % 7)) * 5;
          const point = project(spot.x, spot.y + bob, spot.z);
          return { node, spot, point };
        })
        .filter((item) => item.point.dz > -FOCAL + 60)
        .sort((a, b) => a.point.dz - b.point.dz);

      projected.current = [];
      items.forEach((item) => {
        const status = nodeStates.get(item.node.id) || 'idle';
        const future = item.spot.index !== null && item.spot.index > cursor && trace.length > 0;
        let alpha = Math.min(1, Math.max(0.16, 1.08 - item.point.dz / 1300));
        if (future) alpha *= 0.55;
        if (status === 'skipped') alpha *= 0.7;
        if (item.point.dz < 0) alpha *= Math.max(0, 1 + item.point.dz / 150);
        drawCard(context, item.node, { ...item.spot, status }, item.point.x, item.point.y, Math.max(0.12, item.point.scale), alpha);
        projected.current.push({
          id: item.node.id,
          x: item.point.x,
          y: item.point.y,
          w: CARD_W * item.point.scale,
          h: CARD_H * item.point.scale,
          visible: alpha > 0.05,
        });
      });
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [nodes, trace, cursor, nodeStates, spots, size, reducedMotion]);

  function handleClick(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = projected.current.find((item) => item.visible
      && Math.abs(x - item.x) <= item.w / 2 + 6
      && Math.abs(y - item.y) <= item.h / 2 + 6);
    if (!hit) return;
    const stepIndex = stepIndexByNode.get(hit.id);
    if (stepIndex !== undefined) onSelectStep(stepIndex);
    else onInspectNode(hit.id);
  }

  return (
    <div className="scene3d-wrap" ref={wrapRef}
      onMouseMove={(event) => {
        const rect = wrapRef.current.getBoundingClientRect();
        pointer.current = {
          x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
          y: ((event.clientY - rect.top) / rect.height - 0.5) * 2,
        };
      }}
      onMouseLeave={() => { pointer.current = { x: 0, y: 0 }; }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} onClick={handleClick} aria-label="3D-вид трассировки: маршрут в глубину, клик по узлу выбирает его шаг" />
      {!trace.length && (
        <div className="sequence-empty scene3d-empty">
          <Icon name="globe" size={28} />
          <strong>Пространственная трассировка</strong>
          <span>Запустите сценарий — камера поедет по маршруту, будущие шаги уйдут вглубь.<br />Движение мыши наклоняет сцену, клик по узлу выбирает его шаг.</span>
        </div>
      )}
      <div className="scene3d-hint"><Icon name="mouse" size={13} />Клик по узлу — его шаг · мышь — параллакс</div>
    </div>
  );
}
