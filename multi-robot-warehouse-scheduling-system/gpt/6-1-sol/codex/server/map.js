export const SEED = 7429;
export const key = p => `${p.x},${p.y}`;
export const same = (a, b) => a.x === b.x && a.y === b.y;
export function createMap() {
  const width = 30, height = 20;
  const homes = [2,4,6,12,14,16,23,25].map(x => ({x, y:1}));
  const cells = Array.from({length:height}, (_,y) => Array.from({length:width}, (_,x) =>
    ({x,y,type: x===0 || y===0 || x===width-1 || y===height-1 ? 'wall' : 'floor'})));
  for(let x=1;x<width-1;x++) cells[1][x].type = 'wall';
  homes.forEach(p => cells[p.y][p.x].type = 'parking');
  for(const x of [9,10,19,20]) for(let y=2;y<height-1;y++) if(![5,14].includes(y)) cells[y][x].type='wall';
  const shelves=[];
  for(const base of [0,10,20]) for(const y of [8,11]) for(const dx of [2,4,6,8]) {
    const id=`S${String(shelves.length+1).padStart(2,'0')}`, x=base+dx;
    const shelf={id,x,y,pickup:{x,y:y+2},cells:[{x,y},{x,y:y+1}]};
    shelves.push(shelf);
    shelf.cells.forEach(p=>Object.assign(cells[p.y][p.x],{type:'shelf',shelfId:id}));
    Object.assign(cells[y+2][x],{type:'pickup',shelfId:id});
  }
  const workstations=[{id:'W1',name:'Packing',x:2,y:17},{id:'W2',name:'Dispatch',x:12,y:17},{id:'W3',name:'Assembly',x:23,y:17},{id:'W4',name:'Quality',x:27,y:17}];
  workstations.forEach(p=>Object.assign(cells[p.y][p.x],{type:'workstation',stationId:p.id}));
  const corridors=[];
  for(const x of [9,19]) for(const y of [5,14]) {
    const id=`C${corridors.length+1}`;
    const points=[{x,y},{x:x+1,y}];
    points.forEach(p=>Object.assign(cells[p.y][p.x],{corridorId:id}));
    corridors.push({id,cells:points});
  }
  return {seed:SEED,width,height,cells,shelves,workstations,homes,corridors};
}
export function traversable(map, p, blocked=new Set()) {
  const c=map.cells[p.y]?.[p.x];
  return !!c && !['wall','shelf'].includes(c.type) && !blocked.has(key(p));
}
export function neighbors(map,p,blocked) {
  return [{x:p.x+1,y:p.y},{x:p.x,y:p.y+1},{x:p.x-1,y:p.y},{x:p.x,y:p.y-1}].filter(n=>traversable(map,n,blocked));
}
