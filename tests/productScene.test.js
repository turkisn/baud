import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3 } from 'three';
import { DEMO_3D_SLUGS, getDemo3DModel } from '../src/data/demo3dCatalog.js';
import { buildProductScene, cameraFitDistance, disposeProductScene } from '../src/utils/productScene.js';

for (const slug of DEMO_3D_SLUGS) {
  test(`3D model ${slug} has valid geometry and sits on the floor`, () => {
    const scene = buildProductScene(getDemo3DModel(slug), slug);
    const bounds = new Box3().setFromObject(scene);
    assert.ok(Math.abs(bounds.min.y) < 1e-6);
    assert.ok(bounds.max.y > 0);
    scene.traverse(object => {
      if (!object.geometry) return;
      const { position, normal } = object.geometry.attributes;
      assert.ok(position.count >= 3);
      assert.ok(position.array.every(Number.isFinite));
      assert.ok(normal.array.every(Number.isFinite));
    });
    let textureDisposals = 0;
    scene.userData.textures[0].addEventListener('dispose', () => textureDisposals++);
    disposeProductScene(scene);
    assert.equal(textureDisposals, 1, 'shared textures are released exactly once');
  });
}
test('portrait camera fit keeps the model inside the narrow horizontal field of view', () => {
  const desktop = cameraFitDistance(3, 1.6);
  const mobile = cameraFitDistance(3, .5);
  assert.ok(mobile > desktop);
  assert.ok(desktop > 3);
});
