import {key,same,neighbors,traversable} from './map.js';
export const HORIZON=320;
class Heap {
  data=[];
  push(v) {const a=this.data; a.push(v); let i=a.length-1; while(i>0){const p=(i-1)>>1; if(a[p].f<=v.f)break; a[i]=a[p];i=p;} a[i]=v;}
  pop(){const a=this.data, top=a[0], v=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].f<a[c].f)c++;if(a[c].f>=v.f)break;a[i]=a[c];i=c;}a[i]=v;}return top;}
  get length(){return this.data.length;}
}
// Reserve vertices, directed edges, and entire narrow corridors. Every route has a
// terminal hold, including robots that have not yet obtained a plan.
export class Reservations {
  constructor(map,robots,horizon=HORIZON){
    this.map=map;this.horizon=horizon;this.vertices=new Map();this.edges=new Map();this.corridors=new Map();
    for(const r of robots)this.add(r);
  }
  set(table,k,id){if(!table.has(k))table.set(k,new Set());table.get(k).add(id);}
  other(table,k,id){const ids=table.get(k);return ids&&[...ids].some(v=>v!==id);}
  add(r){let previous=r.position;for(let t=0;t<=this.horizon;t++){
    const p=t===0?r.position:r.route[Math.min(t-1,r.route.length-1)]||r.position;
    this.set(this.vertices,`${t}:${key(p)}`,r.id);
    if(t)this.set(this.edges,`${t}:${key(previous)}>${key(p)}`,r.id);
    const corridor=this.map.cells[p.y][p.x].corridorId;
    if(corridor){this.set(this.corridors,`${t}:${corridor}`,r.id);this.set(this.corridors,`${t+1}:${corridor}`,r.id);}
    previous=p;
  }}
  free(id,from,to,t){
    if(this.other(this.vertices,`${t}:${key(to)}`,id))return false;
    if(this.other(this.edges,`${t}:${key(to)}>${key(from)}`,id))return false;
    const corridor=this.map.cells[to.y][to.x].corridorId;
    return !corridor||!this.other(this.corridors,`${t}:${corridor}`,id);
  }
  canHold(id,p,t){for(let i=t;i<=this.horizon;i++)if(!this.free(id,p,p,i))return false;return true;}
}
export function distances(map,goal,blocked){
  const result=new Map([[key(goal),0]]),queue=[goal];
  if(!traversable(map,goal,blocked))return new Map();
  for(let i=0;i<queue.length;i++)for(const n of neighbors(map,queue[i],blocked))if(!result.has(key(n))){result.set(key(n),result.get(key(queue[i]))+1);queue.push(n);}
  return result;
}
export function spaceTimePath(map,start,goal,blocked,reservations,id,startTime=0,hold=false){
  const distance=distances(map,goal,blocked);
  // A robot already on a newly blocked cell is allowed to leave, never re-enter.
  const heuristic=p=>distance.get(key(p))??(same(p,start)?Math.min(...neighbors(map,p,blocked).map(n=>(distance.get(key(n))??Infinity)+1)):Infinity);
  if(!Number.isFinite(heuristic(start)))return null;
  const open=new Heap(), seen=new Set(), root={p:start,t:startTime,f:heuristic(start),parent:null}; open.push(root);
  let count=0;
  while(open.length&&count++<180000){
    const node=open.pop(),k=`${node.t}:${key(node.p)}`;
    if(seen.has(k))continue;seen.add(k);
    if(same(node.p,goal)&&(!hold||reservations.canHold(id,goal,node.t))){
      const path=[];let cur=node;while(cur.parent){path.push({...cur.p});cur=cur.parent;}return path.reverse();
    }
    if(node.t>=reservations.horizon-1)continue;
    const next=neighbors(map,node.p,blocked);
    if(traversable(map,node.p,blocked))next.push(node.p);
    for(const p of next){const t=node.t+1;if(!Number.isFinite(heuristic(p))||!reservations.free(id,node.p,p,t)||seen.has(`${t}:${key(p)}`))continue;
      open.push({p,t,parent:node,f:t-startTime+heuristic(p)+(same(node.p,p)?.001:0)});
    }
  }
  return null;
}
export function itinerary(map,r,job,blocked,reservations){
  const shelf=map.shelves.find(s=>s.id===job.shelfId),station=map.workstations.find(s=>s.id===job.stationId);
  const goals=[];
  if(!job.pickedUp)goals.push({p:shelf.pickup,action:'pickup'});
  if(job.status!=='completed')goals.push({p:station,action:'deliver'});
  goals.push({p:r.home,action:'park',hold:true});
  let position=r.position,time=0;const route=[];
  for(const goal of goals){
    const path=spaceTimePath(map,position,goal.p,blocked,reservations,r.id,time,goal.hold);
    if(!path)return null;
    route.push(...path);time+=path.length;position=goal.p;
    if(!reservations.free(r.id,position,position,time+1)||time+1>HORIZON)return null;
    route.push({...position,action:goal.action});time++;
  }
  return route;
}
