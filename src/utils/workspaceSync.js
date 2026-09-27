import { normalizeProjects, workspaceWithinLimits } from './workspaceModel.js';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** A single-owner, durable outbox. A revision conflict never overwrites either copy. */
export class WorkspaceSync {
  constructor({ owner, storage, service, uuid = () => crypto.randomUUID(), delay = 500 }) {
    this.owner = owner;
    this.storage = storage;
    this.service = service;
    this.uuid = uuid;
    this.delay = delay;
    this.key = `buod-workspace:v1:${owner}`;
    this.listeners = new Set();
    this.active = false;
    this.epoch = 0;
    this.busy = false;
    this.ready = !service;
    this.revision = 0;
    this.pending = null;
    let projects = [];
    let storageError = false;
    let backupAvailable = false;
    try {
      backupAvailable = Boolean(storage.getItem(`buod-workspace-backup:v1:${owner}`));
      const cached = JSON.parse(storage.getItem(this.key) || 'null');
      if (cached?.schemaVersion === 1 && Number.isSafeInteger(cached.revision) && cached.revision >= 0) {
        projects = normalizeProjects(cached.projects);
        this.revision = cached.revision;
        if (cached.pending && typeof cached.pending.id === 'string'
          && Number.isSafeInteger(cached.pending.expectedRevision) && cached.pending.expectedRevision >= 0) {
          this.pending = { ...cached.pending, projects: normalizeProjects(cached.pending.projects) };
        }
      } else {
        projects = normalizeProjects(JSON.parse(storage.getItem(`buod-projects:${owner}`) || 'null'));
        // Import legacy drafts only against an empty remote baseline, never on top of cloud data.
        if (service && projects.length) this.pending = { id: uuid(), expectedRevision: 0, projects };
      }
    } catch { storageError = true; }
    this.state = { projects, status: service ? 'loading' : 'local', storageError, limitError: false, backupAvailable };
  }

  getSnapshot = () => this.state;
  subscribe = (listener) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  emit(change) {
    this.state = { ...this.state, ...change };
    this.listeners.forEach(listener => listener());
  }
  persist() {
    try {
      this.storage.setItem(this.key, JSON.stringify({ schemaVersion: 1, projects: this.state.projects,
        revision: this.revision, pending: this.pending }));
      if (this.state.storageError) this.emit({ storageError: false });
      return true;
    } catch { this.emit({ storageError: true }); return false; }
  }
  start() {
    this.active = true;
    if (this.service) void this.refresh();
    else this.persist();
  }
  stop() {
    this.active = false;
    this.epoch++;
    this.busy = false;
    clearTimeout(this.timer);
    this.request?.abort();
  }
  canEdit() { return this.ready && this.state.status !== 'conflict'; }
  change(update) {
    if (!this.canEdit()) return false;
    const projects = normalizeProjects(update(this.state.projects));
    if (!workspaceWithinLimits(projects)) { this.emit({ limitError: true }); return false; }
    if (same(projects, this.state.projects)) return true;
    // Keep the in-flight payload immutable so retries remain idempotent.
    if (this.service && !this.pending) this.pending = { id: this.uuid(), expectedRevision: this.revision, projects };
    this.emit({ projects, limitError: false, status: this.service ? 'queued' : 'local' });
    this.persist();
    this.schedule();
    return true;
  }
  schedule() {
    clearTimeout(this.timer);
    if (this.active && this.service && !this.busy && this.pending && this.state.status !== 'conflict') {
      this.timer = setTimeout(() => void this.flush(), this.delay);
    }
  }
  async operation(run) {
    if (!this.active || this.busy) return;
    this.busy = true;
    const epoch = this.epoch;
    const request = new AbortController();
    this.request = request;
    const timeout = setTimeout(() => request.abort(), 15_000);
    try { await run(request.signal, () => this.active && this.epoch === epoch); }
    catch (error) {
      if (this.active && this.epoch === epoch) this.emit({ status: error.code === '40001' ? 'conflict' : 'error' });
    } finally {
      clearTimeout(timeout);
      if (this.epoch === epoch) { this.busy = false; this.request = null; }
    }
  }
  acknowledge(row) {
    this.revision = row.revision;
    this.pending = same(this.state.projects, this.pending.projects) ? null
      : { id: this.uuid(), expectedRevision: row.revision, projects: this.state.projects };
    this.emit({ status: this.pending ? 'queued' : 'saved' });
    this.persist();
  }
  async refresh() {
    if (!this.service || this.busy) return;
    clearTimeout(this.timer);
    await this.operation(async (signal, current) => {
      const row = await this.service.read(signal);
      if (!current()) return;
      this.ready = true;
      if (this.pending) {
        if (row?.last_mutation_id === this.pending.id) this.acknowledge(row);
        else if ((row?.revision || 0) !== this.pending.expectedRevision) this.emit({ status: 'conflict' });
        else this.emit({ status: 'queued' });
      } else {
        this.revision = row?.revision || 0;
        this.emit({ projects: normalizeProjects(row?.projects), status: 'saved' });
        this.persist();
      }
    });
    if (this.state.status === 'queued') this.schedule();
  }
  async flush() {
    if (!this.pending || !this.service || !this.ready || this.busy || this.state.status === 'conflict') return;
    clearTimeout(this.timer);
    await this.operation(async (signal, current) => {
      this.emit({ status: 'saving' });
      const row = await this.service.save(this.pending, signal);
      if (current()) this.acknowledge(row);
    });
    if (this.state.status === 'queued') this.schedule();
  }
  async keepBoth() {
    if (this.state.status !== 'conflict' || this.busy) return;
    await this.operation(async (signal, current) => {
      const row = await this.service.read(signal);
      if (!current()) return;
      const copies = this.state.projects.map(project => ({ ...project, id: this.uuid(), name: `${project.name.slice(0, 85)} (copy)` }));
      const projects = [...normalizeProjects(row?.projects), ...copies];
      if (!workspaceWithinLimits(projects)) { this.emit({ limitError: true }); return; }
      this.revision = row?.revision || 0;
      this.pending = { id: this.uuid(), expectedRevision: this.revision, projects };
      this.emit({ projects, status: 'queued', limitError: false });
      this.persist();
    });
    if (this.state.status === 'queued') this.schedule();
  }
  async chooseCloud() {
    if (this.state.status !== 'conflict' || this.busy) return;
    // Never discard the local draft: preserve a recoverable backup before switching.
    try {
      this.storage.setItem(`buod-workspace-backup:v1:${this.owner}`, JSON.stringify({
        projects: this.state.projects, pending: this.pending, backedUpAt: new Date().toISOString(),
      }));
      this.emit({ backupAvailable: true });
    } catch { this.emit({ storageError: true }); return; }
    await this.operation(async (signal, current) => {
      const row = await this.service.read(signal);
      if (!current()) return;
      this.revision = row?.revision || 0;
      this.pending = null;
      this.emit({ projects: normalizeProjects(row?.projects), status: 'saved', limitError: false });
      this.persist();
    });
  }
}
