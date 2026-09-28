import { lazy, memo, Suspense, useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, ZoomIn, ZoomOut, Sun, Moon, ScanLine } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { getDemo3DModel } from '../../data/demo3dCatalog';
import { canvasRenderSize } from '../../utils/canvas';
import { setOrbitRotation } from '../../utils/orbitMotion';
import { buildProductScene, cameraFitDistance, disposeProductScene } from '../../utils/productScene';

const FallbackViewer = lazy(() => import('./Product3DFallback'));
const FRAME_INTERVAL = 1000 / 30;

function Product3DViewer(props) {
  const { slug, label, pauseLabel, resumeLabel, resetLabel, errorLabel, lang = 'en' } = props;
  const canvasRef = useRef(null);
  const apiRef = useRef(null);
  const [fallback, setFallback] = useState(false);
  const [ready, setReady] = useState(false);
  const [autoRotate, setAutoRotate] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [lightStudio, setLightStudio] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [view, setView] = useState('perspective');
  const t = (en, ar) => lang === 'ar' ? ar : en;

  useEffect(() => {
    const model = getDemo3DModel(slug);
    const canvas = canvasRef.current;
    if (!model || !canvas || fallback) return undefined;
    let renderer, environment, controls, observer;
    let disposed = false, failed = false, frame = null, previous = 0;
    let rotating = false, dirty = true;
    let resetCamera = () => {};
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, .05, 160);
    const stop = () => { if (frame !== null) cancelAnimationFrame(frame); frame = null; };
    const fail = () => { failed = true; stop(); if (!disposed) setFallback(true); };
    const schedule = () => {
      if (disposed || failed || document.hidden || frame !== null) return;
      frame = requestAnimationFrame(render);
    };
    function render(time) {
      frame = null;
      if (disposed || failed || document.hidden) return;
      if (time - previous < FRAME_INTERVAL && !dirty) { schedule(); return; }
      const delta = Math.min((time - previous) / 1000 || .033, .05);
      previous = time;
      try {
        const moving = controls.update(delta);
        renderer.render(scene, camera);
        dirty = false;
        if (rotating || moving) schedule();
      } catch { fail(); }
    }
    const invalidate = () => { dirty = true; schedule(); };
    const visibility = () => { if (document.hidden) stop(); else { previous = performance.now(); invalidate(); } };
    const lost = (event) => { event.preventDefault(); fail(); };
    const reset = () => { resetCamera(); invalidate(); };
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.shadowMap.autoUpdate = false;
      scene.background = new THREE.Color('#14191d');
      const room = new RoomEnvironment();
      const pmrem = new THREE.PMREMGenerator(renderer);
      environment = pmrem.fromScene(room, .04);
      room.dispose(); pmrem.dispose();
      scene.environment = environment.texture;
      scene.environmentIntensity = .8;
      const product = buildProductScene(model, slug);
      scene.add(product);
      const bounds = new THREE.Box3().setFromObject(product);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const radius = size.length() / 2;
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({ color: '#20272c', roughness: .85, metalness: .05 }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -.025;
      floor.receiveShadow = true;
      scene.add(floor);
      const key = new THREE.DirectionalLight('#fff0dc', 3.5);
      key.position.set(-3, 7, 5);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: .5, far: 24 });
      key.shadow.normalBias = .035;
      key.shadow.bias = -.0002;
      key.shadow.radius = 3;
      key.target.position.copy(center);
      scene.add(key, key.target, new THREE.HemisphereLight('#dcecff', '#444039', 1.1));
      const rim = new THREE.DirectionalLight('#bed8ff', 2);
      rim.position.set(4, 4, -5);
      scene.add(rim);
      controls = new OrbitControls(camera, canvas);
      controls.target.copy(center);
      controls.enableDamping = true;
      controls.dampingFactor = .13;
      controls.enablePan = false;
      controls.maxPolarAngle = Math.PI * .49;
      controls.minPolarAngle = .015;
      controls.autoRotateSpeed = .65;
      controls.zoomSpeed = .7;
      controls.addEventListener('change', invalidate);
      let fitDistance = 1;
      let activeView = 'perspective';
      const positionCamera = () => {
        const direction = activeView === 'front' ? new THREE.Vector3(0, .06, 1)
          : activeView === 'top' ? new THREE.Vector3(0, 1, .01)
          : new THREE.Vector3(Math.sin(model.camera.yaw), Math.max(.35, -model.camera.pitch + .2), Math.cos(model.camera.yaw));
        camera.position.copy(center).add(direction.normalize().multiplyScalar(fitDistance));
        controls.target.copy(center);
        controls.update();
        controls.saveState();
      };
      resetCamera = positionCamera;
      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const aspect = Math.max(1, rect.width) / Math.max(1, rect.height);
        const renderSize = canvasRenderSize(rect.width, rect.height, window.devicePixelRatio);
        const oldDistance = camera.position.distanceTo(center);
        const oldFit = fitDistance;
        camera.aspect = aspect;
        fitDistance = cameraFitDistance(radius, aspect);
        camera.far = Math.max(160, fitDistance * 5);
        camera.updateProjectionMatrix();
        controls.minDistance = fitDistance * .3;
        controls.maxDistance = fitDistance * 2.5;
        renderer.setSize(renderSize.width, renderSize.height, false);
        if (oldFit === 1) positionCamera();
        else camera.position.sub(center).normalize().multiplyScalar(oldDistance * fitDistance / oldFit).add(center);
        invalidate();
      };
      apiRef.current = {
        rotate(value) { rotating = value; setOrbitRotation(controls, value); invalidate(); },
        zoom(multiplier) {
          const distance = THREE.MathUtils.clamp(camera.position.distanceTo(center) * multiplier, controls.minDistance, controls.maxDistance);
          camera.position.sub(center).normalize().multiplyScalar(distance).add(center);
          invalidate();
        },
        reset,
        view(value) { activeView = value; positionCamera(); invalidate(); },
        studio(light) {
          scene.background.set(light ? '#e8e5df' : '#14191d');
          floor.material.color.set(light ? '#c5c0b7' : '#20272c');
          renderer.toneMappingExposure = light ? 1.1 : 1.2;
          invalidate();
        },
        wireframe(value) { product.traverse(o => { for (const m of [o.material].flat().filter(Boolean)) m.wireframe = value; }); invalidate(); },
        orbit(x, y) {
          const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(center));
          spherical.theta += x; spherical.phi = THREE.MathUtils.clamp(spherical.phi + y, controls.minPolarAngle, controls.maxPolarAngle);
          camera.position.copy(center).add(new THREE.Vector3().setFromSpherical(spherical));
          invalidate();
        },
      };
      observer = new ResizeObserver(resize);
      observer.observe(canvas);
      document.addEventListener('visibilitychange', visibility);
      canvas.addEventListener('webglcontextlost', lost);
      resize();
      renderer.shadowMap.needsUpdate = true;
      renderer.render(scene, camera);
      setReady(true);
    } catch { fail(); }
    return () => {
      disposed = true; stop(); observer?.disconnect(); controls?.dispose();
      document.removeEventListener('visibilitychange', visibility);
      canvas.removeEventListener('webglcontextlost', lost);
      disposeProductScene(scene);
      scene.traverse(object => object.shadow?.dispose());
      environment?.dispose();
      renderer?.dispose();
      // Release the GPU context after a real unmount. StrictMode reuses the
      // connected canvas for its effect check, so that context must stay alive.
      queueMicrotask(() => { if (!canvas.isConnected) renderer?.forceContextLoss(); });
      apiRef.current = null;
    };
  }, [slug, fallback]);

  useEffect(() => { apiRef.current?.rotate(autoRotate); }, [autoRotate, ready]);
  useEffect(() => { apiRef.current?.studio(lightStudio); }, [lightStudio, ready]);
  useEffect(() => { apiRef.current?.wireframe(wireframe); }, [wireframe, ready]);

  if (fallback) return <Suspense fallback={<div className="product-3d-error">{errorLabel}</div>}><FallbackViewer {...props}/><span className="product-3d-mode-label">{t('Compatibility view', 'عرض متوافق مع الجهاز')}</span></Suspense>;

  const selectView = (value) => { setView(value); setAutoRotate(false); apiRef.current?.view(value); };
  const reset = () => { setView('perspective'); apiRef.current?.view('perspective'); };
  const keyboard = (event) => {
    const actions = {
      ArrowLeft: () => apiRef.current?.orbit(-.12, 0), ArrowRight: () => apiRef.current?.orbit(.12, 0),
      ArrowUp: () => apiRef.current?.orbit(0, -.12), ArrowDown: () => apiRef.current?.orbit(0, .12),
      '+': () => apiRef.current?.zoom(.88), '-': () => apiRef.current?.zoom(1.12),
      Home: reset,
    };
    if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
  };
  return <div className="product-3d-stage" data-renderer="webgl" data-ready={ready}>
    <canvas ref={canvasRef} role="img" aria-label={label} tabIndex={0} onKeyDown={keyboard} onDoubleClick={reset}/>
    <div className="product-3d-views" role="group" aria-label={t('Camera views', 'زوايا المشاهدة')}>
      {[['perspective', t('Perspective', 'منظور')], ['front', t('Front', 'أمامي')], ['top', t('Top', 'علوي')]].map(([value, title]) =>
        <button key={value} type="button" aria-pressed={view === value} onClick={() => selectView(value)}>{title}</button>)}
    </div>
    <div className="product-3d-viewer-controls" role="group" aria-label={t('3D controls', 'أدوات العرض')}>
      <button type="button" onClick={() => setLightStudio(v => !v)} aria-label={t('Switch studio lighting', 'تبديل إضاءة الاستوديو')} aria-pressed={lightStudio}>{lightStudio ? <Moon size={16}/> : <Sun size={16}/>}</button>
      <button type="button" onClick={() => setWireframe(v => !v)} aria-label={t('Show model structure', 'إظهار هيكل المجسم')} aria-pressed={wireframe}><ScanLine size={16}/></button>
      <button type="button" onClick={() => apiRef.current?.zoom(.84)} aria-label={t('Zoom in', 'تقريب')}><ZoomIn size={16}/></button>
      <button type="button" onClick={() => apiRef.current?.zoom(1.18)} aria-label={t('Zoom out', 'إبعاد')}><ZoomOut size={16}/></button>
      <button type="button" onClick={() => setAutoRotate(v => !v)} aria-label={autoRotate ? pauseLabel : resumeLabel} aria-pressed={autoRotate}>{autoRotate ? <Pause size={16}/> : <Play size={16}/>}</button>
      <button type="button" onClick={reset} aria-label={resetLabel}><RotateCcw size={16}/></button>
    </div>
  </div>;
}
export default memo(Product3DViewer);
