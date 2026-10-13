// Frontend: pure view of the authoritative backend state.
// It never computes robot positions; it only renders snapshots + sequenced events.

type Cell = { x: number; y: number };
interface Robot {
  id: string; color: string; x: number; y: number; home: Cell; state: string; jobId: string | null;
  path: [number, number][]; status: string; waitReason: string | null; waitTicks: number; totalWait: number; moves: number; note?: string;
}
interface Job {
  id: string; shelfId: string; stationId: string; priority: number; status: string;
  createdTick: number; assignedTick: number | null; doneTick: number | null; robotId: string | null; note: string;
}
interface LogEntry { tick: number; level: string; msg: string; robotId: string | null }
interface Shelf { id: string; x: number; y: number; access: Cell }
interface Station { id: string; x: number; y: number }
interface MapInfo { w: number; h: number; types: string[]; shelves: Shelf[]; stations: Station[]; parks: Cell[] }
interface Stats { completed: number; guardStops: number; replans: number; waits: number }
interface Snapshot {
  seq: number; tick: number; running: boolean; tickMs: number; seed: number; map: MapInfo;
  robots: Robot[]; jobs: Job[]; blocked: number[]; log: LogEntry[]; stats: Stats;
}
interface UpdateEvent {
  seq: number; kind: string; tick: number; running: boolean; tickMs: number; seed: number;
  robots: Robot[]; jobs: Job[]; blocked?: number[]; logs: LogEntry[]; stats: Stats; snapshot?: Snapshot;
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const PRIO: Record<number, string> = { 3: 'High', 2: 'Normal', 1: 'Low' };

let S: Snapshot | null = null;
let jobsById = new Map<string, Job>();
let blockedSet = new Set<number>();
let es: EventSource | null = null;
let connected = false;
let reconnects = 0;
let staleDropped = 0;
let hoverRobot: string | null = null;
let manualDisconnect = false;

// ------------------------------------------------------------ stream
function connect() {
  es?.close();
  es = new EventSource('/api/stream');
  es.addEventListener('snapshot', (e) => {
    const snap = JSON.parse((e as MessageEvent).data) as Snapshot;
    applySnapshot(snap);
    connected = true; renderStatus();
  });
  es.addEventListener('update', (e) => {
    const ev = JSON.parse((e as MessageEvent).data) as UpdateEvent;
    applyEvent(ev);
  });
  es.onerror = () => {
    connected = false; renderStatus();
    // EventSource auto-reconnects; the server always sends a fresh snapshot first.
    if (es && es.readyState === EventSource.CLOSED) setTimeout(connect, 1000);
  };
}

function applySnapshot(snap: Snapshot) {
  if (S && snap.seq < S.seq) { staleDropped++; return; } // never revert to older state
  S = snap;
  jobsById = new Map(snap.jobs.map((j) => [j.id, j]));
  blockedSet = new Set(snap.blocked);
  if (!formReady) initForm();
  ($('seed') as HTMLInputElement).value ||= String(snap.seed);
  render(true);
}

function applyEvent(ev: UpdateEvent) {
  if (!S) return;
  if (ev.seq <= S.seq) { staleDropped++; return; } // duplicate / stale
  if (ev.snapshot) { applySnapshot(ev.snapshot); return; }
  if (ev.seq !== S.seq + 1) {
    // Gap detected: resync from an authoritative snapshot rather than guessing.
    resync(); return;
  }
  S.seq = ev.seq; S.tick = ev.tick; S.running = ev.running; S.tickMs = ev.tickMs; S.seed = ev.seed;
  S.robots = ev.robots; S.stats = ev.stats;
  for (const j of ev.jobs) { if (!jobsById.has(j.id)) S.jobs.push(j); else S.jobs[S.jobs.findIndex((x) => x.id === j.id)] = j; jobsById.set(j.id, j); }
  if (ev.blocked) { S.blocked = ev.blocked; blockedSet = new Set(ev.blocked); }
  if (ev.logs.length) { S.log.push(...ev.logs); if (S.log.length > 300) S.log.splice(0, S.log.length - 300); }
  render(false);
}

async function resync() {
  const snap = (await (await fetch('/api/state')).json()) as Snapshot;
  if (S && snap.seq < S.seq) return;
  S = null; applySnapshot(snap);
}

// ------------------------------------------------------------ api
async function api(path: string, body: unknown) {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || r.statusText);
  return j;
}
function flash(msg: string, ok: boolean) { const m = $('formMsg'); m.textContent = msg; m.className = `msg ${ok ? 'ok' : 'err'}`; }
async function act(fn: () => Promise<unknown>, okMsg?: string) {
  try { await fn(); if (okMsg) flash(okMsg, true); } catch (e) { flash((e as Error).message, false); }
}

// ------------------------------------------------------------ form
let formReady = false;
function initForm() {
  if (!S) return;
  formReady = true;
  $('fShelf').innerHTML = S.map.shelves.map((s) => `<option value="${s.id}">${s.id} (${s.x},${s.y})</option>`).join('');
  $('fStation').innerHTML = S.map.stations.map((s) => `<option value="${s.id}">${s.id}</option>`).join('');
}
$('jobForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const body = { shelfId: ($('fShelf') as HTMLSelectElement).value, stationId: ($('fStation') as HTMLSelectElement).value, priority: Number(($('fPriority') as HTMLSelectElement).value) };
  act(async () => { const r = await api('/api/jobs', body); flash(`Created ${r.job.id}`, true); });
});
$('btnDemo').onclick = () => act(() => api('/api/jobs/demo', {}), 'Created 4 crossing jobs');
$('btnRandom').onclick = () => act(() => api('/api/jobs/random', { count: 5 }), 'Created 5 random jobs');
$('btnRun').onclick = () => act(() => api('/api/control', { action: S?.running ? 'pause' : 'resume' }));
$('btnStep').onclick = () => act(() => api('/api/control', { action: 'step' }));
$('btnReset').onclick = () => {
  const seed = ($('seed') as HTMLInputElement).value;
  if (!confirm(`Reset the run with seed ${seed || S?.seed}? All jobs and blocks are cleared.`)) return;
  act(() => api('/api/control', { action: 'reset', seed }), 'Simulation reset');
};
$('speed').onchange = () => act(() => api('/api/control', { action: 'speed', tickMs: Number(($('speed') as HTMLSelectElement).value) }));
$('btnDisconnect').onclick = () => {
  if (!manualDisconnect) { manualDisconnect = true; es?.close(); es = null; connected = false; $('btnDisconnect').textContent = 'Reconnect'; }
  else { manualDisconnect = false; reconnects++; $('btnDisconnect').textContent = 'Disconnect'; connect(); }
  renderStatus();
};

// ------------------------------------------------------------ canvas
const canvas = $('map') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
let CS = 28;
function cellAt(ev: MouseEvent): Cell | null {
  if (!S) return null;
  const r = canvas.getBoundingClientRect();
  const x = Math.floor(((ev.clientX - r.left) / r.width) * S.map.w);
  const y = Math.floor(((ev.clientY - r.top) / r.height) * S.map.h);
  return x >= 0 && y >= 0 && x < S.map.w && y < S.map.h ? { x, y } : null;
}
canvas.addEventListener('click', (ev) => {
  const c = cellAt(ev); if (!c || !S) return;
  const t = S.map.types[c.y * S.map.w + c.x];
  if (t === 'wall' || t === 'shelf') { flash(`(${c.x},${c.y}) is a ${t}; only traversable cells can be blocked`, false); return; }
  const blocked = !blockedSet.has(c.y * S.map.w + c.x);
  act(() => api('/api/cells', { x: c.x, y: c.y, blocked }), `${blocked ? 'Blocked' : 'Unblocked'} (${c.x},${c.y})`);
});
canvas.addEventListener('mousemove', (ev) => {
  const c = cellAt(ev); const tip = $('tip');
  const r = c && S ? S.robots.find((rb) => rb.x === c.x && rb.y === c.y) : null;
  const newHover = r ? r.id : null;
  if (newHover !== hoverRobot) { hoverRobot = newHover; draw(); renderRobots(); }
  if (!r || !c) { tip.style.display = 'none'; return; }
  const j = r.jobId ? jobsById.get(r.jobId) : null;
  tip.innerHTML = `<b>${r.id}</b> @ (${r.x},${r.y}) — ${r.status}<br>${j ? `${j.id}: ${j.shelfId}→${j.stationId} (${PRIO[j.priority]})<br>` : ''}${r.note || ''}${r.waitReason ? `<br><span style="color:#fbd38d">${esc(r.waitReason)}</span>` : ''}`;
  const rect = canvas.getBoundingClientRect();
  tip.style.display = 'block';
  tip.style.left = `${Math.min(ev.clientX - rect.left + 12, rect.width - 200)}px`;
  tip.style.top = `${ev.clientY - rect.top + 12}px`;
});
canvas.addEventListener('mouseleave', () => { $('tip').style.display = 'none'; if (hoverRobot) { hoverRobot = null; draw(); renderRobots(); } });

function resize() {
  if (!S) return;
  const wrap = canvas.parentElement!;
  CS = Math.max(10, Math.floor(wrap.clientWidth / S.map.w));
  const dpr = window.devicePixelRatio || 1;
  canvas.width = S.map.w * CS * dpr; canvas.height = S.map.h * CS * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}
window.addEventListener('resize', resize);

function draw() {
  if (!S) return;
  const { w, h, types } = S.map;
  ctx.clearRect(0, 0, w * CS, h * CS);
  // bottleneck detection: floor cell with walls/shelves on both left & right
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; const t = types[i];
    const solid = (xx: number) => xx < 0 || xx >= w || types[y * w + xx] === 'wall' || types[y * w + xx] === 'shelf';
    let fill = '#f7f9fb';
    if (t === 'wall') fill = '#3a3f47';
    else if (t === 'shelf') fill = '#c9a36b';
    else if (t === 'station') fill = '#2b6cb0';
    else if (t === 'park') fill = '#e6ecf2';
    else if (solid(x - 1) && solid(x + 1)) fill = '#fff3c4';
    ctx.fillStyle = fill; ctx.fillRect(x * CS, y * CS, CS, CS);
    ctx.strokeStyle = '#e1e6ec'; ctx.lineWidth = 0.5; ctx.strokeRect(x * CS + 0.25, y * CS + 0.25, CS - 0.5, CS - 0.5);
    if (blockedSet.has(i)) {
      ctx.fillStyle = '#fed7d7'; ctx.fillRect(x * CS, y * CS, CS, CS);
      ctx.strokeStyle = '#c53030'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x * CS + 4, y * CS + 4); ctx.lineTo(x * CS + CS - 4, y * CS + CS - 4);
      ctx.moveTo(x * CS + CS - 4, y * CS + 4); ctx.lineTo(x * CS + 4, y * CS + CS - 4); ctx.stroke();
    }
  }
  ctx.font = `${Math.max(7, CS * 0.32)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const activeShelves = new Set(S.jobs.filter((j) => j.status !== 'done').map((j) => j.shelfId));
  for (const s of S.map.shelves) {
    if (activeShelves.has(s.id)) { ctx.strokeStyle = '#c53030'; ctx.lineWidth = 2; ctx.strokeRect(s.x * CS + 1.5, s.y * CS + 1.5, CS - 3, CS - 3); }
    ctx.fillStyle = '#5a3e1b'; ctx.fillText(s.id.slice(1), s.x * CS + CS / 2, s.y * CS + CS / 2);
  }
  for (const s of S.map.stations) { ctx.fillStyle = '#fff'; ctx.fillText(s.id, s.x * CS + CS / 2, s.y * CS + CS / 2); }
  // planned paths
  for (const r of S.robots) {
    if (r.path.length < 2) continue;
    const hl = hoverRobot === r.id;
    ctx.strokeStyle = r.color; ctx.globalAlpha = hoverRobot && !hl ? 0.15 : 0.75; ctx.lineWidth = hl ? 4 : 2.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    r.path.forEach(([x, y], k) => { const px = x * CS + CS / 2, py = y * CS + CS / 2; if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
    ctx.stroke(); ctx.setLineDash([]);
    const [ex, ey] = r.path[r.path.length - 1];
    ctx.beginPath(); ctx.arc(ex * CS + CS / 2, ey * CS + CS / 2, CS * 0.15, 0, Math.PI * 2); ctx.fillStyle = r.color; ctx.fill();
    ctx.globalAlpha = 1;
  }
  // goals of active jobs
  for (const r of S.robots) {
    if (!r.jobId) continue; const j = jobsById.get(r.jobId); if (!j) continue;
    const tgt = r.state === 'to_pickup' || r.state === 'loading' ? S.map.shelves.find((s) => s.id === j.shelfId)?.access : S.map.stations.find((s) => s.id === j.stationId);
    if (!tgt) continue;
    ctx.strokeStyle = r.color; ctx.lineWidth = 2; ctx.strokeRect(tgt.x * CS + 3, tgt.y * CS + 3, CS - 6, CS - 6);
  }
  // robots
  for (const r of S.robots) {
    const cx = r.x * CS + CS / 2, cy = r.y * CS + CS / 2;
    ctx.beginPath(); ctx.arc(cx, cy, CS * 0.4, 0, Math.PI * 2); ctx.fillStyle = r.color; ctx.fill();
    ctx.lineWidth = hoverRobot === r.id ? 3 : 1.5; ctx.strokeStyle = r.state === 'to_station' || r.state === 'unloading' ? '#111' : '#fff'; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.max(7, CS * 0.33)}px sans-serif`; ctx.fillText(r.id.slice(1), cx, cy);
    if (r.status === 'waiting' || r.status === 'detour') {
      ctx.fillStyle = r.status === 'waiting' ? '#dd6b20' : '#d69e2e';
      ctx.beginPath(); ctx.arc(cx + CS * 0.32, cy - CS * 0.32, CS * 0.17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.max(6, CS * 0.22)}px sans-serif`; ctx.fillText(r.status === 'waiting' ? '⏸' : '↯', cx + CS * 0.32, cy - CS * 0.32);
    }
  }
}

// ------------------------------------------------------------ panels
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function renderStatus() {
  const el = $('status');
  if (!S) { el.innerHTML = `<span class="bad">connecting…</span>`; return; }
  el.innerHTML = `<span class="${connected ? 'ok' : 'bad'}">● ${connected ? 'live' : manualDisconnect ? 'disconnected' : 'reconnecting'}</span>
    <span>seq ${S.seq}</span><span>tick ${S.tick}</span><span>seed ${S.seed}</span>
    <span>${S.running ? '▶ running' : '⏸ paused'}</span><span>done ${S.stats.completed}</span>
    <span>replans ${S.stats.replans}</span><span>guard stops ${S.stats.guardStops}</span>
    <span title="reconnects / stale events dropped">rc ${reconnects}/${staleDropped}</span>`;
  $('btnRun').textContent = S.running ? 'Pause' : 'Resume';
}

function renderRobots() {
  if (!S) return;
  $('robots').innerHTML = S.robots.map((r) => {
    const j = r.jobId ? jobsById.get(r.jobId) : null;
    return `<div class="robot ${hoverRobot === r.id ? 'hl' : ''}" data-id="${r.id}">
      <span class="dot" style="background:${r.color}"></span><span class="id">${r.id}</span>
      <span><span class="badge b-${r.status}">${r.status}</span> (${r.x},${r.y}) ${j ? `· ${j.id} <span class="p${j.priority}">${PRIO[j.priority]}</span> · ${esc(r.note || '')}` : `· ${esc(r.note || 'idle')}`}</span>
      ${r.waitReason ? `<span class="why">${r.waitTicks ? `⏱ ${r.waitTicks}t · ` : ''}${esc(r.waitReason)}</span>` : ''}
    </div>`;
  }).join('');
}
$('robots').addEventListener('mouseover', (e) => {
  const el = (e.target as HTMLElement).closest('.robot') as HTMLElement | null;
  const id = el?.dataset.id ?? null; if (id !== hoverRobot) { hoverRobot = id; draw(); }
});
$('robots').addEventListener('mouseleave', () => { hoverRobot = null; draw(); renderRobots(); });

function renderJobs() {
  if (!S) return;
  const order: Record<string, number> = { delivering: 0, picking: 1, assigned: 2, queued: 3, done: 4 };
  const jobs = [...S.jobs].sort((a, b) => order[a.status] - order[b.status] || b.priority - a.priority || Number(b.id.slice(1)) - Number(a.id.slice(1))).slice(0, 80);
  const active = S.jobs.filter((j) => j.status !== 'done').length;
  $('jobCount').textContent = `${active} active · ${S.jobs.length - active} done`;
  ($('jobs').querySelector('tbody') as HTMLElement).innerHTML = jobs.map((j) => `<tr>
    <td>${j.id}</td><td>${j.shelfId}→${j.stationId}</td><td class="p${j.priority}">${PRIO[j.priority]}</td>
    <td class="s-${j.status}">${j.status}</td><td>${j.robotId ?? '—'}</td>
    <td>${(j.doneTick ?? S!.tick) - j.createdTick}t</td><td class="detail">${esc(j.note)}</td></tr>`).join('') || `<tr><td colspan="7" class="muted">No jobs yet — create one or use the demo button.</td></tr>`;
}

let lastLogLen = -1;
function renderLog(full: boolean) {
  if (!S) return;
  const el = $('log');
  if (!full && S.log.length === lastLogLen) return;
  lastLogLen = S.log.length;
  const stick = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
  el.innerHTML = S.log.slice(-200).map((l) => `<div class="${l.level}"><span class="t">[${String(l.tick).padStart(4, ' ')}]</span> ${esc(l.msg)}</div>`).join('');
  if (stick || full) el.scrollTop = el.scrollHeight;
}

function render(full: boolean) {
  if (full) resize(); else draw();
  renderStatus(); renderRobots(); renderJobs(); renderLog(full);
}

renderStatus();
connect();
