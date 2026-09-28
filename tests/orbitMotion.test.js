import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { setOrbitRotation } from '../src/utils/orbitMotion.js';

test('pause settles real OrbitControls inertia without disabling later interaction', () => {
  const camera = new PerspectiveCamera(38, 1, .05, 160);
  camera.position.set(0, 2, 5);
  const controls = new OrbitControls(camera, null);
  controls.enableDamping = true;
  controls.dampingFactor = .13;
  setOrbitRotation(controls, true);
  for (let frame = 0; frame < 10; frame++) controls.update(.5);
  setOrbitRotation(controls, false);
  const settled = camera.position.clone();
  for (let frame = 0; frame < 20; frame++) {
    assert.equal(controls.update(.5), false);
    assert.ok(camera.position.distanceTo(settled) < 1e-10);
  }
  assert.equal(controls.enableDamping, true);
  setOrbitRotation(controls, true);
  assert.equal(controls.update(.5), true);
  assert.ok(camera.position.distanceTo(settled) > 0);
});

test('pause preserves a caller that already disabled damping', () => {
  const controls = { autoRotate: true, enableDamping: false, update(delta) { assert.equal(delta, 0); } };
  setOrbitRotation(controls, false);
  assert.equal(controls.autoRotate, false);
  assert.equal(controls.enableDamping, false);
});
