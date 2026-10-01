import { Box3, LoadingManager, Vector3 } from 'three';
import { isCurated3DAsset } from '../data/product3dAssets.js';
import { disposeProductScene } from './productScene.js';

export async function loadProductPreview(asset, signal) {
  if (!isCurated3DAsset(asset)) throw new Error('Unreviewed preview asset');
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeout = setTimeout(abort, 15000);
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  let product;
  try {
    const response = await fetch(asset.url, { signal: controller.signal, credentials: 'omit' });
    if (!response.ok || !response.body) throw new Error('Preview download failed');
    const reader = response.body.getReader();
    const bytes = new Uint8Array(asset.bytes);
    let offset = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (offset + value.length > bytes.length) throw new Error('Oversized preview');
        bytes.set(value, offset);
        offset += value.length;
      }
    } finally { await reader.cancel(); }
    if (offset !== bytes.length) throw new Error('Incomplete preview');
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hash = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
    if (hash !== asset.sha256) throw new Error('Preview integrity mismatch');
    controller.signal.throwIfAborted();
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const manager = new LoadingManager();
    // The reviewed GLB is self-contained; no external textures or buffers are allowed.
    manager.setURLModifier(() => { throw new Error('External preview resources are not allowed'); });
    const gltf = await new GLTFLoader(manager).parseAsync(bytes.buffer, '');
    product = gltf.scene;
    controller.signal.throwIfAborted();
    const bounds = new Box3().setFromObject(product);
    const center = bounds.getCenter(new Vector3());
    if (bounds.isEmpty() || ![...bounds.min, ...bounds.max].every(Number.isFinite)) throw new Error('Invalid preview bounds');
    // Preserve source scale and geometry; translate only to the studio origin.
    product.position.x -= center.x;
    product.position.y -= bounds.min.y;
    product.position.z -= center.z;
    product.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
    return product;
  } catch (error) {
    if (product) disposeProductScene(product);
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
