import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkspaceSync } from '../src/utils/workspaceSync.js';
import { normalizeProjects, snapshot } from '../src/utils/workspaceModel.js';

const project = (id = 'one', name = id) => ({ id, name, products: [], createdAt: new Date(0).toISOString() });
function setup(t, options = {}) {
  const cache = options.cache || new Map();
  const storage = { getItem: key => cache.get(key), setItem: (key, value) => cache.set(key, value) };
  let row = null;
  let sequence = 0;
  const calls = [];
  const service = {
    read: async () => row,
    save: async pending => {
      calls.push(structuredClone(pending));
      if (row?.last_mutation_id === pending.id) return row;
      if (pending.expectedRevision !== (row?.revision || 0)) throw { code: '40001' };
      row = { projects: pending.projects, revision: (row?.revision || 0) + 1, last_mutation_id: pending.id };
      return row;
    },
  };
  const store = new WorkspaceSync({ owner: 'user-a', storage, service, uuid: () => `mutation-${++sequence}`, delay: 60_000, ...options });
  store.active = true;
  t.after(() => store.stop());
  return { store, service, cache, calls, setRow: value => { row = value; }, getRow: () => row };
}

test('projects are read-only until the cloud baseline is known', async t => {
  const { store } = setup(t);
  assert.equal(store.change(() => [project()]), false);
  await store.refresh();
  assert.equal(store.change(() => [project()]), true);
});
test('saves private drafts and persists an acknowledged revision', async t => {
  const { store, cache, getRow } = setup(t);
  await store.refresh();
  store.change(() => [project()]);
  assert.equal(store.state.status, 'queued');
  assert.ok(JSON.parse(cache.get(store.key)).pending);
  await store.flush();
  assert.equal(store.state.status, 'saved');
  assert.equal(getRow().revision, 1);
  assert.equal(JSON.parse(cache.get(store.key)).pending, null);
});
test('edits made during a save are acknowledged separately, without losing the newer draft', async t => {
  const { store, service, getRow } = setup(t);
  await store.refresh();
  store.change(() => [project()]);
  const original = service.save;
  let complete;
  service.save = pending => new Promise(resolve => { complete = async () => resolve(await original(pending)); });
  const writing = store.flush();
  store.change(current => [...current, project('two')]);
  await complete();
  await writing;
  assert.equal(store.state.projects.length, 2);
  assert.equal(store.pending.expectedRevision, 1);
  service.save = original;
  await store.flush();
  assert.equal(getRow().projects.length, 2);
  assert.equal(getRow().revision, 2);
});
test('a lost save response is reconciled after reload without applying the write twice', async t => {
  const { store, service, cache, getRow } = setup(t);
  await store.refresh();
  store.change(() => [project()]);
  const save = service.save;
  service.save = async pending => { await save(pending); throw new Error('Lost response'); };
  await store.flush();
  assert.equal(store.state.status, 'error');
  const resumed = setup(t, { cache, service }).store;
  await resumed.refresh();
  assert.equal(resumed.state.status, 'saved');
  assert.equal(resumed.pending, null);
  assert.equal(getRow().revision, 1);
});
test('stale revisions retain both the local draft and remote data', async t => {
  const { store, setRow, getRow } = setup(t);
  await store.refresh();
  store.change(() => [project('local')]);
  setRow({ projects: [project('remote')], revision: 1, last_mutation_id: 'other' });
  await store.flush();
  assert.equal(store.state.status, 'conflict');
  assert.equal(store.change(() => []), false);
  assert.equal(store.state.projects[0].id, 'local');
  assert.equal(getRow().projects[0].id, 'remote');
  await store.keepBoth();
  await store.flush();
  assert.equal(getRow().projects.length, 2);
  assert.equal(getRow().projects[0].id, 'remote');
  assert.notEqual(getRow().projects[1].id, 'local');
});
test('legacy local drafts cannot overwrite an existing cloud workspace', async t => {
  const cache = new Map([['buod-projects:user-a', JSON.stringify([project('legacy')])]]);
  const { store, setRow } = setup(t, { cache });
  setRow({ projects: [project('remote')], revision: 4 });
  await store.refresh();
  assert.equal(store.state.status, 'conflict');
  assert.equal(store.state.projects[0].id, 'legacy');
  assert.ok(cache.has('buod-projects:user-a'));
});
test('choosing cloud preserves a recoverable local backup, including at workspace limits', async t => {
  const { store, setRow, cache } = setup(t);
  await store.refresh();
  store.change(() => [project('local')]);
  setRow({ revision: 1, projects: Array.from({ length: 50 }, (_, id) => project(String(id))) });
  await store.refresh();
  await store.keepBoth();
  assert.equal(store.state.limitError, true);
  assert.equal(store.state.status, 'conflict');
  await store.chooseCloud();
  assert.equal(store.state.projects.length, 50);
  assert.equal(store.pending, null);
  assert.equal(JSON.parse(cache.get('buod-workspace-backup:v1:user-a')).projects[0].id, 'local');
});
test('a failed backup cannot discard a conflicting local draft', async t => {
  const { store, setRow } = setup(t);
  await store.refresh();
  store.change(() => [project('local')]);
  setRow({ revision: 1, projects: [project('remote')] });
  await store.refresh();
  store.storage.setItem = () => { throw new Error('Full'); };
  await store.chooseCloud();
  assert.equal(store.state.status, 'conflict');
  assert.equal(store.state.projects[0].id, 'local');
});
test('offline retry sends the durable outbox, not a false empty baseline', async t => {
  const { store, cache, service } = setup(t);
  await store.refresh();
  store.change(() => [project()]);
  service.save = async () => { throw new Error('Offline'); };
  await store.flush();
  const next = setup(t, { cache });
  await next.store.refresh();
  await next.store.flush();
  assert.equal(next.getRow().projects.length, 1);
});
test('late responses after logout cannot replace another owner state', async t => {
  const { store, service } = setup(t);
  let resolve;
  service.read = () => new Promise(done => { resolve = done; });
  const reading = store.refresh();
  store.stop();
  resolve({ projects: [project('private')], revision: 1 });
  await reading;
  assert.deepEqual(store.state.projects, []);
});
test('owner cache and guest data stay isolated', async t => {
  const cache = new Map([['buod-projects:user-a', JSON.stringify([project('secret')])]]);
  const { store } = setup(t, { cache, owner: 'user-b', service: null });
  assert.deepEqual(store.state.projects, []);
  assert.equal(store.state.status, 'local');
});
test('storage failures are visible instead of claiming a durable local save', async t => {
  const storage = { getItem() { throw new Error('Denied'); }, setItem() { throw new Error('Quota'); } };
  const { store } = setup(t, { storage, service: null });
  store.change(() => [project()]);
  assert.equal(store.state.storageError, true);
  assert.equal(store.state.projects.length, 1);
});
test('workspace limits reject a change atomically', async t => {
  const { store } = setup(t, { service: null });
  assert.equal(store.change(() => Array.from({ length: 51 }, (_, id) => project(String(id)))), false);
  assert.deepEqual(store.state.projects, []);
  assert.equal(store.state.limitError, true);
  assert.equal(store.change(() => [{ ...project(), products: Array.from({ length: 251 }, (_, id) => ({ id: String(id) })) }]), false);
});
test('normalization removes duplicates, malformed records and expiring signed URLs', () => {
  assert.deepEqual(normalizeProjects([null, {}, project(), project()]), [project()]);
  const product = snapshot({ id: 'safe', signed_image_url: 'https://storage.example/token=secret', available_formats: [null, 'RFA'] });
  assert.equal(product.signed_image_url, null);
  assert.deepEqual(product.available_formats, ['RFA']);
});
