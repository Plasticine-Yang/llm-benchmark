import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Engine} from './engine.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataDir=process.env.DATA_DIR?path.resolve(process.env.DATA_DIR):path.join(root,'data');
fs.mkdirSync(dataDir,{recursive:true});
const stateFile=path.join(dataDir,'simulation.json');
let saved=null;
if(fs.existsSync(stateFile)){
  try {saved=JSON.parse(fs.readFileSync(stateFile,'utf8'));if(saved.version!==1)throw new Error('Unsupported saved state version');}
  catch(error){console.error('Cannot load persisted simulation. Preserve or remove data/simulation.json to recover.',error);process.exit(1);}
}
const engine=new Engine(saved),clients=new Set();
function persist(){const temp=`${stateFile}.tmp`;fs.writeFileSync(temp,JSON.stringify(engine.state));fs.renameSync(temp,stateFile);}
function publish(snapshot){persist();const message=`id: ${snapshot.sequence}\nevent: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`;for(const client of clients){if(client.writableLength>2e6){client.destroy();clients.delete(client);}else client.write(message);}}
engine.log('system',saved?'Persisted simulation restored':'Warehouse initialized · seed 7429');publish(engine.commit());
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
async function body(req){let data='';for await(const chunk of req){data+=chunk;if(data.length>16384)throw new Error('Request body too large');}return data?JSON.parse(data):{};}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const staticDir=fs.existsSync(path.join(root,'dist','index.html'))?path.join(root,'dist'):path.join(root,'public');
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  try {
    if(req.method==='GET'&&url.pathname==='/api/state')return json(res,200,engine.snapshot());
    if(req.method==='GET'&&url.pathname==='/api/health')return json(res,200,{ok:true,sequence:engine.state.sequence,tick:engine.state.tick});
    if(req.method==='GET'&&url.pathname==='/api/events'){
      res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});
      // Always send a complete latest snapshot, regardless of Last-Event-ID. The
      // browser installs it atomically, then accepts only increasing sequence IDs.
      res.write(`id: ${engine.state.sequence}\nevent: snapshot\ndata: ${JSON.stringify(engine.snapshot())}\n\n`);clients.add(res);
      req.on('close',()=>clients.delete(res));return;
    }
    if(req.method==='POST'&&url.pathname.startsWith('/api/')){
      const input=await body(req);let snapshot;
      if(url.pathname==='/api/jobs')snapshot=engine.createJob(input);
      else if(url.pathname==='/api/obstacles')snapshot=engine.setBlocked(input);
      else if(url.pathname==='/api/control')snapshot=engine.control(input.action,input.speed);
      else return json(res,404,{error:'Unknown endpoint'});
      publish(snapshot);return json(res,200,snapshot);
    }
    if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
    const decoded=decodeURIComponent(url.pathname),filename=decoded==='/'?'index.html':decoded.replace(/^\/+/,''),file=path.resolve(staticDir,filename);
    if(!file.startsWith(staticDir+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return json(res,404,{error:'Not found'});
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(res);
  }catch(error){if(!res.headersSent)json(res,400,{error:error.message});else res.end();}
});
let timer;
function clock(){timer=setTimeout(()=>{if(engine.state.running){try{publish(engine.step());}catch(error){engine.state.running=false;engine.log('error',`Safety stop: ${error.message}`);publish(engine.commit());console.error(error);}}clock();},engine.state.speed);}
clock();
const heartbeat=setInterval(()=>{for(const res of clients)res.write(': heartbeat\n\n');},15000);
const port=Number(process.env.PORT)||3000;
server.listen(port,'0.0.0.0',()=>console.log(`Warehouse Orbit running at http://localhost:${port} · state: ${stateFile}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{clearTimeout(timer);clearInterval(heartbeat);persist();for(const res of clients)res.end();server.close(()=>process.exit(0));});
