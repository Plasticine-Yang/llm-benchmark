import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
test('HTTP mutations persist; SSE reconnect sends full snapshot then increasing events',async()=>{
 const dir=fs.mkdtempSync(path.join(root,'data','http-test-'));
 const server=spawn(process.execPath,['server/index.js'],{cwd:root,env:{...process.env,PORT:'3107',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});
 const url='http://localhost:3107';
 const post=async(p,data)=>(await fetch(url+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})).json();
 const stream=async last=>{const abort=new AbortController();const res=await fetch(url+'/api/events',{headers:{'Last-Event-ID':String(last)},signal:abort.signal});const reader=res.body.getReader();let pending='';return {abort,next:async()=>{while(!pending.includes('\n\n')){const {value,done}=await reader.read();if(done)throw new Error('Stream ended');pending+=new TextDecoder().decode(value);}const end=pending.indexOf('\n\n'),event=pending.slice(0,end);pending=pending.slice(end+2);return JSON.parse(event.split('\n').find(l=>l.startsWith('data: ')).slice(6));}};};
 try {
  await new Promise((resolve,reject)=>{server.stdout.on('data',()=>resolve());server.once('error',reject);server.once('exit',code=>reject(new Error('Server exited '+code)));});
  const first=await stream(0),snapshot=await first.next();assert.equal(snapshot.robots.length,8);assert.equal(snapshot.map.shelves.length,24);
  const job=await post('/api/jobs',{shelfId:'S01',stationId:'W3',priority:3});assert.ok(job.sequence>snapshot.sequence);assert.equal((await first.next()).sequence,job.sequence);first.abort.abort();
  await post('/api/control',{action:'step'});const reconnect=await stream(snapshot.sequence),latest=await reconnect.next();assert.ok(latest.sequence>job.sequence);assert.equal(latest.tick,1);assert.ok(latest.robots.some(r=>r.route.length));
  const stepped=await post('/api/control',{action:'step'});assert.equal((await reconnect.next()).sequence,stepped.sequence);reconnect.abort.abort();
  const persisted=JSON.parse(fs.readFileSync(path.join(dir,'simulation.json'),'utf8'));assert.equal(persisted.sequence,stepped.sequence);assert.deepEqual(persisted.robots,stepped.robots);
 }finally{server.kill('SIGTERM');await new Promise(r=>server.once('exit',r));fs.rmSync(dir,{recursive:true,force:true});}
});
