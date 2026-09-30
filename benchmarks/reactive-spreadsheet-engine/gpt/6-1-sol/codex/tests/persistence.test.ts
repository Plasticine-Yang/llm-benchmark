import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
const temporary = path.resolve('data/test-persistence');
async function start(port: number): Promise<ChildProcess> {
  const process = spawn(globalThis.process.execPath, ['--import', 'tsx', 'server/index.ts'], { cwd: globalThis.process.cwd(), env: { ...globalThis.process.env, PORT: String(port), WORKBOOK_FILE: path.join(temporary,'book.json') }, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => { process.kill(); reject(new Error('Server startup timed out')); }, 10000);
    process.stdout!.on('data', text => { if (String(text).includes('Forma ready')) { clearTimeout(timeout); resolve(); } });
    process.stderr!.on('data', text => { clearTimeout(timeout); reject(new Error(String(text))); });
    process.on('exit', code => { if (code) { clearTimeout(timeout); reject(new Error(`Server exited ${code}`)); } });
  });
  return process;
}
async function stop(process: ChildProcess) {
  await new Promise<void>(resolve => { process.once('exit', () => resolve()); process.kill('SIGTERM'); });
}
test('HTTP save, restart, computed results, conflict rejection and validation', async () => {
  await mkdir(temporary,{recursive:true});
  const port = 18000 + Math.floor(Math.random()*1000), url = `http://127.0.0.1:${port}/api/workbook`;
  let server: ChildProcess | null = null;
  try {
    server = await start(port);
    const initial = await (await fetch(url)).json();
    const edits = [{id:'I1',raw:'7'},{id:'I2',raw:'=I1*2'},{id:'I3',raw:'=I2+2'},{id:'I4',raw:'=I3/4'}];
    const saved = await fetch(url,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:initial.revision,edits})});
    assert.equal(saved.status,200);
    const revision = (await saved.json()).revision;
    const stale = await fetch(url,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:initial.revision,edits})});
    assert.equal(stale.status,409);
    const invalid = await fetch(url,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision,edits:[{id:'Z99',raw:'1'}]})});
    assert.equal(invalid.status,400);
    await stop(server); server = await start(port);
    const reloaded = await (await fetch(url)).json();
    assert.equal(reloaded.cells.I4,'=I3/4'); assert.equal(reloaded.computed.I4.value,4); assert.equal(reloaded.revision,revision);
    const cycle = await fetch(url,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision,edits:[{id:'I1',raw:'=I4'}]})});
    assert.equal(cycle.status,200);
    await stop(server); server = await start(port);
    const after = await (await fetch(url)).json();
    for (const id of ['I1','I2','I3','I4']) assert.equal(after.computed[id].error,'#CYCLE!');
  } finally { if (server) await stop(server); await rm(temporary,{recursive:true,force:true}); }
});
