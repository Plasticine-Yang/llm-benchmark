// Frontend for the multi-robot warehouse scheduling system.
//
// The browser is a pure observer: it never decides a robot position. It receives
// a complete snapshot on connect and then applies monotonically sequenced events
// (WebSocket, with an SSE fallback). A snapshot is only accepted when its
// sequence number is not older than what has already been applied, so a
// reconnecting page can never revert to stale state.

const $ = (id) => document.getElementById(id);

// ------------------------------------------------------------------- state ---
const state = {
  connected: false,
  transport: null,
  lastSeq: 0,
  staleDropped: 0,
  config: null,
  sim: { tick: 0, paused: true, seq: 0, robots: [], jobs: [], blocked: [], stats: {} },
  jobs: new Map(),
  blocked: new Set(),
  selectedRobot: null,
  selectedCell: null,
  showPaths: true,
  showLanes: true,
  showLabels: true,
  blockMode: false,
  hoverCell: null,
  log: [],
  logFilter: 'important',
  autoScroll: true,
};

const ROBOT_HUES = [205, 145, 45, 320, 265, 20, 175, 95, 240, 350, 120, 290];
const robotColor = (index, light = 60) => `hsl(${ROBOT_HUES[index % ROBOT_HUES.length]} 85% ${light}%)`;

const IMPORTANT_EVENTS = new Set([
  'JOB_CREATED', 'JOB_ASSIGNED', 'JOB_PICKED', 'JOB_DONE', 'JOB_AGED', 'JOB_QUEUED_SHELF',
  'REPLAN', 'CELL_BLOCKED', 'CELL_UNBLOCKED', 'DEADLOCK_BREAKER', 'DEADLOCK_RISK', 'NO_PATH',
  'SIM_PAUSED', 'SIM_RESUMED', 'SIM_STEP', 'SIM_RESET', 'SIM_READY', 'SIM_SPEED', 'CLIENT',
]);
const WAIT_EVENTS = new Set(['ROBOT_WAITING', 'LANE_YIELD']);
const MOVE_EVENTS = new Set(['ROBOT_MOVED', 'PATH_SET', 'TICK']);

function eventClass(type) {
  if (type === 'CELL_BLOCKED' || type === 'DEADLOCK_BREAKER' || type === 'NO_PATH' || type === 'DEADLOCK_RISK') return 'bad';
  if (type === 'ROBOT_WAITING' || type === 'JOB_AGED' || type === 'JOB_QUEUED_SHELF') return 'warn';
  if (type === 'JOB_DONE' || type === 'SIM_READY' || type === 'CELL_UNBLOCKED') return 'good';
  if (type === 'REPLAN' || type === 'SIM_RESET' || type === 'CLIENT') return 'sys';
  return '';
}

// -------------------------------------------------------------- transport ---
let socket = null;
let sseSource = null;
let reconnectTimer = null;
let reconnectDelay = 800;
let manualClose = false;

function setConnection(kind, text) {
  $('chip-conn').className = `chip ${kind}`;
  $('conn-text').textContent = text;
  $('conn-line').textContent = text;
}

function connect() {
  manualClose = false;
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${proto}//${location.host}/ws`;
  setConnection('reconnecting', 'connecting…');
  try {
    socket = new WebSocket(url);
  } catch (err) {
    setConnection('reconnecting', 'websocket unavailable');
    fallbackToSse();
    return;
  }
  socket.onopen = () => {
    state.transport = 'websocket';
    reconnectDelay = 800;
    setConnection('live', 'live · websocket');
    logEvent('CLIENT', 'websocket connected — waiting for snapshot');
  };
  socket.onmessage = (evt) => {
    let msg;
    try {
      msg = JSON.parse(evt.data);
    } catch {
      return;
    }
    handleMessage(msg);
  };
  socket.onclose = () => {
    if (manualClose) return;
    state.connected = false;
    setConnection('reconnecting', 'disconnected · reconnecting…');
    scheduleReconnect();
  };
  socket.onerror = () => {
    if (socket && socket.readyState !== WebSocket.OPEN) fallbackToSse();
  };
}

function fallbackToSse() {
  if (sseSource) return;
  try {
    sseSource = new EventSource('/api/stream');
    state.transport = 'sse';
    setConnection('live', 'live · sse fallback');
    sseSource.onmessage = (evt) => {
      try {
        handleMessage(JSON.parse(evt.data));
      } catch {
        /* ignore */
      }
    };
    sseSource.onerror = () => {
      setConnection('reconnecting', 'sse interrupted…');
      sseSource.close();
      sseSource = null;
      scheduleReconnect();
    };
  } catch {
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectDelay = Math.min(reconnectDelay * 1.6, 6000);
    if (sseSource || (socket && socket.readyState === WebSocket.OPEN)) return;
    connect();
  }, reconnectDelay);
}

async function resync(manual = false) {
  const res = await fetch('/api/state', { cache: 'no-store' });
  const body = await res.json();
  applySnapshot(body.snapshot, null);
  if (manual) toast(`resynced at seq ${state.lastSeq}`, 'ok');
}

function handleMessage(msg) {
  if (msg.type === 'snapshot') {
    applySnapshot(msg.snapshot, msg.config);
    return;
  }
  if (msg.type === 'pong') return;
  if (msg.type === 'event') {
    if (msg.seq <= state.lastSeq) {
      state.staleDropped += 1;
      return;
    }
    state.lastSeq = msg.seq;
    applyEvent(msg.event ?? {});
    return;
  }
}

function applySnapshot(snapshot, config) {
  if (!snapshot) return;
  if (snapshot.seq < state.lastSeq) {
    // never revert to an older authoritative state
    logEvent('CLIENT', `ignored stale snapshot seq ${snapshot.seq} (already at ${state.lastSeq})`);
    return;
  }
  const previous = state.lastSeq;
  state.lastSeq = snapshot.seq;
  state.connected = true;
  state.sim = {
    tick: snapshot.tick,
    paused: snapshot.paused,
    seq: snapshot.seq,
    seed: snapshot.seed,
    tps: snapshot.tps,
    stats: snapshot.stats ?? {},
    robots: snapshot.robots ?? [],
    jobs: snapshot.jobs ?? [],
  };
  state.jobs = new Map(state.sim.jobs.map((j) => [j.id, { ...j }]));
  state.blocked = new Set((snapshot.blocked ?? []).map(([x, y]) => `${x},${y}`));
  if (config) {
    state.config = config;
    populatePickers();
  }
  if (snapshot.tick === 0 && previous > 0) {
    state.selectedRobot = null;
  }
  logEvent('CLIENT', `snapshot applied: seq ${snapshot.seq}, tick ${snapshot.tick}, ${state.sim.robots.length} robots${previous ? ` (discarded ${state.staleDropped} stale events)` : ''}`);
  renderAll();
}

function applyEvent(event) {
  const type = event.type;
  const data = event.data ?? {};
  if (type === 'TICK' || type === 'ROBOT_MOVED' || type === 'PATH_SET' || type === 'ROBOT_WAITING') {
    if (type === 'TICK') {
      state.sim.tick = data.tick ?? event.tick;
      state.sim.paused = data.paused ?? state.sim.paused;
      state.sim.moving = data.moving ?? state.sim.moving;
      state.sim.waiting = data.waiting ?? state.sim.waiting;
      state.sim.stats = { ...state.sim.stats, ...(data.jobs ?? {}) };
      for (const update of data.robots ?? []) {
        const robot = state.sim.robots.find((r) => r.id === update.id);
        if (robot) Object.assign(robot, update);
      }
    } else if (type === 'PATH_SET') {
      const robot = state.sim.robots.find((r) => r.id === data.robotId);
      if (robot) {
        robot.path = data.path ?? [];
        robot.pathStartTick = data.pathStartTick ?? event.tick;
      }
    } else if (type === 'ROBOT_MOVED') {
      const robot = state.sim.robots.find((r) => r.id === data.robotId);
      if (robot) {
        robot.x = data.x;
        robot.y = data.y;
      }
    } else if (type === 'ROBOT_WAITING') {
      const robot = state.sim.robots.find((r) => r.id === data.robotId);
      if (robot) {
        robot.waitingReason = data.reason;
        robot.waitingDetail = data.detail;
      }
    }
  } else if (type === 'JOB_CREATED' || type === 'JOB_ASSIGNED' || type === 'JOB_PICKED' || type === 'JOB_DONE' || type === 'JOB_AGED' || type === 'JOB_QUEUED_SHELF') {
    const job = data.job;
    if (job) state.jobs.set(job.id, { ...job });
    const existing = job ? state.jobs.get(job.id) : state.jobs.get(data.jobId);
    if (existing) {
      if (type === 'JOB_ASSIGNED') {
        existing.status = 'ASSIGNED';
        existing.robotId = data.robotId;
        existing.effectivePriority = data.effectivePriority ?? existing.priority;
      } else if (type === 'JOB_PICKED') existing.status = 'CARRYING';
      else if (type === 'JOB_DONE') {
        existing.status = 'DONE';
        existing.completedTick = data.tick;
      } else if (type === 'JOB_AGED') existing.effectivePriority = data.effectivePriority;
      else if (type === 'JOB_QUEUED_SHELF') existing.status = 'WAITING_SHELF';
      state.jobs.set(existing.id, existing);
    }
  } else if (type === 'CELL_BLOCKED') {
    state.blocked.add(`${data.x},${data.y}`);
  } else if (type === 'CELL_UNBLOCKED') {
    state.blocked.delete(`${data.x},${data.y}`);
  } else if (type === 'SIM_RESET') {
    state.blocked.clear();
    state.jobs.clear();
    resync();
  }
  logEvent(type, event.message, event);
  scheduleRender();
}

// ------------------------------------------------------------------ render ---
const canvas = $('map');
const ctx = canvas.getContext('2d');
let cell = 26;

function resizeCanvas() {
  const cfg = state.config;
  if (!cfg) return;
  const wrap = $('canvas-wrap');
  const dpr = window.devicePixelRatio || 1;
  const availW = Math.max(120, wrap.clientWidth - 16);
  const availH = Math.max(160, Math.min(window.innerHeight * 0.52, 560));
  cell = Math.max(12, Math.floor(Math.min(availW / cfg.width, availH / cfg.height)));
  const w = cfg.width * cell;
  const h = cfg.height * cell;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function draw() {
  const cfg = state.config;
  if (!cfg) return;
  const W = cfg.width;
  const H = cfg.height;
  ctx.clearRect(0, 0, W * cell, H * cell);

  // floor + walls + static structures
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = cfg.grid[y * W + x];
      const px = x * cell;
      const py = y * cell;
      if (v === 1) ctx.fillStyle = '#050a10';
      else ctx.fillStyle = (x + y) % 2 === 0 ? '#0e1620' : '#101a24';
      ctx.fillRect(px, py, cell, cell);
    }
  }

  // single-lane aisles
  if (state.showLanes) {
    ctx.save();
    ctx.fillStyle = 'rgba(78,161,255,.09)';
    for (const lane of cfg.lanes ?? []) {
      for (const [x, y] of lane.cells) {
        ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
      }
    }
    ctx.restore();
  }

  // pickup points
  ctx.fillStyle = 'rgba(255,212,121,.75)';
  for (const shelf of cfg.shelves) {
    const [px, py] = shelf.pickup;
    ctx.beginPath();
    ctx.arc(px * cell + cell / 2, py * cell + cell / 2, Math.max(1.6, cell * 0.11), 0, Math.PI * 2);
    ctx.fill();
  }

  // shelves
  for (const shelf of cfg.shelves) {
    const px = shelf.x * cell;
    const py = shelf.y * cell;
    const w = shelf.w * cell;
    const h = shelf.h * cell;
    const inTransit = isShelfInTransit(shelf.id);
    ctx.fillStyle = inTransit ? '#7a5a1f' : '#2f6fb5';
    ctx.strokeStyle = inTransit ? '#ffd479' : '#5ea0e8';
    ctx.lineWidth = 1;
    roundRect(px + 1.5, py + 1.5, w - 3, h - 3, 3);
    ctx.fill();
    ctx.stroke();
    if (state.showLabels && cell >= 18) {
      ctx.fillStyle = '#dbe9f8';
      ctx.font = `${Math.max(8, cell * 0.34)}px ui-sans-serif, system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(shelf.label, px + w / 2, py + h / 2);
    }
  }

  // workstations
  for (const ws of cfg.workstations) {
    const px = ws.x * cell;
    const py = ws.y * cell;
    ctx.fillStyle = '#1d5f4c';
    ctx.strokeStyle = '#37d0a5';
    roundRect(px + 1.5, py + 1.5, cell - 3, cell - 3, 3);
    ctx.fill();
    ctx.stroke();
    if (state.showLabels && cell >= 16) {
      ctx.fillStyle = '#c9f6e6';
      ctx.font = `${Math.max(8, cell * 0.36)}px ui-sans-serif, system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ws.label, px + cell / 2, py + cell / 2);
    }
  }

  // blocked cells
  for (const key of state.blocked) {
    const [x, y] = key.split(',').map(Number);
    const px = x * cell;
    const py = y * cell;
    ctx.fillStyle = 'rgba(255,95,109,.35)';
    ctx.fillRect(px, py, cell, cell);
    ctx.strokeStyle = '#ff5f6d';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px + 2, py + 2);
    ctx.lineTo(px + cell - 2, py + cell - 2);
    ctx.moveTo(px + cell - 2, py + 2);
    ctx.lineTo(px + 2, py + cell - 2);
    ctx.stroke();
  }

  // planned routes
  if (state.showPaths) {
    for (const robot of state.sim.robots) {
      const index = robotIndex(robot.id);
      const selected = state.selectedRobot === robot.id;
      const path = robot.path ?? [];
      if (path.length < 2) continue;
      const from = Math.max(0, (state.sim.tick ?? 0) - (robot.pathStartTick ?? 0));
      ctx.save();
      ctx.strokeStyle = robotColor(index, selected ? 72 : 58);
      ctx.globalAlpha = selected ? 0.95 : 0.42;
      ctx.lineWidth = selected ? Math.max(2, cell * 0.14) : Math.max(1.4, cell * 0.09);
      ctx.lineJoin = 'round';
      ctx.setLineDash(robot.waitingReason ? [cell * 0.28, cell * 0.2] : []);
      ctx.beginPath();
      let started = false;
      for (let i = from; i < path.length; i++) {
        const [x, y] = path[i];
        const cx = x * cell + cell / 2;
        const cy = y * cell + cell / 2;
        if (!started) {
          ctx.moveTo(cx, cy);
          started = true;
        } else ctx.lineTo(cx, cy);
      }
      ctx.stroke();
      // arrow head at the destination
      const last = path[path.length - 1];
      const prev = path[Math.max(from, path.length - 2)];
      if (last && prev) {
        const angle = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
        const dx = last[0] * cell + cell / 2;
        const dy = last[1] * cell + cell / 2;
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = robotColor(index, 62);
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(dx - Math.cos(angle - 0.4) * cell * 0.45, dy - Math.sin(angle - 0.4) * cell * 0.45);
        ctx.lineTo(dx - Math.cos(angle + 0.4) * cell * 0.45, dy - Math.sin(angle + 0.4) * cell * 0.45);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // hover / selection highlight
  if (state.selectedCell) {
    const [x, y] = state.selectedCell.split(',').map(Number);
    ctx.strokeStyle = '#ffd479';
    ctx.lineWidth = 2;
    ctx.strokeRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
  }
  if (state.hoverCell) {
    const [x, y] = state.hoverCell.split(',').map(Number);
    ctx.strokeStyle = 'rgba(231,238,246,.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x * cell + 0.5, y * cell + 0.5, cell - 1, cell - 1);
  }

  // robots
  for (const robot of state.sim.robots) {
    const index = robotIndex(robot.id);
    const cx = robot.x * cell + cell / 2;
    const cy = robot.y * cell + cell / 2;
    const r = Math.max(4, cell * 0.33);
    const selected = state.selectedRobot === robot.id;
    const waiting = Boolean(robot.waitingReason) && robot.waitingReason !== 'idle';

    ctx.save();
    if (waiting) {
      ctx.strokeStyle = '#ffb347';
      ctx.lineWidth = Math.max(1.5, cell * 0.09);
      ctx.beginPath();
      ctx.arc(cx, cy, r + cell * 0.16, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = robotColor(index, 58);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = selected ? 3 : 1.6;
    ctx.strokeStyle = selected ? '#ffffff' : waiting ? '#ffb347' : '#0a1017';
    ctx.stroke();

    if (robot.status === 'CARRYING') {
      ctx.fillStyle = '#ffd479';
      ctx.fillRect(cx - r * 0.45, cy - r * 0.45, r * 0.9, r * 0.9);
    }
    if (state.showLabels && cell >= 16) {
      ctx.fillStyle = '#04121f';
      ctx.font = `bold ${Math.max(8, cell * 0.4)}px ui-sans-serif, system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(robot.label.replace('R', ''), cx, cy + 0.5);
    }
    if (waiting && cell >= 18) {
      ctx.fillStyle = '#ffb347';
      ctx.font = `bold ${Math.max(9, cell * 0.5)}px ui-sans-serif, system-ui`;
      ctx.fillText('!', cx + r * 1.2, cy - r * 1.1);
    }
    ctx.restore();
  }
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function robotIndex(id) {
  const fromConfig = state.config?.robots?.findIndex((r) => r.id === id) ?? -1;
  if (fromConfig >= 0) return fromConfig;
  const numeric = Number(String(id).replace(/\D+/g, ''));
  return Number.isFinite(numeric) && numeric > 0 ? (numeric - 1) % ROBOT_HUES.length : 0;
}

function isShelfInTransit(shelfId) {
  for (const job of state.jobs.values()) {
    if (job.shelfId === shelfId && job.status !== 'DONE') return true;
  }
  return false;
}

// ------------------------------------------------------------------- tables ---
function populatePickers() {
  const cfg = state.config;
  const shelfSelect = $('job-shelf');
  const wsSelect = $('job-ws');
  if (!shelfSelect.options.length) {
    shelfSelect.innerHTML = cfg.shelves.map((s) => `<option value="${s.id}">${s.label} · ${s.id} @ (${s.x},${s.y})</option>`).join('');
    wsSelect.innerHTML = cfg.workstations.map((w) => `<option value="${w.id}">${w.label} · ${w.id} @ (${w.x},${w.y})</option>`).join('');
    const seedInput = $('seed');
    seedInput.value = String(state.sim.seed ?? 7);
    $('speed').value = String(state.sim.tps ?? 4);
    $('speed-value').textContent = `${state.sim.tps ?? 4}/s`;
  }
}

let renderQueued = false;
function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  const run = () => {
    renderQueued = false;
    renderAll();
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
  else setTimeout(run, 16);
}

function renderTables() {
  // jobs
  const jobs = [...state.jobs.values()].sort((a, b) => (a.createdAtTick ?? 0) - (b.createdAtTick ?? 0) || (a.id < b.id ? -1 : 1));
  $('job-count').textContent = String(jobs.filter((j) => j.status !== 'DONE').length);
  $('job-rows').innerHTML =
    jobs
      .slice(-40)
      .map((job) => {
        const eff = job.effectivePriority ?? job.priority;
        return `<tr>
        <td>${job.id}</td>
        <td>${shortShelf(job.shelfId)} → ${job.workstationId}</td>
        <td><span class="pill urgency-${job.priority}">${job.priority}${eff > job.priority ? ` ↑${eff}` : ''}</span></td>
        <td><span class="pill ${job.status}">${job.status}</span></td>
        <td>${job.robotId ?? '—'}</td>
        <td>${job.completedTick ? job.completedTick - job.createdAtTick : (state.sim.tick ?? 0) - (job.createdAtTick ?? 0)}</td>
      </tr>`;
      })
      .join('') || '<tr><td colspan="6" class="wait-reason">no jobs yet — create one on the right</td></tr>';

  // robots
  const robots = state.sim.robots;
  $('robot-count').textContent = String(robots.length);
  $('robot-rows').innerHTML = robots
    .map((robot) => {
      const waiting = robot.waitingReason && robot.waitingReason !== 'idle' ? `${robot.waitingReason}${robot.waitingDetail ? ` — ${robot.waitingDetail}` : ''}` : '';
      const remaining = Math.max(0, (robot.path?.length ?? 0) - Math.max(0, (state.sim.tick ?? 0) - (robot.pathStartTick ?? 0)));
      return `<tr data-robot="${robot.id}" class="${state.selectedRobot === robot.id ? 'selected' : ''}">
      <td><b style="color:${robotColor(robotIndex(robot.id), 66)}">${robot.label}</b></td>
      <td><span class="pill ${robot.status}">${robot.status}</span>${robot.waitTicks ? ` <span class="wait-reason">+${robot.waitTicks}</span>` : ''}</td>
      <td>${robot.jobId ?? '—'}</td>
      <td>${robot.x},${robot.y} <span class="badge">${remaining} steps</span></td>
      <td class="${waiting ? 'wait-reason' : ''}">${waiting || '—'}</td>
      <td>${robot.moves ?? 0}</td>
    </tr>`;
    })
    .join('');
}

function shortShelf(id) {
  const shelf = state.config?.shelves.find((s) => s.id === id);
  return shelf ? shelf.label : id;
}

function renderChips() {
  const robots = state.sim.robots;
  const moving =
    typeof state.sim.moving === 'number'
      ? state.sim.moving
      : robots.filter((r, i) => {
          const prev = state.previousPositions?.[i];
          return prev ? prev.x !== r.x || prev.y !== r.y : true;
        }).length;
  const waiting = typeof state.sim.waiting === 'number' ? state.sim.waiting : robots.filter((r) => r.waitingReason && r.waitingReason !== 'idle').length;
  $('chip-tick').textContent = String(state.sim.tick ?? 0);
  $('chip-seq').textContent = String(state.lastSeq);
  $('chip-robots').textContent = String(robots.length);
  $('chip-moving').textContent = `${moving}/${robots.length}`;
  $('chip-waiting').textContent = String(waiting);
  const active = [...state.jobs.values()].filter((j) => j.status !== 'DONE').length;
  const done = [...state.jobs.values()].filter((j) => j.status === 'DONE').length;
  $('chip-jobs').textContent = `${active}/${active + done}`;
  $('chip-state').textContent = state.sim.paused ? 'paused' : 'running';
  $('chip-state').className = `chip ${state.sim.paused ? '' : 'running'}`;
  $('btn-pause').textContent = state.sim.paused ? '▶ Resume' : '⏸ Pause';
  $('speed-value').textContent = `${state.sim.tps ?? 4}/s`;
  if ($('speed').value !== String(state.sim.tps)) $('speed').value = String(state.sim.tps ?? 4);
}

function renderSelected() {
  const info = $('selected-info');
  const robot = state.sim.robots.find((r) => r.id === state.selectedRobot);
  const parts = [];
  if (robot) {
    const remaining = Math.max(0, (robot.path?.length ?? 0) - Math.max(0, (state.sim.tick ?? 0) - (robot.pathStartTick ?? 0)));
    parts.push(`<span><b>${robot.label}</b> ${robot.status} @ (${robot.x},${robot.y})</span>`);
    parts.push(`<span>job <b>${robot.jobId ?? '—'}</b>${robot.carrying ? ` · carrying ${shortShelf(robot.carrying)}` : ''}</span>`);
    parts.push(`<span>route <b>${remaining}</b> steps reserved</span>`);
    parts.push(`<span>moves <b>${robot.moves ?? 0}</b> · replans <b>${robot.replanCount ?? 0}</b></span>`);
    if (robot.waitingReason && robot.waitingReason !== 'idle') parts.push(`<span class="wait-reason">waiting: <b>${robot.waitingReason}</b> ${robot.waitingDetail ? `— ${robot.waitingDetail}` : ''}</span>`);
    parts.push(`<button class="btn tiny" id="btn-ahead">⛔ Block cell ahead of ${robot.label}</button>`);
    parts.push(`<button class="btn tiny" id="btn-clear">clear selection</button>`);
  } else if (state.selectedCell) {
    const [x, y] = state.selectedCell.split(',').map(Number);
    const v = state.config?.grid[y * state.config.width + x];
    const occupant = state.sim.robots.find((r) => r.x === x && r.y === y);
    parts.push(`<span>cell <b>(${x},${y})</b> ${[ 'floor', 'wall', 'shelf', 'workstation' ][v] ?? '?'}</span>`);
    if (occupant) parts.push(`<span>occupied by <b>${occupant.label}</b></span>`);
    parts.push(`<span>${state.blocked.has(`${x},${y}`) ? 'BLOCKED' : 'open'}</span>`);
    parts.push(`<button class="btn tiny" id="btn-toggle-cell">${state.blocked.has(`${x},${y}`) ? 'unblock' : 'block'} this cell</button>`);
  } else {
    parts.push('No robot selected — click a robot on the map or a row in the robot table.');
  }
  info.innerHTML = parts.join('');
  const ahead = $('btn-ahead');
  if (ahead) ahead.onclick = () => blockAhead(robot.id);
  const toggle = $('btn-toggle-cell');
  if (toggle) toggle.onclick = () => toggleCell(state.selectedCell);
  const clear = $('btn-clear');
  if (clear) clear.onclick = () => { state.selectedRobot = null; renderAll(); };
}

function renderAll() {
  state.previousPositions = state.lastPositions;
  state.lastPositions = state.sim.robots.map((r) => ({ x: r.x, y: r.y }));
  draw();
  renderTables();
  renderChips();
  renderSelected();
}

// --------------------------------------------------------------- event log ---
function logEvent(type, message, event) {
  state.log.push({ type, message: message ?? '', tick: event?.tick ?? state.sim.tick ?? 0, seq: event?.seq ?? state.lastSeq });
  if (state.log.length > 600) state.log.splice(0, state.log.length - 600);
  renderLog();
}

function wantsLog(entry) {
  if (state.logFilter === 'all') return true;
  if (state.logFilter === 'waits') return WAIT_EVENTS.has(entry.type) || entry.type === 'CLIENT';
  if (state.logFilter === 'moves') return MOVE_EVENTS.has(entry.type) || WAIT_EVENTS.has(entry.type) || entry.type === 'CLIENT';
  return IMPORTANT_EVENTS.has(entry.type) || WAIT_EVENTS.has(entry.type) || entry.type === 'CLIENT';
}

function renderLog() {
  const list = $('log');
  const entries = state.log.filter(wantsLog).slice(-260);
  $('log-count').textContent = String(state.log.length);
  list.innerHTML = entries
    .map(
      (entry) =>
        `<li class="${eventClass(entry.type)}"><span class="t">t${entry.tick}</span><span class="s">#${entry.seq}</span><span class="ty">${entry.type}</span><span class="msg">${escapeHtml(entry.message)}</span></li>`,
    )
    .join('');
  if (state.autoScroll) list.scrollTop = list.scrollHeight;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

let toastTimer = null;
function toast(message, kind = '') {
  const el = $('toast');
  el.textContent = message;
  el.className = `toast ${kind}`;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.hidden = true;
  }, 2600);
}

// ------------------------------------------------------------------ actions ---
async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let payload = {};
  try {
    payload = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) throw new Error(payload.error ?? `request failed (${res.status})`);
  return payload;
}

async function toggleCell(key) {
  const [x, y] = key.split(',').map(Number);
  const blocked = state.blocked.has(key);
  try {
    const res = await post('/api/cells', { x, y, blocked: !blocked });
    if (!blocked) {
      state.blocked.add(key);
      toast(`cell (${x},${y}) blocked · ${res.affected?.length ?? 0} robot(s) replanning`, 'ok');
    } else {
      state.blocked.delete(key);
      toast(`cell (${x},${y}) unblocked`, 'ok');
    }
    draw();
  } catch (err) {
    toast(err.message, 'bad');
  }
}

async function blockAhead(robotId) {
  try {
    const res = await post('/api/robots/block-ahead', { robotId });
    state.blocked.add(`${res.x},${res.y}`);
    toast(`blocked (${res.x},${res.y}) ahead of ${robotId} · replanning`, 'ok');
    draw();
  } catch (err) {
    toast(err.message, 'bad');
  }
}

async function createJob(event) {
  event?.preventDefault();
  const note = $('job-msg');
  try {
    const body = { shelfId: $('job-shelf').value, workstationId: $('job-ws').value, priority: Number($('job-priority').value) };
    const res = await post('/api/jobs', body);
    note.className = 'note ok';
    note.textContent = `created ${res.job.id} (priority ${res.job.priority})`;
    toast(`${res.job.id} queued`, 'ok');
  } catch (err) {
    note.className = 'note';
    note.textContent = err.message;
    toast(err.message, 'bad');
  }
}

// -------------------------------------------------------------------- wiring ---
canvas.addEventListener('click', async (evt) => {
  const cfg = state.config;
  if (!cfg) return;
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((evt.clientX - rect.left) / cell);
  const y = Math.floor((evt.clientY - rect.top) / cell);
  if (x < 0 || y < 0 || x >= cfg.width || y >= cfg.height) return;
  const robot = state.sim.robots.find((r) => r.x === x && r.y === y);
  if (state.blockMode) {
    await toggleCell(`${x},${y}`);
    return;
  }
  if (robot) {
    state.selectedRobot = robot.id;
    state.selectedCell = null;
  } else {
    state.selectedCell = `${x},${y}`;
    state.selectedRobot = null;
  }
  renderAll();
});

canvas.addEventListener('mousemove', (evt) => {
  const cfg = state.config;
  if (!cfg) return;
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((evt.clientX - rect.left) / cell);
  const y = Math.floor((evt.clientY - rect.top) / cell);
  const tip = $('hover-tip');
  if (x < 0 || y < 0 || x >= cfg.width || y >= cfg.height) {
    tip.hidden = true;
    state.hoverCell = null;
    draw();
    return;
  }
  state.hoverCell = `${x},${y}`;
  const robot = state.sim.robots.find((r) => r.x === x && r.y === y);
  const shelf = cfg.shelves.find((s) => s.x === x && (y === s.y || y === s.y + 1));
  const ws = cfg.workstations.find((w) => w.x === x && w.y === y);
  const lane = cfg.lanes.find((l) => l.x === x);
  const lines = [`cell (${x},${y}) · ${['floor', 'wall', 'shelf', 'workstation'][cfg.grid[y * cfg.width + x]] ?? 'floor'}`];
  if (state.blocked.has(`${x},${y}`)) lines.push('BLOCKED — robots replan around it');
  if (shelf) lines.push(`shelf ${shelf.label} (${shelf.id})`);
  if (ws) lines.push(`workstation ${ws.label}`);
  if (lane && cfg.grid[y * cfg.width + x] === 0) lines.push(`single-lane aisle ${lane.name}`);
  if (robot) {
    lines.push(`${robot.label} · ${robot.status}${robot.jobId ? ` · ${robot.jobId}` : ''}`);
    if (robot.waitingReason && robot.waitingReason !== 'idle') lines.push(`waiting: ${robot.waitingReason}`);
  }
  tip.textContent = lines.join('\n');
  tip.hidden = false;
  const wrapRect = $('canvas-wrap').getBoundingClientRect();
  tip.style.left = `${Math.min(evt.clientX - wrapRect.left + 12, wrapRect.width - 220)}px`;
  tip.style.top = `${Math.max(4, evt.clientY - wrapRect.top - 10)}px`;
  draw();
});

canvas.addEventListener('mouseleave', () => {
  $('hover-tip').hidden = true;
  state.hoverCell = null;
  draw();
});

$('job-form').addEventListener('submit', createJob);
$('btn-demo').addEventListener('click', async () => {
  try {
    const res = await post('/api/demo', {});
    toast(`created ${res.created.length} demo jobs`, 'ok');
  } catch (err) {
    toast(err.message, 'bad');
  }
});
$('btn-pause').addEventListener('click', async () => {
  try {
    await post('/api/sim', { action: state.sim.paused ? 'resume' : 'pause' });
  } catch (err) {
    toast(err.message, 'bad');
  }
});
$('btn-step').addEventListener('click', async () => {
  try {
    await post('/api/sim', { action: 'step' });
  } catch (err) {
    toast(err.message, 'bad');
  }
});
$('btn-reset').addEventListener('click', async () => {
  const seed = Number($('seed').value) || 7;
  try {
    await post('/api/sim', { action: 'reset', seed, autostart: true });
    state.jobs.clear();
    state.blocked.clear();
    state.selectedRobot = null;
    toast(`reset with seed ${seed}`, 'ok');
    await resync();
  } catch (err) {
    toast(err.message, 'bad');
  }
});
$('speed').addEventListener('change', async (evt) => {
  try {
    await post('/api/sim', { action: 'speed', tps: Number(evt.target.value) });
  } catch (err) {
    toast(err.message, 'bad');
  }
});
$('btn-resync').addEventListener('click', () => resync(true));
$('tgl-paths').addEventListener('change', (e) => { state.showPaths = e.target.checked; draw(); });
$('tgl-lanes').addEventListener('change', (e) => { state.showLanes = e.target.checked; draw(); });
$('tgl-labels').addEventListener('change', (e) => { state.showLabels = e.target.checked; draw(); });
$('tgl-block').addEventListener('change', (e) => {
  state.blockMode = e.target.checked;
  canvas.classList.toggle('picking', state.blockMode);
});
$('tgl-autoscroll').addEventListener('change', (e) => { state.autoScroll = e.target.checked; });
$('log-filter').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  state.logFilter = btn.dataset.filter;
  for (const b of $('log-filter').querySelectorAll('button')) b.classList.toggle('active', b === btn);
  renderLog();
});
$('robot-rows').addEventListener('click', (e) => {
  const row = e.target.closest('tr[data-robot]');
  if (!row) return;
  state.selectedRobot = row.dataset.robot;
  state.selectedCell = null;
  renderAll();
});
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.key === ' ') {
    e.preventDefault();
    $('btn-pause').click();
  } else if (e.key === 's') $('btn-step').click();
  else if (e.key === 'b') {
    $('tgl-block').checked = !$('tgl-block').checked;
    $('tgl-block').dispatchEvent(new Event('change'));
  }
});
window.addEventListener('resize', () => {
  resizeCanvas();
  draw();
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) resync();
});

// --------------------------------------------------------------------- boot ---
(async function boot() {
  try {
    const cfgRes = await fetch('/api/config', { cache: 'no-store' });
    const cfgBody = await cfgRes.json();
    state.config = cfgBody.config;
    populatePickers();
  } catch (err) {
    console.warn('config fetch failed, waiting for the stream:', err?.message ?? err);
  }
  resizeCanvas();
  try {
    await resync();
  } catch (err) {
    console.warn('initial snapshot failed, waiting for the stream:', err?.message ?? err);
  }
  connect();
  setInterval(() => {
    if (state.sim.paused) renderAll();
  }, 1200);
})();

// Test hook: exposes the pure state-transition helpers so the DOM smoke test can
// drive the exact same code path the socket uses (no behaviour change in the app).
export const __test = { applyEvent, applySnapshot, handleMessage, state, scheduleRender };
