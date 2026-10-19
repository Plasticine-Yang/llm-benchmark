// 用 CDP 打开页面，收集控制台日志 / 页面错误，并在 N 秒后截图。
// 用法: node tools/cdp.mjs <url> <outPng> [waitMs] [w] [h]
let [, , url, out, waitMsArg, wArg, hArg] = process.argv;
url += (url.includes('?') ? '&' : '?') + 'cb=' + Date.now();
const waitMs = Number(waitMsArg || 9000);
const W = Number(wArg || 1400), H = Number(hArg || 880);
const fs = await import('node:fs');

const listRes = await fetch('http://127.0.0.1:9222/json/new?' + encodeURIComponent(url), { method: 'PUT' });
const target = await listRes.json();
const ws = new WebSocket(target.webSocketDebuggerUrl);

let id = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => {
  const mid = ++id;
  pending.set(mid, { res, rej });
  ws.send(JSON.stringify({ id: mid, method, params }));
});

const logs = [];
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const p = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? p.rej(new Error(JSON.stringify(msg.error))) : p.res(msg.result);
    return;
  }
  if (msg.method === 'Runtime.consoleAPICalled') {
    logs.push(`[${msg.params.type}] ` + msg.params.args.map((a) => a.value ?? a.description ?? a.type).join(' '));
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    logs.push('[EXCEPTION] ' + (d.exception?.description || d.text));
  }
  if (msg.method === 'Log.entryAdded') {
    const e = msg.params.entry;
    logs.push(`[${e.level}] ${e.text}${e.url ? ' @' + e.url : ''}`);
  }
});

await new Promise((r) => ws.addEventListener('open', r));
await send('Runtime.enable');
await send('Log.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await new Promise((r) => setTimeout(r, waitMs));

const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));

const info = await send('Runtime.evaluate', {
  expression: `(() => {
    const d = window.__DIORAMA__;
    if (!d) return 'NO_DIORAMA';
    const gl = d.renderer.getContext();
    let objs = 0, tris = 0;
    d.scene.traverse(o => { if (o.isMesh || o.isPoints) objs++; });
    return JSON.stringify({
      objs,
      drawCalls: d.renderer.info.render.calls,
      triangles: d.renderer.info.render.triangles,
      programs: d.renderer.info.programs?.length,
      camera: d.camera.position.toArray().map(n=>+n.toFixed(2)),
      fps: null,
      glVersion: gl.getParameter(gl.VERSION),
      renderer: gl.getParameter(gl.RENDERER),
    });
  })()`,
  returnByValue: true,
});
console.log('INFO:', info.result.value);
console.log('--- console/log ---');
console.log(logs.slice(0, 60).join('\n') || '(empty)');
await send('Page.close');
ws.close();
