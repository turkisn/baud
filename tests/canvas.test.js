import test from 'node:test';
import assert from 'node:assert/strict';
import { canvasRenderSize, MAX_CANVAS_DENSITY, MAX_CANVAS_PIXELS } from '../src/utils/canvas.js';

test('caps high-density 3D canvases to the render pixel budget', () => {
  const size = canvasRenderSize(1100, 560, 2);
  assert.ok(size.width * size.height <= MAX_CANVAS_PIXELS + size.width);
  assert.ok(size.density < 2);
});

test('keeps ordinary canvases sharp without exceeding the density cap', () => {
  const size = canvasRenderSize(320, 480, 3);
  assert.equal(size.density, MAX_CANVAS_DENSITY);
  assert.deepEqual([size.width, size.height], [480, 720]);
});

test('normalizes invalid dimensions and density', () => {
  const size = canvasRenderSize(0, Number.NaN, 0);
  assert.deepEqual([size.width, size.height, size.density], [1, 1, 1]);
});

test('honors the pixel budget even for unusually large canvas dimensions', () => {
  const size = canvasRenderSize(10_000, 10_000, 2);
  assert.ok(size.width * size.height <= MAX_CANVAS_PIXELS + size.width);
});
