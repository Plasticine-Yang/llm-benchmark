import {createMap,key,same,traversable,neighbors} from './map.js';
import {Reservations,itinerary,spaceTimePath,distances} from './planner.js';
export const COLORS=['#7b6ef6','#23b8a7','#f59e4c','#e576aa','#649df2','#b09a52','#9c79d8','#5dad73'];
export class Engine {
  constructor(saved=null){
    this.state=saved||this.initial();
    this.assertSafety();
  }
  initial(){const map=createMap();return {version:1,seed:map.seed,sequence:0,tick:0,running:false,speed:650,map,blocked:[],jobs:[],nextJob:1,events:[],metrics:{moves:0,waits:0,replans:0,collisions:0},robots:map.homes.map((home,i)=>({id:`R${String(i+1).padStart(2,'0')}`,name:`Atlas ${String(i+1).padStart(2,'0')}`,color:COLORS[i],home,position:{...home},route:[],jobId:null,status:'idle',reason:'Ready for assignment',waitingSince:0}))};}
  log(type,message,robotId=null){const s=this.state;s.events.unshift({id:`${s.sequence+1}-${s.events.length}-${s.tick}`,tick:s.tick,type,message,robotId});s.events=s.events.slice(0,100);}
  commit(){this.state.sequence++;return this.snapshot();}
  snapshot(){return structuredClone(this.state);}
  reset(){const seq=this.state.sequence;this.state=this.initial();this.state.sequence=seq;this.log('system',`Simulation reset · deterministic seed ${this.state.seed}`);return this.commit();}
  effectivePriority(job){return job.priority+Math.floor((this.state.tick-job.createdTick)/24);}
  createJob({shelfId,stationId,priority=2}){
    const s=this.state;
    if(!s.map.shelves.some(v=>v.id===shelfId)||!s.map.workstations.some(v=>v.id===stationId))throw new Error('Choose a valid shelf and workstation.');
    if(![1,2,3].includes(Number(priority)))throw new Error('Priority must be 1, 2, or 3.');
    if(s.jobs.filter(j=>j.status!=='completed').length>=100)throw new Error('The active job queue is full (100 jobs).');
    const job={id:`J${String(s.nextJob++).padStart(3,'0')}`,shelfId,stationId,priority:Number(priority),status:'queued',createdTick:s.tick,pickedUp:false,robotId:null};
    s.jobs.push(job);this.log('job',`${job.id} created · ${shelfId} → ${stationId} · ${['','Low','Normal','High'][job.priority]} priority`);
    this.schedule();return this.commit();
  }
  schedule(){
    const s=this.state,blocked=new Set(s.blocked);
    const queued=s.jobs.filter(j=>j.status==='queued').sort((a,b)=>this.effectivePriority(b)-this.effectivePriority(a)||a.createdTick-b.createdTick||a.id.localeCompare(b.id));
    for(const job of queued){
      const pickup=s.map.shelves.find(v=>v.id===job.shelfId).pickup,d=distances(s.map,pickup,blocked);
      const available=s.robots.filter(r=>!r.jobId&&r.route.length===0).sort((a,b)=>(d.get(key(a.position))??1e6)-(d.get(key(b.position))??1e6)||a.id.localeCompare(b.id));
      if(!available.length)break;
      const r=available[0];job.robotId=r.id;job.status='assigned';job.assignedTick=s.tick;r.jobId=job.id;r.waitingSince=s.tick;r.status='waiting';
      this.log('assignment',`${r.id} assigned ${job.id} · ${job.shelfId} → ${job.stationId}`,r.id);
    }
    // Existing committed routes stay stable. Plan waiting robots against all other
    // trajectories and stationary tails; retry after a successful reservation.
    const waiting=s.robots.filter(r=>r.jobId&&!r.route.length).sort((a,b)=>{
      const ja=s.jobs.find(j=>j.id===a.jobId),jb=s.jobs.find(j=>j.id===b.jobId);
      const ca=s.map.cells[a.position.y][a.position.x].corridorId?100:0,cb=s.map.cells[b.position.y][b.position.x].corridorId?100:0;
      return cb-ca+this.effectivePriority(jb)-this.effectivePriority(ja)||a.waitingSince-b.waitingSince||a.id.localeCompare(b.id);
    });
    for(let pass=0;pass<2;pass++)for(const r of waiting){
      if(r.route.length)continue;
      const job=s.jobs.find(j=>j.id===r.jobId),reservations=new Reservations(s.map,s.robots);
      const route=itinerary(s.map,r,job,blocked,reservations);
      if(route){r.route=route;r.status=job.status==='completed'?'returning':job.pickedUp?'delivering':'collecting';r.reason=same(r.position,route[0])?'Waiting for a reserved crossing':'Route reserved · collision-free';s.metrics.replans++;}
      else{
        const goal=job.status==='completed'?r.home:job.pickedUp?s.map.workstations.find(w=>w.id===job.stationId):s.map.shelves.find(sh=>sh.id===job.shelfId).pickup;
        const required=[...(job.pickedUp?[]:[s.map.shelves.find(sh=>sh.id===job.shelfId).pickup]),...(job.status==='completed'?[]:[s.map.workstations.find(w=>w.id===job.stationId)]),r.home];
        let origin=r.position;const staticReachable=required.every(target=>{const reachable=distances(s.map,target,blocked).has(key(origin));origin=target;return reachable;});
        r.status='waiting';r.reason=staticReachable?'Yielding to occupied cells or reserved traffic':'Blocked cells disconnect the route';
        // Clear an occupied aisle for other robots, keeping the job and its phase.
        // A refuge is a roomy floor cell, held until the next full plan is committed.
        if(pass===1&&staticReachable&&!same(r.position,r.home)){
          const candidates=[];
          for(const row of s.map.cells)for(const c of row)if(c.type==='floor'&&!c.corridorId&&neighbors(s.map,c,blocked).length>=3&&Math.abs(c.x-r.position.x)+Math.abs(c.y-r.position.y)<=7&&!same(c,r.position))candidates.push(c);
          candidates.sort((a,b)=>(Math.abs(a.x-r.position.x)+Math.abs(a.y-r.position.y))-(Math.abs(b.x-r.position.x)+Math.abs(b.y-r.position.y))||a.y-b.y||a.x-b.x);
          for(const c of candidates){const path=spaceTimePath(s.map,r.position,c,blocked,reservations,r.id,0,true);if(path?.length){r.route=path;r.status='yielding';r.reason='Moving to a refuge to clear conflicting traffic';this.log('yield',`${r.id} yielding to a clear refuge`,r.id);break;}}
        }
      }
    }
  }
  setBlocked({x,y,blocked}){
    x=Number(x);y=Number(y);const s=this.state,p={x,y};
    if(!Number.isInteger(x)||!Number.isInteger(y)||!traversable(s.map,p))throw new Error('Only traversable grid cells can be changed.');
    if(typeof blocked!=='boolean')throw new Error('blocked must be a boolean.');
    const set=new Set(s.blocked),k=key(p);blocked?set.add(k):set.delete(k);s.blocked=[...set];
    // Atomic stop/replan: no timer can advance while this synchronous transaction runs.
    for(const r of s.robots)if(r.jobId){r.route=[];r.status='waiting';r.reason='Map changed · replanning';}
    this.log(blocked?'obstacle':'clear',`Cell (${x}, ${y}) ${blocked?'blocked':'reopened'} · all active routes revalidated`);
    this.schedule();this.assertSafety();return this.commit();
  }
  control(action,speed){
    if(action==='reset')return this.reset();
    if(action==='step'){if(this.state.running)throw new Error('Pause before using single step.');return this.step();}
    if(action==='pause'){this.state.running=false;this.log('system','Simulation paused');}
    else if(action==='resume'){this.state.running=true;this.schedule();this.log('system','Simulation running');}
    else if(action==='speed'){if(![250,650,1200].includes(Number(speed)))throw new Error('Invalid simulation speed');this.state.speed=Number(speed);}
    else throw new Error('Unknown simulation control.');
    return this.commit();
  }
  step(){
    const s=this.state,blocked=new Set(s.blocked);this.schedule();
    const before=s.robots.map(r=>({...r.position}));
    const next=s.robots.map(r=>r.route[0]||r.position);
    this.validateTransition(before,next,blocked);
    s.tick++;
    for(let i=0;i<s.robots.length;i++){
      const r=s.robots[i],point=r.route.shift();
      if(!point){if(r.jobId)s.metrics.waits++;continue;}
      const moved=!same(r.position,point);r.position={x:point.x,y:point.y};moved?s.metrics.moves++:s.metrics.waits++;
      const job=s.jobs.find(j=>j.id===r.jobId);
      if(point.action==='pickup'&&job){job.pickedUp=true;job.status='in_transit';r.status='delivering';this.log('pickup',`${r.id} collected ${job.shelfId} for ${job.id}`,r.id);}
      if(point.action==='deliver'&&job){job.status='completed';job.completedTick=s.tick;r.status='returning';this.log('complete',`${job.id} delivered to ${job.stationId} by ${r.id}`,r.id);}
      if(point.action==='park'){r.jobId=null;r.status='idle';r.reason='Ready for assignment';this.log('park',`${r.id} returned to its charging bay`,r.id);}
      else if(r.route.length){r.reason=same(r.position,r.route[0])?(r.route[0].action?'Servicing job · one time step':'Waiting for a reserved crossing'):(r.status==='yielding'?'Moving to a refuge to clear conflicting traffic':'Route reserved · collision-free');}
    }
    this.schedule();this.assertSafety();return this.commit();
  }
  validateTransition(before,next,blocked){
    const occupied=new Set();
    for(let i=0;i<next.length;i++){
      const p=next[i];if(occupied.has(key(p)))throw new Error('Safety violation: vertex collision');occupied.add(key(p));
      if(Math.abs(before[i].x-p.x)+Math.abs(before[i].y-p.y)>1)throw new Error('Safety violation: invalid move');
      if(!traversable(this.state.map,p,blocked)&&!same(before[i],p))throw new Error('Safety violation: obstacle entry');
      for(let j=0;j<i;j++)if(same(before[i],next[j])&&same(before[j],p)&&!same(before[i],p))throw new Error('Safety violation: edge swap');
    }
  }
  assertSafety(){const s=this.state;this.validateTransition(s.robots.map(r=>r.position),s.robots.map(r=>r.position),new Set(s.blocked));}
}
