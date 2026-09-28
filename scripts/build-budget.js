// Fail CI on unexpected browser payload growth; this is not a latency benchmark.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const directory = new URL('../dist/assets/', import.meta.url);
const names = (await readdir(directory)).filter(name => name.endsWith('.js'));
assert.ok(names.length, 'Build output is missing');
const rows = await Promise.all(names.map(async name => ({
  name, bytes: gzipSync(await readFile(new URL(name, directory))).length,
})));
const entry = rows.find(row => /^index-.*\.js$/.test(row.name));
const viewer = rows.find(row => /^Product3DViewer-.*\.js$/.test(row.name));
assert.ok(entry && viewer, 'Expected entry and lazy 3D chunks are missing');
const total = rows.reduce((sum, row) => sum + row.bytes, 0);
console.log(JSON.stringify({ unit: 'gzip-bytes', entry: entry.bytes, viewer: viewer.bytes, allJavaScript: total }));
assert.ok(entry.bytes <= 150_000, 'Entry chunk exceeds 150 kB gzip');
assert.ok(viewer.bytes <= 165_000, '3D chunk exceeds 165 kB gzip');
assert.ok(total <= 480_000, 'All JS chunks exceed 480 kB gzip');
// index.html must not eagerly fetch the lazy 3D engine.
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
assert.ok(!html.includes(viewer.name), '3D engine must remain lazy-loaded');
