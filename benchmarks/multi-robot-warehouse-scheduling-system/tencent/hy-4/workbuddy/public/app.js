/* global EventSource */
'use strict';

(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let state = null;
  let seq = -1;
  let es = null;
  let manualDisconnect = false;
  let cellSize = 22;
  const streamLines = [];
  const canvas = $('#map');
  const ctx = canvas.getContext('2d');
  const tip = $('#map-tip');

  // ---------------------------------------------------------------- helpers
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2600);
  }
  function setConn(text, cls) {
    const el = $('#conn');
    el.textContent = text;
    el.className = cls;
  }
  function stream(msg) {
    streamLines.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
    if (streamLines.length > 60) streamLines.shift();
    $('#stream-log').innerHTML = streamLines.slice().reverse().map((l) =>
      `<div class="ev ev-stream"><div class="ev-msg">${esc(l)}</div></div>`).join('');
  }
  async function post(url, body) {
    const r = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok || d.ok === false) throw new Error(d.error || `HTTP ${r.status}`);
    return d;
  }

  // ----------------------------------------------------------- SSE lifecycle
  function apply(msg) {
    seq = msg.seq;
    state = msg.state;
    if (msg.speedMs) {
      $$('.speed').forEach((b) => b.classList.toggle('active', Number(b.dataset.ms) === Number(msg.speedMs)));
    }
    render();
  }

  function connect() {
    if (es) { es.close(); es = null; }
    const lastSeq = seq >= 0 ? seq : 0;
    setConn('connecting', 'dot-wait');
    stream(`opening SSE from lastSeq=${lastSeq}`);
    es = new EventSource(`/api/stream?lastSeq=${lastSeq}`);

    es.addEventListener('snapshot', (e) => {
      const m = JSON.parse(e.data);
      const regression = seq >= 0 && m.seq < seq;
      // A complete snapshot is authoritative even if the server restarted.
      apply(m);
      setConn('connected', 'dot-ok');
      stream(`SNAPSHOT seq=${m.seq} tick=${m.state.tick} resumedFrom=${m.resumedFrom} missed=${m.missed}` +
        (regression ? ' (server seq regression adopted)' : ''));
      $('#watermark').textContent = `watermark seq=${seq}`;
    });

    es.addEventListener('state', (e) => {
      const m = JSON.parse(e.data);
      if (m.seq > seq) {
        apply(m);
        $('#watermark').textContent = `watermark seq=${seq}`;
      } else {
        stream(`IGNORED stale event seq=${m.seq} <= ${seq} (no state revert)`);
      }
    });

    es.onopen = () => { if (!manualDisconnect) setConn('connected', 'dot-ok'); };
    es.onerror = () => {
      if (manualDisconnect) return;
      setConn('reconnecting…', 'dot-wait');
    };
  }

  // Fallback: if SSE never delivers, at least show the persisted state.
  setTimeout(async () => {
    if (state) return;
    try {
      const d = await (await fetch('/api/state')).json();
      apply({ seq: d.seq, state: d.state });
      stream('fallback REST snapshot applied');
    } catch (_) { /* SSE will retry */ }
  }, 3000);

  // ------------------------------------------------------------------ render
  function corridorSet() {
    const s = new Set();
    for (const seg of state.map.segments) for (const c of seg.cells) s.add(`${c.x},${c.y}`);
    return s;
  }

  function drawMap() {
    const W = state.map.W, H = state.map.H;
    const wrap = $('#map-wrap');
    const avail = Math.max(280, wrap.clientWidth - 2);
    cellSize = Math.max(9, Math.min(26, Math.floor(avail / W)));
    const dpr = window.devicePixelRatio || 1;
    const cw = W * cellSize, ch = H * cellSize;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    const S = cellSize;
    const blocked = new Set(state.blocked);
    const aisles = corridorSet();

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = state.map.cells[y * W + x];
        const k = `${x},${y}`;
        let fill = '#f8fafc';
        if (t === 0) fill = '#334155';
        else if (t === 2) fill = '#f0b429';
        else if (t === 3) fill = '#2563eb';
        else if (t === 4) fill = '#bbf7d0';
        if (aisles.has(k) && t !== 0 && t !== 2) fill = '#ffedd5';
        ctx.fillStyle = fill;
        ctx.fillRect(x * S, y * S, S, S);
        if (t === 2) {
          ctx.strokeStyle = 'rgba(146,64,14,.35)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x * S + 1.5, y * S + 1.5, S - 3, S - 3);
        }
      }
    }

    // grid lines
    ctx.strokeStyle = 'rgba(148,163,184,.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= W; x++) { ctx.moveTo(x * S + .5, 0); ctx.lineTo(x * S + .5, ch); }
    for (let y = 0; y <= H; y++) { ctx.moveTo(0, y * S + .5); ctx.lineTo(cw, y * S + .5); }
    ctx.stroke();

    // blocked cells
    for (const k of blocked) {
      const [x, y] = k.split(',').map(Number);
      ctx.fillStyle = 'rgba(239,68,68,.75)';
      ctx.fillRect(x * S, y * S, S, S);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.5, S * .1);
      ctx.beginPath();
      ctx.moveTo(x * S + S * .25, y * S + S * .25);
      ctx.lineTo(x * S + S * .75, y * S + S * .75);
      ctx.moveTo(x * S + S * .75, y * S + S * .25);
      ctx.lineTo(x * S + S * .25, y * S + S * .75);
      ctx.stroke();
    }

    // labels
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.max(7, S * .34)}px ui-monospace, monospace`;
    for (const sh of state.map.shelves) {
      ctx.fillStyle = '#78350f';
      ctx.fillText(sh.id, sh.ox * S + 2, sh.oy * S + S * .55);
    }
    ctx.fillStyle = '#ffffff';
    for (const st of state.map.stations) {
      ctx.fillText(st.id, st.x * S + S * .12, st.y * S + S * .55);
    }

    // planned routes (backend-computed reservations)
    for (const r of state.robots) {
      const p = r.plan || [];
      if (p.length < 2) continue;
      ctx.save();
      ctx.globalAlpha = .55;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = Math.max(1.6, S * .13);
      ctx.setLineDash([Math.max(3, S * .3), Math.max(2, S * .22)]);
      ctx.beginPath();
      ctx.moveTo(p[0].x * S + S / 2, p[0].y * S + S / 2);
      for (let i = 1; i < p.length; i++) ctx.lineTo(p[i].x * S + S / 2, p[i].y * S + S / 2);
      ctx.stroke();
      ctx.restore();
      // destination markers
      if (r.jobId) {
        const j = state.jobs.find((z) => z.id === r.jobId);
        const sh = j && state.map.shelves.find((z) => z.id === j.shelfId);
        const st = j && state.map.stations.find((z) => z.id === j.stationId);
        for (const m of [r.phase === 'to_pickup' ? sh && sh.access : null, st]) {
          if (!m) continue;
          ctx.strokeStyle = r.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(m.x * S + S / 2, m.y * S + S / 2, S * .33, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // robots on top
    for (const r of state.robots) {
      const cx = r.x * S + S / 2, cy = r.y * S + S / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, S * .37, 0, Math.PI * 2);
      ctx.fillStyle = r.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = `800 ${Math.max(7, S * .36)}px ui-monospace, monospace`;
      ctx.fillText(r.id.replace('R', ''), cx, cy + .5);
      ctx.textAlign = 'left';
    }
  }

  function render() {
    if (!state) return;
    $('#tick').textContent = state.tick;
    $('#seq').textContent = seq;
    $('#seed').textContent = state.seed;
    $('#done').textContent = `${state.stats.delivered}/${state.jobs.length}`;
    $('#btn-pause').textContent = state.paused ? 'Resume' : 'Pause';
    $('#btn-pause').classList.toggle('accent', state.paused);
    $('#watermark').textContent = `watermark seq=${seq}`;

    // form options (once)
    if ($('#job-shelf').options.length === 0) {
      $('#job-shelf').innerHTML = state.map.shelves.map((s) =>
        `<option value="${s.id}">${s.id} — ${s.side === 'L' ? 'west' : 'east'} block (${s.ox},${s.oy})</option>`).join('');
      $('#job-station').innerHTML = state.map.stations.map((s) =>
        `<option value="${s.id}">${s.id} — ${esc(s.label)}</option>`).join('');
      $('#block-robot').innerHTML = state.robots.map((r) =>
        `<option value="${r.id}">${r.id}</option>`).join('');
    }

    // job queue
    const jobs = state.jobs.slice().reverse();
    $('#job-count').textContent = `${state.stats.pending} pending · ${state.stats.assigned} active · ${state.stats.delivered} done`;
    $('#jobs-body').innerHTML = jobs.length ? jobs.map((j) => {
      const status = j.status === 'done' ? 'done' : j.status === 'assigned' ? 'assigned' : 'pending';
      const age = (j.completedTick != null ? j.completedTick : state.tick) - j.createdTick;
      return `<tr>
        <td class="mono"><b>${esc(j.id)}</b></td>
        <td class="mono">${esc(j.shelfId)} &rarr; ${esc(j.stationId)}</td>
        <td><span class="tag tag-p${j.priority}">P${j.priority}</span></td>
        <td><span class="tag tag-${status}">${status}</span></td>
        <td class="mono">${j.robotId ? esc(j.robotId) : '—'}</td>
        <td class="mono">${age}t</td>
      </tr>`;
    }).join('') : '<tr><td colspan="6" class="empty">No jobs yet — create one or use “+ 3 demo jobs”.</td></tr>';

    // robot states
    $('#robots-body').innerHTML = state.robots.map((r) => {
      const next = r.plan && r.plan[1];
      const idle = !r.jobId && r.phase === 'idle';
      const detail = idle
        ? `<span class="tag tag-p2">IDLE</span> <span class="muted">available for dispatch</span>`
        : r.waitTicks > 0
          ? `<span class="tag tag-wait">WAIT</span> <span class="reason">${esc(r.waitReason || 'yielding')}</span>`
          : `<span class="tag tag-move">MOVE</span> <span class="mono">&rarr; (${next ? next.x : r.x},${next ? next.y : r.y})</span>`;
      const replan = r.replanReason ? ` <span class="tag tag-replan" style="background:#ffedd5;color:#c2410c">replanned: ${esc(r.replanReason)}</span>` : '';
      return `<tr>
        <td><span class="dot" style="background:${r.color}"></span><b>${esc(r.id)}</b></td>
        <td class="mono">(${r.x},${r.y})</td>
        <td>${esc(r.phase)}</td>
        <td class="mono">${r.jobId ? esc(r.jobId) : '—'}</td>
        <td>${detail}${replan}</td>
        <td class="mono">${r.planOk ? '' : '!'}${Math.max(0, r.plan.length - 1)} steps</td>
        <td class="mono">${idle ? '—' : r.waitTicks + 't'}</td>
      </tr>`;
    }).join('');

    // event log
    const evs = (state.events || []).slice().reverse();
    $('#event-count').textContent = `${state.events.length} recent · ${state.stats.replans} replans · ${state.stats.waitsAvoided} conflict waits`;
    $('#events').innerHTML = evs.length ? evs.map((e) => `<div class="ev">
      <span class="ev-seq">#${e.seq}</span>
      <span class="ev-tick">t${e.tick}</span>
      <span class="ev-type ev-type-${esc(e.type)}">${esc(e.type)}</span>
      <span class="ev-msg">${esc(e.message)}</span>
    </div>`).join('') : '<div class="empty">Waiting for events…</div>';

    drawMap();
  }

  // ------------------------------------------------------------------ actions
  $('#job-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const d = await post('/api/jobs', {
        shelfId: $('#job-shelf').value,
        stationId: $('#job-station').value,
        priority: Number($('#job-priority').value),
      });
      toast(`Job ${d.job.id} created — scheduler assigned a robot`);
    } catch (err) { toast(`Job failed: ${err.message}`); }
  });

  $('#btn-demo').addEventListener('click', async () => {
    const demo = [
      { shelfId: 'S03', stationId: 'W4', priority: 5 },
      { shelfId: 'S07', stationId: 'W3', priority: 3 },
      { shelfId: 'S16', stationId: 'W2', priority: 1 },
    ];
    try {
      for (const j of demo) await post('/api/jobs', j);
      toast('3 simultaneous jobs created (P5 / P3 / P1) — watch the narrow tunnels');
    } catch (err) { toast(`Demo failed: ${err.message}`); }
  });

  $('#btn-block-ahead').addEventListener('click', async () => {
    try {
      const d = await post('/api/block-ahead', { robotId: $('#block-robot').value });
      toast(d.changed
        ? `Blocked the next cell — ${d.affected.join(', ') || 'no robot'} replanning now`
        : 'That cell was already blocked');
    } catch (err) { toast(`Block failed: ${err.message}`); }
  });

  $('#btn-pause').addEventListener('click', async () => {
    if (!state) return;
    try { await post('/api/control', { action: state.paused ? 'resume' : 'pause' }); }
    catch (err) { toast(err.message); }
  });
  $('#btn-step').addEventListener('click', async () => {
    try { await post('/api/control', { action: 'step' }); }
    catch (err) { toast(err.message); }
  });
  $('#btn-reset').addEventListener('click', async () => {
    try {
      await post('/api/control', { action: 'reset', seed: state ? state.seed : undefined });
      toast('Reset with the same deterministic seed');
    } catch (err) { toast(err.message); }
  });
  $$('.speed').forEach((b) => b.addEventListener('click', async () => {
    try { await post('/api/control', { action: 'speed', ms: Number(b.dataset.ms) }); }
    catch (err) { toast(err.message); }
  }));

  $('#btn-disconnect').addEventListener('click', () => {
    manualDisconnect = true;
    if (es) { es.close(); es = null; }
    setConn('disconnected', 'dot-bad');
    stream(`DISCONNECT — client frozen at seq=${seq}, tick=${state ? state.tick : '?'}`);
    toast('Stream closed. Server keeps ticking. Click Reconnect to get a full snapshot.');
  });
  $('#btn-reconnect').addEventListener('click', () => {
    manualDisconnect = false;
    connect();
  });

  // ------------------------------------------------------------ map interaction
  function cellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.floor((e.clientX - rect.left) / cellSize),
      y: Math.floor((e.clientY - rect.top) / cellSize),
    };
  }
  canvas.addEventListener('mousemove', (e) => {
    if (!state) return;
    const { x, y } = cellFromEvent(e);
    if (x < 0 || y < 0 || x >= state.map.W || y >= state.map.H) { tip.style.display = 'none'; return; }
    const t = state.map.cells[y * state.map.W + x];
    const names = { 0: 'wall', 1: 'floor', 2: 'shelf', 3: 'workstation', 4: 'home' };
    const blocked = state.blocked.includes(`${x},${y}`);
    const robot = state.robots.find((r) => r.x === x && r.y === y);
    tip.textContent = `(${x},${y}) ${names[t]}${blocked ? ' · BLOCKED' : ''}${robot ? ` · ${robot.id}` : ''} — click to ${t === 0 || t === 2 ? '(not traversable)' : blocked ? 'unblock' : 'block'}`;
    const wrap = $('#map-wrap').getBoundingClientRect();
    tip.style.left = Math.max(0, Math.min(e.clientX - wrap.left + 12, wrap.width - 220)) + 'px';
    tip.style.top = (e.clientY - wrap.top + 12) + 'px';
    tip.style.display = 'block';
  });
  canvas.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
  canvas.addEventListener('click', async (e) => {
    if (!state) return;
    const { x, y } = cellFromEvent(e);
    const t = state.map.cells[y * state.map.W + x];
    if (t === 0 || t === 2) { toast('Only traversable cells can be blocked'); return; }
    try {
      await post('/api/cells', { x, y });
      toast(`Cell (${x},${y}) toggled — affected routes replanned`);
    } catch (err) { toast(`Cell update failed: ${err.message}`); }
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (state) drawMap(); }, 120);
  });

  connect();
})();
