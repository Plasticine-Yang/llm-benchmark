import test from 'node:test';
import assert from 'node:assert/strict';
import {Engine} from '../server/engine.js';
import {createMap,key,same,traversable} from '../server/map.js';
import {Reservations,spaceTimePath} from '../server/planner.js';
function job(e,shelfId,stationId,priority=2){e.createJob({shelfId,stationId,priority});}
function run(e,n){for(let i=0;i<n;i++)e.step();}
test('deterministic warehouse has 8 robots, 24 shelves, 4 stations and 4 narrow corridors',()=>{
 const e=new Engine();assert.equal(e.state.robots.length,8);assert.equal(e.state.map.shelves.length,24);assert.equal(e.state.map.workstations.length,4);assert.deepEqual(e.state,new Engine().state);
});
test('three simultaneous cross-room jobs complete with no vertex, edge, or obstacle collision',()=>{
 const e=new Engine();job(e,'S01','W3',3);job(e,'S17','W1',2);job(e,'S09','W4',1);
 run(e,180);assert.equal(e.state.jobs.filter(j=>j.status==='completed').length,3);assert.ok(e.state.robots.every(r=>!r.jobId));assert.equal(e.state.metrics.collisions,0);
});
test('24 competing jobs finish and priority aging cannot leave queued jobs behind',()=>{
 const e=new Engine();for(let i=1;i<=24;i++)job(e,`S${String(i).padStart(2,'0')}`,`W${(i%4)+1}`,i%3+1);
 run(e,650);assert.equal(e.state.jobs.filter(j=>j.status==='completed').length,24);assert.ok(e.state.robots.every(r=>!r.jobId));
});
test('new obstacle invalidates reservations immediately and routes avoid it',()=>{
 const e=new Engine();job(e,'S01','W4',3);job(e,'S17','W1',2);job(e,'S10','W3',2);run(e,5);
 const r=e.state.robots.find(r=>r.route.length&&!same(r.route[0],r.position));const p=r.route[0];
 const oldSequence=e.state.sequence;e.setBlocked({...p,blocked:true});assert.ok(e.state.sequence>oldSequence);
 for(const robot of e.state.robots)assert.ok(robot.route.every(point=>!same(point,p)));
 run(e,240);assert.equal(e.state.jobs.filter(j=>j.status==='completed').length,3);
 e.setBlocked({...p,blocked:false});assert.equal(e.state.blocked.length,0);
});
test('occupied cell can be blocked: robot exits it and no robot enters it',()=>{
 const e=new Engine();job(e,'S01','W3');run(e,4);const p={...e.state.robots.find(r=>r.jobId).position};e.setBlocked({...p,blocked:true});run(e,180);assert.ok(e.state.robots.every(r=>!same(r.position,p)));assert.equal(e.state.jobs[0].status,'completed');
});
test('reset keeps sequence monotonic and reproduces an identical run',()=>{
 const e=new Engine();job(e,'S01','W3');job(e,'S17','W1');run(e,90);const positions=e.state.robots.map(r=>r.position),metrics={...e.state.metrics},seq=e.state.sequence;
 e.reset();assert.ok(e.state.sequence>seq);job(e,'S01','W3');job(e,'S17','W1');run(e,90);assert.deepEqual(e.state.robots.map(r=>r.position),positions);assert.deepEqual(e.state.metrics,metrics);
});
test('persisted snapshot resumes exactly and maintains increasing event sequences',()=>{
 const e=new Engine();job(e,'S08','W4');run(e,12);const copy=new Engine(JSON.parse(JSON.stringify(e.state)));
 for(let i=0;i<80;i++){const previous=copy.state.sequence;assert.deepEqual(copy.step(),e.step());assert.ok(copy.state.sequence>previous);}
});
test('space-time search rejects swap edges, stationary tails and shelf crossings',()=>{
 const map=createMap(),a={id:'A',position:{x:2,y:3},route:[{x:3,y:3}]},b={id:'B',position:{x:3,y:3},route:[]};const reservations=new Reservations(map,[a,b],30);
 assert.equal(reservations.free('B',b.position,a.position,1),false);
 assert.equal(reservations.free('A',{x:3,y:4},{x:3,y:3},20),false);
 const path=spaceTimePath(map,{x:1,y:7},{x:7,y:13},new Set(),new Reservations(map,[],50),'C');assert.ok(path);assert.ok(path.every(p=>traversable(map,p)));
});
test('disconnected route exposes a wait reason; reopening resumes completion',()=>{
 const e=new Engine();for(const y of [5,14])for(const x of [9,10])e.setBlocked({x,y,blocked:true});job(e,'S01','W3');run(e,3);
 assert.equal(e.state.jobs[0].status,'assigned');assert.equal(e.state.robots.find(r=>r.jobId).status,'waiting');
 for(const x of [9,10])e.setBlocked({x,y:5,blocked:false});run(e,200);assert.equal(e.state.jobs[0].status,'completed');
});
