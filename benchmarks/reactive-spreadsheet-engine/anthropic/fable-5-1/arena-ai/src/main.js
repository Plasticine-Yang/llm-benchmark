/* Fleet Control client — renders authoritative server state only. */
const $ = id => document.getElementById(id);
const CELL = 30;

let MAP = null;            // static map from snapshot
let dyn = null;            // latest dynamic state
let lastSeq = 0;
let interpT0 = performance.now();
let mode = 'inspect';
let selectedRobot = null;
let hoverCell = null;
let form = { shelf: '', station: 0 };
let es = null;

/* ---------------- SSE with monotonic sequence gating ---------------- */
function connect() {
  if (es) es.close();
  es = new EventSource('/api/stream');
  es.onopen = () => setConn(true);
  es.onerror = () => setConn(false);
  es.onmessage = ev => {
    let d; try { d = JSON.parse(ev.data); } catch { return; }
    if (d.type === 'snapshot') {
      lastSeq = d.seq; MAP = d.map; dyn = d;
      buildStatic(); populateShelves(); rebuildLog(d.log || []);
      $('inpSeed').value = d.seed;
      applyDyn(); interpT0 = performance.now();
      setConn(true);
      return;
    }
    if (typeof d.seq !== 'number' || d.seq <= lastSeq) return;      // stale → never revert
    if (d.seq > lastSeq + 1) { connect(); return; }                  // gap → full resnapshot
    lastSeq = d.seq;
    if (d.type === 'log') { appendLog(d.entry); $('seqVal').textContent = d.seq; return; }
    dyn = d; applyDyn(); interpT0 = performance.now();
  };
}
function setConn(on) {
  const b = $('connBadge');
  b.className = 'conn-badge ' + (on ? 'conn-on' : 'conn-off');
  b.innerHTML = on
    ? '<i class="fa-solid fa-tower-broadcast"></i><span>LIVE</span>'
    : '<i class="fa-solid fa-plug-circle-xmark"></i><span>reconnecting…</span>';
}

/* ---------------- API helpers ---------------- */
async function post(url, body) {
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) { toast(j.error || 'Request failed', false); return null; }
    return j;
  } catch { toast('Server unreachable', false); return null; }
}
let toastTimer;
function toast(msg, ok = true) {
  const t = $('toast');
  t.textContent = msg; t.className = 'toast' + (ok ? ' ok' : '');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add('hidden'), 2600);
}

/* ---------------- canvas setup ---------------- */
const canvas = $('mapCanvas');
const ctx = canvas.getContext('2d');
const staticCv = document.createElement('canvas');
const sctx = staticCv.getContext('2d');
const DPR = Math.min(devicePixelRatio || 1, 2);

function sizeCanvas() {
  if (!MAP) return;
  canvas.width = MAP.w * CELL * DPR; canvas.height = MAP.h * CELL * DPR;
  staticCv.width = canvas.width; staticCv.height = canvas.height;
  canvas.style.aspectRatio = `${MAP.w} / ${MAP.h}`;
  buildStatic();
}

function buildStatic() {
  if (!MAP) return;
  if (canvas.width !== MAP.w * CELL * DPR) { sizeCanvas(); return; }
  const g = sctx;
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.clearRect(0, 0, MAP.w * CELL, MAP.h * CELL);
  const blocked = new Set(dyn ? dyn.blocked : []);
  for (let y = 0; y < MAP.h; y++) for (let x = 0; x < MAP.w; x++) {
    const c = MAP.cells[y * MAP.w + x], px = x * CELL, py = y * CELL;
    if (c === 1) {
      g.fillStyle = '#2a3650'; g.fillRect(px, py, CELL, CELL);
      g.fillStyle = '#33415f'; g.fillRect(px + 1, py + 1, CELL - 2, 4);
    } else if (c === 2) {
      g.fillStyle = '#8a5f1d'; g.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
      g.fillStyle = '#a8762a'; g.fillRect(px + 3, py + 3, CELL - 6, CELL - 6);
      g.strokeStyle = 'rgba(60,40,10,.55)'; g.lineWidth = 1;
      g.strokeRect(px + 3.5, py + 3.5, CELL - 7, CELL - 7);
    } else if (c === 3) {
      g.fillStyle = '#0e3d44'; g.fillRect(px, py, CELL, CELL);
      g.fillStyle = '#14b8a6'; g.fillRect(px + 3, py + 3, CELL - 6, CELL - 6);
    } else {
      g.fillStyle = (x + y) % 2 ? '#111b30' : '#0f182b';
      g.fillRect(px, py, CELL, CELL);
    }
  }
  // shelf ids
  g.font = '600 8px "IBM Plex Mono"'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(35,22,4,.9)';
  for (const s of MAP.shelves) g.fillText(s.id, s.x * CELL + CELL / 2, s.y * CELL + CELL / 2);
  // station labels + approach marker
  g.font = '700 11px Rajdhani'; g.fillStyle = '#04282c';
  for (const st of MAP.stations) {
    g.fillText(st.name, st.x * CELL + CELL / 2, st.y * CELL + CELL / 2);
    g.strokeStyle = 'rgba(20,184,166,.4)'; g.setLineDash([3, 3]); g.lineWidth = 1.5;
    g.strokeRect(st.ax * CELL + 5, st.ay * CELL + 5, CELL - 10, CELL - 10); g.setLineDash([]);
  }
  // docks
  for (const d of MAP.docks) {
    g.strokeStyle = 'rgba(52,211,153,.45)'; g.lineWidth = 1.5;
    g.beginPath(); g.arc(d.x * CELL + CELL / 2, d.y * CELL + CELL / 2, CELL * 0.3, 0, 7); g.stroke();
  }
  // blocked cells
  for (const i of blocked) {
    const x = i % MAP.w, y = (i / MAP.w) | 0, px = x * CELL, py = y * CELL;
    g.fillStyle = 'rgba(190,40,70,.32)'; g.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
    g.strokeStyle = '#fb7185'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(px + 7, py + 7); g.lineTo(px + CELL - 7, py + CELL - 7);
    g.moveTo(px + CELL - 7, py + 7); g.lineTo(px + 7, py + CELL - 7); g.stroke();
  }
  // subtle grid
  g.strokeStyle = 'rgba(148,163,184,.06)'; g.lineWidth = 1;
  for (let x = 0; x <= MAP.w; x++) { g.beginPath(); g.moveTo(x * CELL, 0); g.lineTo(x * CELL, MAP.h * CELL); g.stroke(); }
  for (let y = 0; y <= MAP.h; y++) { g.beginPath(); g.moveTo(0, y * CELL); g.lineTo(MAP.w * CELL, y * CELL); g.stroke(); }
}

/* ---------------- render loop (visual interpolation only) ---------------- */
function render(now) {
  requestAnimationFrame(render);
  if (!MAP || !dyn) return;
  const g = ctx;
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.clearRect(0, 0, MAP.w * CELL, MAP.h * CELL);
  g.drawImage(staticCv, 0, 0, MAP.w * CELL, MAP.h * CELL);

  const k = Math.min(1, (now - interpT0) / (dyn.speedMs * 0.85));
  const ease = k * k * (3 - 2 * k);
  const cx = c => c * CELL + CELL / 2;

  // selected shelf highlight
  if (form.shelf) {
    const s = MAP.shelves.find(s => s.id === form.shelf);
    if (s) {
      g.strokeStyle = '#fcd34d'; g.lineWidth = 2.5;
      g.strokeRect(s.x * CELL + 1.5, s.y * CELL + 1.5, CELL - 3, CELL - 3);
    }
  }
  // hover cell
  if (hoverCell) {
    g.strokeStyle = mode === 'block' ? 'rgba(251,113,133,.8)' : 'rgba(45,212,191,.7)';
    g.lineWidth = 2;
    g.strokeRect(hoverCell.x * CELL + 1, hoverCell.y * CELL + 1, CELL - 2, CELL - 2);
  }

  // paths
  for (const r of dyn.robots) {
    if (!r.path || r.path.length < 2) continue;
    const sel = selectedRobot === r.id;
    if (selectedRobot !== null && !sel) g.globalAlpha = 0.16;
    g.strokeStyle = r.color; g.lineWidth = sel ? 3.5 : 2.25; g.lineJoin = 'round'; g.lineCap = 'round';
    g.setLineDash([6, 5]); g.lineDashOffset = -(now / 60) % 11;
    g.beginPath();
    g.moveTo(cx(r.x), cx(r.y));
    for (let i = 1; i < r.path.length; i++) g.lineTo(cx(r.path[i].x), cx(r.path[i].y));
    g.stroke(); g.setLineDash([]);
    const gl = r.path[r.path.length - 1];
    g.strokeStyle = r.color; g.lineWidth = 2;
    g.strokeRect(gl.x * CELL + 7, gl.y * CELL + 7, CELL - 14, CELL - 14);
    g.globalAlpha = 1;
  }

  // robots
  for (const r of dyn.robots) {
    const rx = cx(r.px + (r.x - r.px) * ease), ry = cx(r.py + (r.y - r.py) * ease);
    const waiting = r.waitTicks > 0 && ['toPickup', 'toDropoff', 'returning'].includes(r.phase);
    const sel = selectedRobot === r.id;
    if (sel) { g.fillStyle = r.color + '33'; g.beginPath(); g.arc(rx, ry, CELL * 0.62, 0, 7); g.fill(); }
    if (waiting) {
      const p = 0.5 + Math.sin(now / 220) * 0.5;
      g.strokeStyle = `rgba(252,211,77,${0.35 + p * 0.5})`; g.lineWidth = 2.5;
      g.beginPath(); g.arc(rx, ry, CELL * (0.44 + p * 0.08), 0, 7); g.stroke();
    }
    g.fillStyle = r.color;
    g.beginPath(); g.arc(rx, ry, CELL * 0.34, 0, 7); g.fill();
    g.strokeStyle = '#0b1220'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#0b1220'; g.font = '700 10px Rajdhani'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(r.name, rx, ry + 0.5);
    if (waiting) {
      g.fillStyle = '#fcd34d'; g.font = '800 11px "IBM Plex Sans"';
      g.fillText('!', rx + CELL * 0.36, ry - CELL * 0.36);
    }
    if (r.phase === 'picking' || r.phase === 'dropping') {
      const p = (now / 500) % 1;
      g.strokeStyle = r.color; g.lineWidth = 2.5;
      g.beginPath(); g.arc(rx, ry, CELL * 0.46, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); g.stroke();
    }
  }
}
requestAnimationFrame(render);

/* ---------------- pointer interaction ---------------- */
function cellFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / rect.width * MAP.w);
  const y = Math.floor((e.clientY - rect.top) / rect.height * MAP.h);
  return (x >= 0 && y >= 0 && x < MAP.w && y < MAP.h) ? { x, y } : null;
}
canvas.addEventListener('mousemove', e => {
  if (!MAP || !dyn) return;
  hoverCell = cellFromEvent(e);
  const tip = $('tooltip');
  if (!hoverCell) { tip.classList.add('hidden'); return; }
  const { x, y } = hoverCell;
  const robot = dyn.robots.find(r => r.x === x && r.y === y);
  const shelf = MAP.shelves.find(s => s.x === x && s.y === y);
  const st = MAP.stations.find(s => s.x === x && s.y === y);
  let html = '';
  if (robot) {
    const job = robot.jobId != null ? dyn.jobs.find(j => j.id === robot.jobId) : null;
    html = `<b style="color:${robot.color}">${robot.name}</b> · ${robot.phase}<br>` +
      (job ? `Job <b>#${job.id}</b> ${job.shelf} → W${job.station} <i>(${job.priority})</i><br>` : '') +
      `<span class="text-amber-300">${robot.reason}</span>` +
      (robot.waitTicks ? `<br>waiting ${robot.waitTicks} ticks` : '');
  } else if (shelf) html = `<b class="text-amber-300">${shelf.id}</b> — shelf<br><span class="text-slate-400">click to target a job</span>`;
  else if (st) html = `<b class="text-teal-300">${st.name}</b> — workstation`;
  else if (dyn.blocked.includes(y * MAP.w + x)) html = `<b class="text-rose-400">Blocked</b> (${x},${y})<br><span class="text-slate-400">${mode === 'block' ? 'click to reopen' : 'switch to Block mode to reopen'}</span>`;
  else if (MAP.cells[y * MAP.w + x] === 0) html = `Floor (${x},${y})` + (mode === 'block' ? `<br><span class="text-slate-400">click to block</span>` : '');
  if (!html) { tip.classList.add('hidden'); return; }
  tip.innerHTML = html; tip.classList.remove('hidden');
  const wrap = canvas.parentElement.getBoundingClientRect();
  let tx = e.clientX - wrap.left + 14, ty = e.clientY - wrap.top + 12;
  if (tx + 240 > wrap.width) tx -= 260;
  tip.style.left = tx + 'px'; tip.style.top = ty + 'px';
});
canvas.addEventListener('mouseleave', () => { hoverCell = null; $('tooltip').classList.add('hidden'); });

canvas.addEventListener('click', async e => {
  if (!MAP || !dyn) return;
  const c = cellFromEvent(e); if (!c) return;
  const robot = dyn.robots.find(r => r.x === c.x && r.y === c.y);
  if (mode === 'block') {
    if (robot) { toast('Cell occupied by ' + robot.name, false); return; }
    if (MAP.cells[c.y * MAP.w + c.x] !== 0) { toast('Only open floor cells can be blocked', false); return; }
    const isBlocked = dyn.blocked.includes(c.y * MAP.w + c.x);
    await post('/api/block', { x: c.x, y: c.y, blocked: !isBlocked });
    return;
  }
  if (robot) { selectRobot(selectedRobot === robot.id ? null : robot.id); return; }
  const shelf = MAP.shelves.find(s => s.x === c.x && s.y === c.y);
  if (shelf) {
    form.shelf = shelf.id; $('shelfSelect').value = shelf.id;
    updateForm(); buildStatic();
    toast(`Shelf ${shelf.id} selected`, true);
  }
});

function selectRobot(id) {
  selectedRobot = id;
  renderRobots();
  const info = $('selInfo');
  if (id === null) info.innerHTML = '<i class="fa-solid fa-circle-info text-cyan-300"></i> Click a <b class="text-amber-300">shelf</b> to fill the job form · click a <b class="text-cyan-300">robot</b> to highlight its planned route.';
  else {
    const r = dyn.robots[id];
    info.innerHTML = `<i class="fa-solid fa-route" style="color:${r.color}"></i> Tracing <b style="color:${r.color}">${r.name}</b> — ${r.reason}. <button class="underline text-slate-300" onclick="window.__clearSel()">clear</button>`;
  }
}
window.__clearSel = () => selectRobot(null);

/* ---------------- panels ---------------- */
const PRIO_ICON = { low: '▽', normal: '◆', high: '▲', urgent: '⚠' };
function applyDyn() {
  $('tickVal').textContent = dyn.tick;
  $('seqVal').textContent = dyn.seq;
  $('blockedCount').innerHTML = `<i class="fa-solid fa-road-barrier text-rose-400"></i> <b>${dyn.blocked.length}</b> blocked`;
  const run = $('btnRun');
  run.innerHTML = dyn.running ? '<i class="fa-solid fa-pause"></i><span>Pause</span>' : '<i class="fa-solid fa-play"></i><span>Resume</span>';
  if (document.activeElement !== $('selSpeed')) $('selSpeed').value = String(dyn.speedMs);
  buildStatic();
  renderJobs(); renderRobots();
}
function renderJobs() {
  const el = $('jobList');
  const jobs = [...dyn.jobs].sort((a, b) => {
    const rank = j => j.state === 'done' ? 1 : 0;
    return rank(a) - rank(b) || b.id - a.id;
  }).slice(0, 40);
  const active = dyn.jobs.filter(j => j.state !== 'done').length;
  const done = dyn.jobs.filter(j => j.state === 'done').length;
  $('jobCounts').textContent = `${active} active · ${done} done`;
  if (!jobs.length) { el.innerHTML = '<p class="empty-note">No jobs yet — dispatch one above.</p>'; return; }
  el.innerHTML = jobs.map(j => {
    const r = j.robotId != null ? dyn.robots[j.robotId] : null;
    return `<div class="job-row">
      <span class="prio-badge prio-${j.priority}" title="priority: ${j.priority}">${PRIO_ICON[j.priority]} ${j.priority}</span>
      <span class="font-mono text-slate-300">#${String(j.id).padStart(3, '0')}</span>
      <span class="text-amber-200/90 font-semibold">${j.shelf}</span>
      <i class="fa-solid fa-arrow-right-long text-slate-500 text-[10px]"></i>
      <span class="text-teal-300 font-semibold">W${j.station}</span>
      <span class="ml-auto flex items-center gap-2">
        ${r ? `<span style="color:${r.color}" class="font-bold text-[11px]">${r.name}</span>` : ''}
        <span class="state-badge st-${j.state}">${j.state}</span>
      </span>
    </div>`;
  }).join('');
}
function renderRobots() {
  const el = $('robotList');
  el.innerHTML = dyn.robots.map(r => {
    const job = r.jobId != null ? dyn.jobs.find(j => j.id === r.jobId) : null;
    const waiting = r.waitTicks > 0;
    return `<tr data-rid="${r.id}" class="${selectedRobot === r.id ? 'selected' : ''}">
      <td><span class="inline-flex items-center gap-2 font-bold" style="color:${r.color}">
        <span class="w-2.5 h-2.5 rounded-full inline-block" style="background:${r.color}"></span>${r.name}</span></td>
      <td><span class="phase-badge ph-${r.phase}">${r.phase}</span></td>
      <td class="font-mono text-slate-400">${job ? '#' + String(job.id).padStart(3, '0') + ' ' + job.shelf + '→W' + job.station : '—'}</td>
      <td class="${waiting ? 'text-amber-300' : 'text-slate-400'}">
        ${waiting ? '<i class="fa-solid fa-triangle-exclamation mr-1"></i>' : ''}${r.reason}${waiting ? ` <span class="text-slate-500">(${r.waitTicks}t)</span>` : ''}</td>
      <td class="text-right font-mono text-slate-400">${r.jobsDone}</td>
    </tr>`;
  }).join('');
  el.querySelectorAll('tr').forEach(tr => tr.addEventListener('click', () => {
    const id = Number(tr.dataset.rid);
    selectRobot(selectedRobot === id ? null : id);
  }));
}

/* ---------------- event log ---------------- */
const LOG_ICON = { assign: 'fa-user-check', done: 'fa-circle-check', pick: 'fa-box-open', job: 'fa-plus', block: 'fa-road-barrier', ctl: 'fa-sliders' };
function logLine(e) {
  return `<div class="log-line log-${e.kind}"><span class="log-tick">t${String(e.tick).padStart(5, '0')}</span><i class="fa-solid ${LOG_ICON[e.kind] || 'fa-angle-right'} mt-0.5 text-[9px] opacity-70"></i><span>${e.msg}</span></div>`;
}
function rebuildLog(entries) {
  $('eventLog').innerHTML = entries.map(logLine).join('');
  $('logCount').textContent = entries.length + ' entries';
  $('eventLog').scrollTop = $('eventLog').scrollHeight;
}
function appendLog(e) {
  const el = $('eventLog');
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  el.insertAdjacentHTML('beforeend', logLine(e));
  while (el.children.length > 220) el.removeChild(el.firstChild);
  $('logCount').textContent = el.children.length + ' entries';
  if (nearBottom) el.scrollTop = el.scrollHeight;
}

/* ---------------- form & controls ---------------- */
function populateShelves() {
  const sel = $('shelfSelect');
  sel.innerHTML = '<option value="">— choose shelf —</option>' +
    MAP.shelves.map(s => `<option value="${s.id}">${s.id} · (${s.x},${s.y})</option>`).join('');
  sel.value = form.shelf || '';
}
function updateForm() {
  $('btnCreate').disabled = !(form.shelf && form.station);
  $('jobFormHint').textContent = !form.shelf ? 'Select a shelf (dropdown or map click).'
    : !form.station ? 'Choose a destination workstation.'
    : `Ready: ${form.shelf} → W${form.station}. The scheduler auto-assigns the nearest idle robot.`;
  document.querySelectorAll('.station-btn').forEach(b => b.classList.toggle('active', Number(b.dataset.st) === form.station));
}
$('shelfSelect').addEventListener('change', e => { form.shelf = e.target.value; updateForm(); buildStatic(); });
$('stationBtns').addEventListener('click', e => {
  const b = e.target.closest('.station-btn'); if (!b) return;
  form.station = Number(b.dataset.st); updateForm();
});
$('btnCreate').addEventListener('click', async () => {
  const prio = $('prioSelect').value;
  const r = await post('/api/jobs', { shelf: form.shelf, station: form.station, priority: prio });
  if (r) toast(`Job #${r.job.id} dispatched (${prio})`, true);
});
$('btnRun').addEventListener('click', () => post('/api/control', { action: dyn && dyn.running ? 'pause' : 'resume' }));
$('btnStep').addEventListener('click', () => post('/api/control', { action: 'step' }));
$('selSpeed').addEventListener('change', e => post('/api/control', { action: 'speed', ms: Number(e.target.value) }));
$('btnReset').addEventListener('click', async () => {
  const seed = Number($('inpSeed').value) || 1337;
  await post('/api/control', { action: 'reset', seed });
  selectedRobot = null; form = { shelf: '', station: 0 };
  lastSeq = 0; connect();          // fresh snapshot for the new run
  toast(`Reset with seed ${seed}`, true);
});
$('modeInspect').addEventListener('click', () => setMode('inspect'));
$('modeBlock').addEventListener('click', () => setMode('block'));
function setMode(m) {
  mode = m;
  $('modeInspect').classList.toggle('active', m === 'inspect');
  $('modeBlock').classList.toggle('active', m === 'block');
  canvas.style.cursor = m === 'block' ? 'not-allowed' : 'crosshair';
}

/* ---------------- boot ---------------- */
(async function boot() {
  try {
    const s = await (await fetch('/api/state')).json();
    lastSeq = s.seq; MAP = s.map; dyn = s;
    sizeCanvas(); populateShelves(); rebuildLog(s.log || []);
    $('inpSeed').value = s.seed;
    applyDyn();
  } catch { /* stream snapshot will populate */ }
  connect();
  updateForm();
})();
window.addEventListener('resize', () => { /* canvas scales via CSS; internal res fixed */ });