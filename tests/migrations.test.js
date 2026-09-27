import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDirectory = path.join(root, 'supabase', 'migrations');
const manifestPath = path.join(migrationsDirectory, 'manifest.json');

async function loadManifest() {
  return JSON.parse(await readFile(manifestPath, 'utf8'));
}

test('migration history uses unique Supabase timestamp versions', async () => {
  const { migrations } = await loadManifest();
  const versions = migrations.map(({ version }) => version);

  assert.ok(migrations.length >= 52, 'the reconciled history must remain intact');
  assert.equal(new Set(versions).size, versions.length);
  assert.deepEqual(versions, [...versions].sort());
  assert.ok(versions.every((version) => /^\d{14}$/.test(version)));
  assert.ok(migrations.every(({ file, version, name }) => (
    file === `supabase/migrations/${version}_${name}.sql`
  )));
});

test('migration manifest covers every SQL migration', async () => {
  const { migrations } = await loadManifest();
  const actual = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith('.sql'))
    .map((file) => `supabase/migrations/${file}`)
    .sort();
  const expected = migrations.map(({ file }) => file).sort();

  assert.deepEqual(actual, expected);
});

test('reconciled migration checksums have not drifted', async () => {
  const { migrations } = await loadManifest();

  for (const { file, sha256 } of migrations) {
    const contents = await readFile(path.join(root, file));
    const actual = createHash('sha256').update(contents).digest('hex');
    assert.equal(actual, sha256, `${file} no longer matches the reconciled staging migration`);
  }
});
