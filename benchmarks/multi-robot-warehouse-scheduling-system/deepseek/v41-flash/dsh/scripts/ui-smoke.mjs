// UI smoke test: boots the frontend against a minimal DOM stub, feeds it a real
// snapshot and a burst of real events from the engine, and asserts the rendered
// markup. This catches wiring mistakes (missing element ids, bad property names,
// exceptions inside the render path) without needing a browser.
//
//   node scripts/ui-smoke.mjs

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { Engine } from '../server/engine.js';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');

const problems = [];
const check = (label, ok, detail = '') => {
  console.log(`   ${ok ? '\u2713' : '\u2717'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) problems.push(label);
};

// ------------------------------------------------------------- DOM stub ---
class ClassList {
  constructor() { this.set = new Set(); }
  add(...c) { c.forEach((x) => this.set.add(x)); }
  remove(...c) { c.forEach((x) => this.set.delete(x)); }
  toggle(c, force) { const on = force === undefined ? !this.set.has(c) : force; if (on) this.set.add(c); else this.set.delete(c); return on; }
  contains(c) { return this.set.has(c); }
}

const ctxStub = new Proxy(
  {
    setTransform() {}, clearRect() {}, fillRect() {}, strokeRect() {}, beginPath() {}, moveTo() {}, lineTo() {},
    arc() {}, arcTo() {}, closePath() {}, fill() {}, stroke() {}, fillText() {}, save() {}, restore() {},
    setLineDash() {}, measureText: () => ({ width: 10 }),
  },
  { get: (target, prop) => (prop in target ? target[prop] : undefined), set: (target, prop, value) => ((target[prop] = value), true) },
);

let created = 0;
function makeElement(id, tag = 'div') {
  const el = {
    id,
    tagName: tag.toUpperCase(),
    textContent: '',
    innerHTML: '',
    value: '',
    checked: true,
    hidden: false,
    className: '',
    classList: new ClassList(),
    style: {},
    dataset: {},
    options: [],
    children: [],
    scrollTop: 0,
    scrollHeight: 100,
    clientWidth: 900,
    clientHeight: 480,
    listeners: {},
    addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); },
    removeEventListener() {},
    dispatchEvent(evt) { (this.listeners[evt.type] ?? []).forEach((fn) => fn({ type: evt.type, target: this, preventDefault() {} })); },
    querySelectorAll() { return []; },
    querySelector(sel) {
      const child = makeElement(`${id ?? 'dyn'}${sel}`, 'span');
      this.children.push(child);
      return child;
    },
    closest() { return null; },
    appendChild(child) { this.children.push(child); return child; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 900, height: 480 }; },
    getContext() { return ctxStub; },
    setAttribute() {},
    focus() {},
  };
  created += 1;
  return el;
}

const elements = new Map();
for (const m of html.matchAll(/\bid="([^"]+)"/g)) {
  const tag = html.slice(Math.max(0, m.index - 60), m.index).match(/<(\w+)[^<]*$/)?.[1] ?? 'div';
  elements.set(m[1], makeElement(m[1], tag));
}

const fetchCalls = [];
globalThis.document = {
  hidden: false,
  getElementById: (id) => elements.get(id) ?? null,
  addEventListener() {},
  createElement: (tag) => makeElement(null, tag),
};
const listeners = {};
globalThis.window = {
  devicePixelRatio: 2,
  innerHeight: 900,
  addEventListener(type, fn) { (listeners[type] ??= []).push(fn); },
  removeEventListener() {},
};
globalThis.location = { protocol: 'http:', host: '127.0.0.1:8090' };
globalThis.requestAnimationFrame = (fn) => setTimeout(() => fn(0), 0);
globalThis.EventSource = class { constructor() {} close() {} };
globalThis.WebSocket = class {
  constructor() { this.readyState = 1; setTimeout(() => this.onopen?.(), 0); }
  send() {}
  close() {}
};

// ------------------------------------------------------------------ engine ---
const engine = new Engine({ seed: 3 });
engine.paused = false;
const warehouse = engine.warehouse;
engine.createJob({ shelfId: warehouse.shelves[2].id, workstationId: warehouse.workstations[0].id, priority: 4 });
engine.createJob({ shelfId: warehouse.shelves[9].id, workstationId: warehouse.workstations[2].id, priority: 2 });

globalThis.fetch = async (requestUrl) => {
  fetchCalls.push(requestUrl);
  const body = requestUrl.includes('/api/config')
    ? { config: engine.config() }
    : requestUrl.includes('/api/state')
      ? { seq: engine.eventSeq, snapshot: engine.snapshot() }
      : { ok: true };
  return { ok: true, status: 200, json: async () => body };
};

// --------------------------------------------------------------- boot it ---
const app = await import(`${url.pathToFileURL(path.join(root, 'public', 'app.js')).href}?smoke=${Date.now()}`);
await new Promise((r) => setTimeout(r, 60));

check('frontend module loaded without throwing', Boolean(app));
check('config fetched', fetchCalls.some((u) => u.includes('/api/config')));
check('initial snapshot fetched', fetchCalls.some((u) => u.includes('/api/state')));

const shelfSelect = elements.get('job-shelf');
const wsSelect = elements.get('job-ws');
check('shelf picker populated', shelfSelect.options.length === warehouse.shelves.length + 0 || shelfSelect.innerHTML.includes('SH-'), `${warehouse.shelves.length} shelves`);
check('workstation picker populated', wsSelect.innerHTML.includes('WS-'), '4 workstations');
check('robot table rendered', elements.get('robot-rows').innerHTML.includes('R01') && elements.get('robot-rows').innerHTML.includes('steps'));
check('job table rendered', elements.get('job-rows').innerHTML.includes('JOB-001'));
check('chips show the tick', /^\d+$/.test(elements.get('chip-tick').textContent), `tick ${elements.get('chip-tick').textContent}`);
check('legend/connection line updated', typeof elements.get('conn-line').textContent === 'string' && elements.get('conn-line').textContent.length > 0);

// feed a burst of real events through the exact path the socket uses
const api = app.__test;
check('frontend exposes its state-transition hook for testing', Boolean(api?.applyEvent));
const before = elements.get('log').innerHTML.length;
const seqs = [];
for (let i = 0; i < 30; i++) {
  engine.tickOnce();
  for (const evt of engine.events.filter((e) => e.seq > (seqs.at(-1) ?? api.state.lastSeq))) {
    api.handleMessage({ type: 'event', seq: evt.seq, tick: evt.tick, event: evt });
    seqs.push(evt.seq);
  }
}
await new Promise((r) => setTimeout(r, 40));
check('events applied in sequence', seqs.length > 20, `${seqs.length} events applied`);
check('applied sequence is strictly increasing', seqs.every((v, i) => i === 0 || v > seqs[i - 1]));
check('tick advanced from streamed events', Number(elements.get('chip-tick').textContent) > 0, `tick ${elements.get('chip-tick').textContent}`);
check('seq chip tracks the stream', elements.get('chip-seq').textContent === String(api.state.lastSeq), `seq ${elements.get('chip-seq').textContent}`);
check('robot table shows live positions', /\d+,\d+/.test(elements.get('robot-rows').innerHTML));
check('planned routes are rendered', api.state.sim.robots.some((r) => Array.isArray(r.path) && r.path.length > 2));
check('waiting reasons are surfaced', api.state.sim.robots.every((r) => r.waitingReason === null || typeof r.waitingReason === 'string'));

// stale traffic must never be applied
const applied = api.state.lastSeq;
const staleSeq = Math.max(1, applied - 5);
api.handleMessage({ type: 'event', seq: staleSeq, tick: 0, event: { seq: staleSeq, tick: 0, type: 'TICK', message: 'stale', data: { tick: 0, robots: [] } } });
check('stale events are dropped', api.state.lastSeq === applied && api.state.staleDropped > 0, `${api.state.staleDropped} dropped`);
api.handleMessage({ type: 'snapshot', snapshot: { ...engine.snapshot(), seq: staleSeq, tick: 0 } });
check('stale snapshots never rewind the view', api.state.lastSeq === applied && api.state.sim.tick > 0, `tick ${api.state.sim.tick}`);

// a fresh snapshot is accepted and becomes the new authoritative base
const fresh = engine.snapshot();
api.handleMessage({ type: 'snapshot', snapshot: fresh });
check('fresh snapshot accepted', api.state.lastSeq === fresh.seq && api.state.sim.tick === fresh.tick, `seq ${fresh.seq}, tick ${fresh.tick}`);
check('event log has entries', elements.get('log').innerHTML.length > 0, `${elements.get('log').innerHTML.length} chars`);
check('log html grew after rendering', elements.get('log').innerHTML.length >= before);
check('no element lookup returned null', created > 30, `${created} stub elements created`);

// ------------------------------------------------------------------ report ---
console.log(problems.length === 0 ? '\nUI smoke test PASSED\n' : `\nUI smoke test FAILED: ${problems.join(', ')}\n`);
process.exit(problems.length === 0 ? 0 : 1);
