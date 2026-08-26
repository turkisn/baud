import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { getDemo3DModel } from '../../data/demo3dCatalog';

const TAU = Math.PI * 2;
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

function rotatePoint(point, rotation = [0, 0, 0]) {
  let [x, y, z] = point;
  const [rx, ry, rz] = rotation;
  if (rx) {
    const cosine = Math.cos(rx); const sine = Math.sin(rx);
    [y, z] = [y * cosine - z * sine, y * sine + z * cosine];
  }
  if (ry) {
    const cosine = Math.cos(ry); const sine = Math.sin(ry);
    [x, z] = [x * cosine + z * sine, -x * sine + z * cosine];
  }
  if (rz) {
    const cosine = Math.cos(rz); const sine = Math.sin(rz);
    [x, y] = [x * cosine - y * sine, x * sine + y * cosine];
  }
  return [x, y, z];
}

function movePoint(point, part) {
  const rotated = rotatePoint(point, part.rotation);
  return rotated.map((value, index) => value + part.position[index]);
}

function boxFaces(part) {
  const [width, height, depth] = part.size;
  const vertices = [
    [-width / 2, -height / 2, -depth / 2], [width / 2, -height / 2, -depth / 2],
    [width / 2, height / 2, -depth / 2], [-width / 2, height / 2, -depth / 2],
    [-width / 2, -height / 2, depth / 2], [width / 2, -height / 2, depth / 2],
    [width / 2, height / 2, depth / 2], [-width / 2, height / 2, depth / 2],
  ].map((point) => movePoint(point, part));
  return [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [3, 2, 6, 7], [1, 5, 6, 2], [0, 3, 7, 4]]
    .map((indices) => ({ ...part, vertices: indices.map((index) => vertices[index]) }));
}

function cylinderFaces(part) {
  const segments = part.segments || 18;
  const top = []; const bottom = [];
  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * TAU;
    const point = [Math.cos(angle) * part.radius, part.height / 2, Math.sin(angle) * part.radius];
    top.push(movePoint(point, part));
    bottom.push(movePoint([point[0], -part.height / 2, point[2]], part));
  }
  const faces = [{ ...part, vertices: top }, { ...part, vertices: [...bottom].reverse() }];
  for (let index = 0; index < segments; index += 1) {
    const next = (index + 1) % segments;
    faces.push({ ...part, vertices: [bottom[index], bottom[next], top[next], top[index]] });
  }
  return faces;
}

function buildFaces(model) {
  return model.parts.flatMap((part) => part.kind === 'cylinder' ? cylinderFaces(part) : boxFaces(part));
}

function viewPoint(point, yaw, pitch) {
  const cosineY = Math.cos(yaw); const sineY = Math.sin(yaw);
  const x = point[0] * cosineY + point[2] * sineY;
  const z = -point[0] * sineY + point[2] * cosineY;
  const cosineX = Math.cos(pitch); const sineX = Math.sin(pitch);
  return [x, point[1] * cosineX - z * sineX, point[1] * sineX + z * cosineX];
}

function normal(vertices) {
  const first = vertices[0]; const second = vertices[1]; const third = vertices[2];
  const a = [second[0] - first[0], second[1] - first[1], second[2] - first[2]];
  const b = [third[0] - first[0], third[1] - first[1], third[2] - first[2]];
  const result = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const length = Math.hypot(...result) || 1;
  return result.map((value) => value / length);
}

function litColor(hex, light, emissive = 0) {
  const value = hex.replace('#', '');
  const expanded = value.length === 3 ? value.split('').map((character) => character.repeat(2)).join('') : value;
  const multiplier = clamp(.42 + light * .68 + emissive, .28, 1.28);
  const channels = [0, 2, 4].map((index) => clamp(Math.round(Number.parseInt(expanded.slice(index, index + 2), 16) * multiplier), 0, 255));
  return `rgb(${channels.join(',')})`;
}

function drawScene(context, width, height, faces, view) {
  context.clearRect(0, 0, width, height);
  const gradient = context.createRadialGradient(width * .5, height * .42, 0, width * .5, height * .55, Math.max(width, height) * .72);
  gradient.addColorStop(0, '#271b0d'); gradient.addColorStop(.46, '#0d0b08'); gradient.addColorStop(1, '#050403');
  context.fillStyle = gradient; context.fillRect(0, 0, width, height);

  context.save();
  context.globalAlpha = .28; context.strokeStyle = '#9c7336'; context.lineWidth = 1;
  for (let index = -8; index <= 8; index += 1) {
    const x = width / 2 + index * Math.min(width, height) * .065;
    context.beginPath(); context.moveTo(x, height * .73); context.lineTo(width / 2 + index * Math.min(width, height) * .018, height * .48); context.stroke();
  }
  for (let index = 0; index < 6; index += 1) {
    const y = height * (.52 + index * .055);
    context.beginPath(); context.moveTo(width * (.18 - index * .035), y); context.lineTo(width * (.82 + index * .035), y); context.stroke();
  }
  context.restore();

  context.save();
  context.filter = 'blur(14px)'; context.globalAlpha = .55; context.fillStyle = '#000';
  context.beginPath(); context.ellipse(width / 2, height * .73, width * .25, height * .055, 0, 0, TAU); context.fill(); context.restore();

  const distance = 8;
  const scale = Math.min(width, height) * distance * .155 * view.zoom;
  const projected = faces.map((face) => {
    const vertices = face.vertices.map((point) => viewPoint(point, view.yaw, view.pitch));
    return { ...face, transformed: vertices, depth: vertices.reduce((total, point) => total + point[2], 0) / vertices.length };
  }).sort((left, right) => left.depth - right.depth);
  const lightDirection = [-.35, .72, .92];

  for (const face of projected) {
    const points = face.transformed.map(([x, y, z]) => {
      const perspective = scale / (distance - z);
      return [width / 2 + x * perspective, height * .67 - y * perspective];
    });
    const faceNormal = normal(face.transformed);
    const light = Math.abs(faceNormal[0] * lightDirection[0] + faceNormal[1] * lightDirection[1] + faceNormal[2] * lightDirection[2]) / 1.22;
    context.beginPath();
    points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y));
    context.closePath();
    context.globalAlpha = face.alpha ?? 1;
    context.fillStyle = litColor(face.color, light, face.emissive || 0);
    context.fill();
    context.globalAlpha = Math.min(face.alpha ?? 1, .74);
    context.strokeStyle = face.emissive ? '#f4cb74' : '#c69b55';
    context.lineWidth = face.emissive ? 1.35 : .55;
    context.stroke();
  }
  context.globalAlpha = 1;
}

function Product3DViewer({ slug, label }) {
  const canvasRef = useRef(null);
  const pointerRef = useRef(null);
  const viewRef = useRef(null);
  const model = useMemo(() => getDemo3DModel(slug), [slug]);
  const faces = useMemo(() => model ? buildFaces(model) : [], [model]);
  const [autoRotate, setAutoRotate] = useState(() => typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const autoRotateRef = useRef(autoRotate);

  const resetView = useCallback(() => {
    viewRef.current = { ...model.camera };
  }, [model]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    if (!model) return undefined;
    resetView();
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { alpha: false });
    let width = 1; let height = 1; let frame; let previousTime = performance.now();
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const density = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.round(bounds.width * density)); height = Math.max(1, Math.round(bounds.height * density));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    };
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
    const render = (time) => {
      const elapsed = Math.min(time - previousTime, 40); previousTime = time;
      if (autoRotateRef.current && !pointerRef.current) viewRef.current.yaw += elapsed * .00012;
      drawScene(context, width, height, faces, viewRef.current);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [faces, model, resetView]);

  if (!model) return null;

  const pointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };
  const pointerMove = (event) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId || !viewRef.current) return;
    const deltaX = event.clientX - pointer.x; const deltaY = event.clientY - pointer.y;
    viewRef.current.yaw += deltaX * .009;
    viewRef.current.pitch = clamp(viewRef.current.pitch + deltaY * .007, -1.18, .75);
    pointerRef.current = { ...pointer, x: event.clientX, y: event.clientY };
  };
  const pointerUp = (event) => {
    if (pointerRef.current?.id === event.pointerId) pointerRef.current = null;
  };
  const zoom = (event) => {
    event.preventDefault();
    if (!viewRef.current) return;
    viewRef.current.zoom = clamp(viewRef.current.zoom * (event.deltaY > 0 ? .92 : 1.08), .62, 1.7);
  };

  return (
    <div className="product-3d-stage">
      <canvas ref={canvasRef} aria-label={label} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={zoom} onDoubleClick={resetView} />
      <div className="product-3d-viewer-controls">
        <button type="button" onClick={() => setAutoRotate((value) => !value)} aria-label={autoRotate ? 'Pause rotation' : 'Resume rotation'}>{autoRotate ? <Pause size={15}/> : <Play size={15}/>}</button>
        <button type="button" onClick={resetView} aria-label="Reset 3D view"><RotateCcw size={15}/></button>
      </div>
    </div>
  );
}

export default memo(Product3DViewer);
