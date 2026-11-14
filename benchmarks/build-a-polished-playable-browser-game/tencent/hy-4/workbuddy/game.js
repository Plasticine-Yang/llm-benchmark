/* ============================================================
   PELICAN PEDAL — a sunset snack run
   Pure canvas + DOM UI. No assets, no dependencies.
   ============================================================ */
(() => {
'use strict';

/* ------------------------------------------------------------ helpers */
const TAU = Math.PI * 2;
const clamp = (v,a,b) => v<a?a:(v>b?b:v);
const lerp  = (a,b,t) => a+(b-a)*t;
const rand  = (a,b) => a+Math.random()*(b-a);
const randi = (a,b) => Math.floor(rand(a,b+1));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $ = id => document.getElementById(id);

const C = {
  ink:'#1e2b46', navy:'#26324f', cream:'#fff4df', cream2:'#f0dcb9',
  coral:'#ff7355', coralD:'#e2553e', teal:'#1fa89b', tealD:'#147d75',
  gold:'#ffc94a', goldD:'#e8a52c', white:'#ffffff', silver:'#a9dbe4'
};

const canvas = $('game');
const ctx = canvas.getContext('2d', {alpha:false});
const screens = {menu:$('screenMenu'), pause:$('screenPause'), over:$('screenOver')};

/* ------------------------------------------------------------ storage */
const K_HS='pelican-pedal-hs-v1', K_NAME='pelican-pedal-name', K_MUTE='pelican-pedal-muted';
const lsGet=(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v);}catch(e){return d;}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
const SEED=[{name:'CAPT. BEAK',score:5200},{name:'SANDY',score:3400},
            {name:'GULLY',score:1900},{name:'DOC',score:900}];
let highs = lsGet(K_HS,null);
if(!Array.isArray(highs)) highs = SEED.map(h=>({...h}));
highs = highs.filter(h=>h && typeof h.score==='number' && typeof h.name==='string')
             .sort((a,b)=>b.score-a.score).slice(0,6);
const bestScore = () => highs.length ? highs[0].score : 0;
const qualifies = s => s>0 && (highs.length<6 || s>highs[highs.length-1].score);

function renderRows(el, pending, hotName){
  let list = highs.map(h=>({name:h.name,score:h.score}));
  if(pending!=null) list.push({name:'YOU?',score:pending,pending:true});
  list.sort((a,b)=>b.score-a.score || (a.pending?1:-1));
  list = list.slice(0,6);
  el.innerHTML = list.map((r,i)=>
    '<div class="hs-row'+(r.pending?' pending':'')+(hotName && !r.pending && r.name===hotName?' hot':'')+'">'+
      '<span class="hs-rank">'+(i+1)+'</span>'+
      '<span class="hs-name">'+esc(r.name)+'</span>'+
      '<span class="hs-score">'+Math.floor(r.score).toLocaleString()+'</span>'+
    '</div>').join('') || '<div class="hs-empty">No rides logged yet</div>';
}
function renderMenuHighs(){ document.querySelectorAll('[data-highs]').forEach(el=>renderRows(el,null,null)); }

/* ------------------------------------------------------------ audio */
const AudioFX = {
  ctx:null, master:null, musicGain:null, noiseBuf:null, timer:null,
  step:0, nextTime:0, muted:!!lsGet(K_MUTE,false),
  CHORDS:[[220,277.18,329.63],[174.61,220,261.63],[261.63,329.63,392],[196,246.94,293.66]],
  SEQ:[0,1,2,1,0,2,1,2],

  init(){
    if(this.ctx){ this.resume(); return; }
    try{
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return;
      const c = this.ctx = new AC();
      this.master = c.createGain(); this.master.gain.value = this.muted?0:0.55;
      this.master.connect(c.destination);
      this.musicGain = c.createGain(); this.musicGain.gain.value = 0.15;
      this.musicGain.connect(this.master);
      const len = Math.floor(c.sampleRate*0.4);
      this.noiseBuf = c.createBuffer(1,len,c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for(let i=0;i<len;i++) d[i] = Math.random()*2-1;
      this.startMusic();
    }catch(e){ this.ctx=null; }
  },
  resume(){ if(this.ctx && this.ctx.state==='suspended') this.ctx.resume().catch(()=>{}); },
  setMuted(m){
    this.muted=m; lsSet(K_MUTE,m);
    if(this.master) this.master.gain.setTargetAtTime(m?0:0.55,this.ctx.currentTime,0.02);
    $('btnSound').classList.toggle('muted',m);
    $('btnSound').title = m ? 'Unmute (M)' : 'Mute (M)';
  },
  tone(f,start,dur,type,gain,slide,dest){
    if(!this.ctx) return;
    const c=this.ctx, o=c.createOscillator(), g=c.createGain();
    o.type=type||'sine';
    o.frequency.setValueAtTime(f,start);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(24,slide),start+dur);
    g.gain.setValueAtTime(0.0001,start);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002,gain),start+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,start+dur);
    o.connect(g); g.connect(dest||this.master);
    o.start(start); o.stop(start+dur+0.03);
  },
  noise(start,dur,gain,freq,type,dest){
    if(!this.ctx||!this.noiseBuf) return;
    const c=this.ctx, src=c.createBufferSource(); src.buffer=this.noiseBuf;
    const f=c.createBiquadFilter(); f.type=type||'bandpass'; f.frequency.value=freq||1000; f.Q.value=0.8;
    const g=c.createGain();
    g.gain.setValueAtTime(gain,start);
    g.gain.exponentialRampToValueAtTime(0.0001,start+dur);
    src.connect(f); f.connect(g); g.connect(dest||this.master);
    src.start(start,0,Math.min(dur,0.38));
  },
  startMusic(){
    if(this.timer) return;
    this.step=0; this.nextTime=this.ctx.currentTime+0.12;
    this.timer=setInterval(()=>this.schedule(),60);
  },
  schedule(){
    if(!this.ctx) return;
    const now=this.ctx.currentTime, spb=0.152;
    if(now-this.nextTime>0.5) this.nextTime=now+0.05;
    while(this.nextTime < now+0.2){
      const s=this.step%8, ch=this.CHORDS[Math.floor(this.step/8)%4], t=this.nextTime;
      const f=ch[this.SEQ[s]]*2;
      this.tone(f,t,0.15,'triangle',0.13,null,this.musicGain);
      if(s===0||s===4) this.tone(ch[0]/2,t,0.24,'sine',0.30,null,this.musicGain);
      if(s%2===1) this.noise(t,0.045,0.035,5200,'highpass',this.musicGain);
      this.nextTime+=spb; this.step++;
    }
  },
  sfx(name,arg){
    if(!this.ctx || this.muted) return;
    const t=this.ctx.currentTime;
    switch(name){
      case 'hop':  this.tone(300,t,0.14,'triangle',0.28,660); break;
      case 'flap': this.noise(t,0.10,0.13,1900); this.tone(420,t,0.16,'triangle',0.18,900); break;
      case 'fish': { const k=clamp(arg||1,1,8);
        this.tone(600+k*55,t,0.10,'sine',0.22,880+k*60);
        this.tone(920+k*70,t+0.05,0.09,'triangle',0.12); break; }
      case 'gold': [0,1,2,3].forEach(i=>this.tone(660*Math.pow(1.26,i),t+i*0.065,0.17,'triangle',0.19)); break;
      case 'near': this.tone(1320,t,0.06,'square',0.075); break;
      case 'hit':  this.tone(190,t,0.32,'sawtooth',0.28,55); this.noise(t,0.22,0.20,480); break;
      case 'land': this.noise(t,0.07,0.07,420); break;
      case 'start':[523,659,784,1047].forEach((f,i)=>this.tone(f,t+i*0.07,0.17,'triangle',0.18)); break;
      case 'over': [523,415,330,262].forEach((f,i)=>this.tone(f,t+i*0.13,0.32,'triangle',0.2)); break;
      case 'record':[659,784,1047,1319].forEach((f,i)=>this.tone(f,t+i*0.10,0.26,'triangle',0.2)); break;
    }
  }
};

/* ------------------------------------------------------------ world / canvas */
let cssW=0, cssH=0, dpr=1, scale=1, W=960, H=540, groundY=428, horizonY=256;
let skyGrad, woodGrad, oceanGrad, vignetteGrad, sunSprite, islandTile, palmTile;
const u = n => n/scale;                       // css px -> world units

function makeTile(w,h,draw){
  const c=document.createElement('canvas'); c.width=w*2; c.height=h*2;
  const g=c.getContext('2d'); g.scale(2,2); draw(g,w,h); return c;
}
function buildSun(){
  const c=document.createElement('canvas'); c.width=c.height=512;
  const g=c.getContext('2d');
  const rg=g.createRadialGradient(256,256,30,256,256,256);
  rg.addColorStop(0,'rgba(255,240,185,.80)');
  rg.addColorStop(0.35,'rgba(255,196,120,.34)');
  rg.addColorStop(1,'rgba(255,150,110,0)');
  g.fillStyle=rg; g.fillRect(0,0,512,512);
  sunSprite=c;
}
function buildTiles(){
  islandTile=makeTile(1400,240,(g,w,h)=>{
    g.fillStyle='rgba(96,66,128,.62)';
    g.beginPath(); g.moveTo(0,h);
    for(let x=0;x<=w;x+=16) g.lineTo(x,h-62-38*Math.sin(x*0.0042)-15*Math.sin(x*0.011));
    g.lineTo(w,h); g.closePath(); g.fill();
    g.fillStyle='rgba(61,48,100,.78)';
    g.beginPath(); g.moveTo(0,h);
    for(let x=0;x<=w;x+=16) g.lineTo(x,h-30-23*Math.sin(x*0.006+1.3)-9*Math.sin(x*0.017));
    g.lineTo(w,h); g.closePath(); g.fill();
    const lx=1010;
    g.fillStyle='rgba(44,35,76,.9)';
    g.beginPath(); g.moveTo(lx-17,h); g.lineTo(lx-9,h-96); g.lineTo(lx+9,h-96); g.lineTo(lx+17,h); g.closePath(); g.fill();
    g.fillStyle='rgba(255,201,74,.9)'; g.fillRect(lx-11,h-104,22,10);
    g.fillStyle='rgba(255,240,190,.85)'; g.beginPath(); g.arc(lx,h-110,5,0,TAU); g.fill();
    for(const bx of [220,315,700]){
      g.fillStyle='rgba(48,40,84,.75)';
      g.fillRect(bx-26,h-30,52,30);
      g.beginPath(); g.moveTo(bx-32,h-30); g.lineTo(bx,h-52); g.lineTo(bx+32,h-30); g.closePath(); g.fill();
    }
  });
  palmTile=makeTile(1200,280,(g,w,h)=>{
    function palm(x,base,s){
      g.save(); g.translate(x,base); g.scale(s,s);
      g.strokeStyle='rgba(56,43,84,.88)'; g.lineWidth=10; g.lineCap='round';
      g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(13,-64,2,-128); g.stroke();
      g.fillStyle='rgba(35,86,92,.9)';
      for(let i=0;i<9;i++){
        const a=-Math.PI*0.98+i*(Math.PI*0.96/8);
        const ex=Math.cos(a)*78, ey=Math.sin(a)*42+4;
        g.beginPath(); g.moveTo(0,-128);
        g.quadraticCurveTo(ex*0.6,ey-16,ex,ey);
        g.quadraticCurveTo(ex*0.52,ey+5,0,-124);
        g.closePath(); g.fill();
      }
      g.fillStyle='rgba(255,201,74,.8)';
      for(let i=0;i<3;i++) g.fillRect(-7+i*6,-124,5,5);
      g.restore();
    }
    palm(130,h+8,0.95); palm(455,h+12,1.18); palm(820,h+10,0.86); palm(1090,h+8,1.06);
  });
}
function resize(){
  const oldGY=groundY;
  cssW=Math.max(1,window.innerWidth); cssH=Math.max(1,window.innerHeight);
  const asp=cssW/cssH;
  dpr=Math.min(window.devicePixelRatio||1, cssW<700?1.75:2);
  if(asp>=1.4){ H=540; W=H*asp; } else { W=760; H=W/asp; }
  scale=cssW/W;
  canvas.width=Math.round(cssW*dpr); canvas.height=Math.round(cssH*dpr);
  canvas.style.width=cssW+'px'; canvas.style.height=cssH+'px';
  groundY=H-112; horizonY=groundY-172;
  const dy=groundY-oldGY;
  if(dy){
    for(const o of obstacles){ o.y+=dy; o.baseY+=dy; }
    for(const f of pickups) f.y+=dy;
    if(player.onGround) player.y=groundY; else player.y+=dy;
  }

  skyGrad=ctx.createLinearGradient(0,0,0,horizonY+50);
  skyGrad.addColorStop(0,'#26265c'); skyGrad.addColorStop(0.28,'#5c3b7d');
  skyGrad.addColorStop(0.58,'#b95e7d'); skyGrad.addColorStop(0.82,'#ff8d6a');
  skyGrad.addColorStop(1,'#ffd08a');
  oceanGrad=ctx.createLinearGradient(0,horizonY,0,groundY);
  oceanGrad.addColorStop(0,'#4a8fa8'); oceanGrad.addColorStop(0.5,'#2c718e'); oceanGrad.addColorStop(1,'#20566f');
  woodGrad=ctx.createLinearGradient(0,groundY,0,H);
  woodGrad.addColorStop(0,'#d89b5a'); woodGrad.addColorStop(0.35,'#bd7a41'); woodGrad.addColorStop(1,'#8d552c');
  vignetteGrad=ctx.createRadialGradient(W/2,H*0.48,Math.min(W,H)*0.28,W/2,H*0.48,Math.max(W,H)*0.78);
  vignetteGrad.addColorStop(0,'rgba(16,16,44,0)'); vignetteGrad.addColorStop(1,'rgba(16,16,44,.46)');
  player.x=W*0.22;
}

/* ------------------------------------------------------------ state */
let mode='menu', t=0, distance=0, wheelAngle=0, speed=330, score=0, displayScore=0;
let combo=1, comboTimer=0, maxCombo=1, fishCaught=0, elapsed=0, nextMilestone=1000;
let shake=0, flash=0, flashRGB='255,80,60', hitStop=0, scorePop=0, pouchFill=0, pouchTarget=0;
let spawnTimer=1.5, menuFishTimer=0.7, menuHopTimer=1.6, forced=[], lastPattern='';
let finalScore=0, isRecord=false, pending=false, savedName='';
let jumpHeld=false, jumpBuffer=0, lowQ=false, frameAvg=16.7;
const GRAV=2200;

const player={x:200,y:428,vy:0,onGround:true,coyote:0,jumps:0,hold:0,
              hp:3,invuln:0,squash:0,flap:0,crashed:false,crashRot:0};
const obstacles=[], pickups=[], particles=[], popups=[];
const clouds=[], stars=[], speedLines=[], boats=[];
for(let i=0;i<11;i++) clouds.push({p:Math.random(),cy:rand(.10,.86),s:rand(.55,1.45),v:rand(.02,.07),a:rand(.55,.95)});
for(let i=0;i<44;i++) stars.push({p:Math.random(),cy:rand(.02,.52),r:rand(.7,2.0),ph:rand(0,TAU)});
for(let i=0;i<16;i++) speedLines.push({p:Math.random(),cy:rand(.06,.9),len:rand(16,66)});
for(let i=0;i<3;i++)  boats.push({p:Math.random(),cy:rand(.22,.68),s:rand(.7,1.3)});

const OBST={crab:{w:46,h:32},crate:{w:56,h:62},buoy:{w:36,h:92},gull:{w:60,h:36,air:true}};

/* ------------------------------------------------------------ entities */
function addObstacle(kind,x){
  const d=OBST[kind];
  const baseY=d.air ? groundY-205-d.h/2 : groundY-d.h;
  obstacles.push({kind,x,y:baseY,baseY,w:d.w,h:d.h,air:!!d.air,
                  phase:rand(0,TAU),passed:false,hit:false,minGap:999});
}
function addFish(x,height,gold){
  pickups.push({x,y:groundY-height,kind:gold?'gold':'fish',r:gold?18:14,
                phase:rand(0,TAU),taken:false});
}
function arcFish(x,n,lo,hi,goldLast){
  for(let i=0;i<n;i++){
    const q=n===1?0.5:i/(n-1);
    addFish(x+i*58, lo+(hi-lo)*Math.sin(q*Math.PI), goldLast && i===n-1);
  }
}
const PATTERNS=[
  {n:'fish',    span:232, clear:310, build:x=>arcFish(x,5,55,175,true)},
  {n:'crab',    span:60,  clear:335, build:x=>{addObstacle('crab',x); arcFish(x-70,3,120,185);}},
  {n:'crate',   span:120, clear:340, build:x=>{addObstacle('crate',x); arcFish(x-60,4,110,190);}},
  {n:'gull',    span:80,  clear:345, build:x=>{addObstacle('gull',x); arcFish(x-40,3,45,80);}},
  {n:'buoy',    span:100, clear:355, build:x=>{addObstacle('buoy',x); arcFish(x-80,4,140,215,true);}},
  {n:'double',  span:255, clear:340, build:x=>{addObstacle('crab',x); addObstacle('crate',x+250); arcFish(x-60,3,130,190);}},
  {n:'gullcrab',span:430, clear:365, build:x=>{addObstacle('gull',x); addFish(x+80,55); addObstacle('crab',x+310); arcFish(x+250,3,110,175);}}
];
function spawnPattern(){
  let p;
  if(forced.length){ const n=forced.shift(); p=PATTERNS.find(q=>q.n===n)||PATTERNS[1]; }
  else{
    let pool;
    if(elapsed<14) pool=PATTERNS.slice(0,4);
    else if(elapsed<30) pool=PATTERNS.slice(0,6);
    else pool=PATTERNS.slice();
    let tries=0;
    do{ p=pool[randi(0,pool.length-1)]; tries++; }while(p.n===lastPattern && tries<6);
  }
  lastPattern=p.n;
  p.build(W+70);
  spawnTimer=Math.max(0.78,(p.span+p.clear+rand(-30,60))/speed);
}

/* ------------------------------------------------------------ particles & popups */
function burst(kind,x,y,n,opt){
  opt=opt||{};
  for(let i=0;i<n;i++){
    const spread=opt.spread!==undefined?opt.spread:0.8;
    const a=opt.angle!==undefined?opt.angle+rand(-spread,spread):rand(0,TAU);
    const sp=rand(opt.min||40,opt.max||230);
    const lf=rand(opt.lifeMin||0.35,opt.lifeMax||0.75);
    particles.push({kind,x,y,
      vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-(opt.lift||0),
      g:opt.g!==undefined?opt.g:420, drag:opt.drag||1.6,
      life:lf,max:lf,rot:rand(0,TAU),vr:rand(-9,9),
      size:rand(2.5,6),color:opt.color||C.gold,
      r:opt.r||8,rv:opt.rv||150,seed:rand(0,TAU)});
  }
  const cap=lowQ?110:260;
  if(particles.length>cap) particles.splice(0,particles.length-cap);
}
function popup(txt,x,y,color,size,life){
  const lf=life||0.9;
  popups.push({txt,x,y,color:color||C.cream,size:size||20,life:lf,max:lf,vy:-48,sc:0});
}
function updateFX(dt){
  for(let i=particles.length-1;i>=0;i--){
    const q=particles[i]; q.life-=dt;
    if(q.life<=0){particles.splice(i,1);continue;}
    q.vy+=q.g*dt;
    q.vx-=q.vx*q.drag*dt; q.vy-=q.vy*q.drag*0.28*dt;
    q.x+=q.vx*dt; q.y+=q.vy*dt;
    q.rot+=q.vr*dt;
    if(q.kind==='feather') q.x+=Math.sin(q.life*11+q.seed)*26*dt;
    if(q.kind==='ring') q.r+=q.rv*dt;
  }
  for(let i=popups.length-1;i>=0;i--){
    const p=popups[i]; p.life-=dt;
    if(p.life<=0){popups.splice(i,1);continue;}
    p.y+=p.vy*dt; p.vy*=Math.pow(0.9,dt*60);
    p.sc+=(1-p.sc)*Math.min(1,dt*15);
  }
  shake*=Math.pow(0.0008,dt);
  flash=Math.max(0,flash-dt*1.9);
  scorePop=Math.max(0,scorePop-dt*3.4);
}

/* ------------------------------------------------------------ player actions */
function doJump(){
  const p=player;
  p.vy=-760; p.onGround=false; p.coyote=0; p.jumps=1; p.hold=0; p.squash=1;
  burst('dust',p.x-10,groundY,8,{color:'#f3d9ae',min:30,max:120,g:180,drag:3,lifeMax:.45,angle:-Math.PI/2,spread:.9});
  particles.push({kind:'ring',x:p.x,y:groundY-2,vx:0,vy:0,g:0,drag:0,life:.28,max:.28,
                  rot:0,vr:0,size:0,color:'rgba(255,240,205,.85)',r:8,rv:210,seed:0});
  AudioFX.sfx('hop');
}
function doFlap(){
  const p=player;
  p.vy=-620; p.jumps=2; p.flap=1; p.squash=0.7;
  burst('feather',p.x-14,p.y-118,7,{color:'#fff4df',min:50,max:170,g:200,drag:1.1,lift:40,lifeMax:.8});
  AudioFX.sfx('flap');
}
function requestJump(){
  jumpBuffer=0.13;
  if(mode!=='playing') return;
  const p=player;
  if(p.onGround||p.coyote>0){ doJump(); jumpBuffer=0; }
  else if(p.jumps<2) doFlap();
}
function land(){
  const p=player;
  p.squash=-1; shake=Math.max(shake,3.2);
  burst('dust',p.x-6,groundY-2,7,{color:'#f0d3a4',min:35,max:130,g:200,drag:3,lifeMax:.42,angle:-Math.PI/2,spread:1.1});
  particles.push({kind:'ring',x:p.x,y:groundY-2,vx:0,vy:0,g:0,drag:0,life:.26,max:.26,
                  rot:0,vr:0,size:0,color:'rgba(255,235,195,.7)',r:6,rv:190,seed:0});
  AudioFX.sfx('land');
}
function playerPhysics(dt){
  const p=player;
  const held = jumpHeld && p.vy<0 && p.hold<0.26;
  if(jumpHeld && p.vy<0) p.hold+=dt;
  p.vy += (held?GRAV*0.55:GRAV)*dt;
  p.y  += p.vy*dt;
  if(p.y < groundY-430){ p.y=groundY-430; p.vy=Math.max(0,p.vy); }
  if(p.y>=groundY){
    if(!p.onGround) land();
    p.y=groundY; p.vy=0; p.onGround=true; p.jumps=0; p.coyote=0.11; p.hold=0;
  }else{ p.onGround=false; p.coyote=Math.max(0,p.coyote-dt); }
  p.squash += (0-p.squash)*Math.min(1,dt*9);
  p.flap   += (0-p.flap)*Math.min(1,dt*8);
}

/* ------------------------------------------------------------ scoring events */
function collect(f){
  f.taken=true; fishCaught++;
  const gold=f.kind==='gold';
  const pts=(gold?60:12)*combo;
  score+=pts;
  combo=Math.min(8,combo+(gold?2:1));
  comboTimer=2.8; maxCombo=Math.max(maxCombo,combo); scorePop=1;
  burst(gold?'star':'spark',f.x,f.y,gold?16:9,
    {color:gold?C.gold:'#bff0f5',min:60,max:gold?300:200,g:gold?300:360,drag:2,lifeMax:gold?.8:.55});
  particles.push({kind:'ring',x:f.x,y:f.y,vx:0,vy:0,g:0,drag:0,life:.3,max:.3,
    rot:0,vr:0,size:0,color:gold?'rgba(255,220,120,.9)':'rgba(200,245,250,.8)',r:8,rv:gold?260:190,seed:0});
  popup('+'+pts,f.x,f.y-18,gold?C.gold:C.cream,gold?24:19);
  AudioFX.sfx(gold?'gold':'fish',combo);
  if(combo===4) popup('NICE!',player.x+40,player.y-230,C.gold,22);
  if(combo===8) popup('FRENZY!',player.x+40,player.y-250,C.coral,26,1.1);
}
function nearMiss(o){
  const pts=25*combo;
  score+=pts; combo=Math.min(8,combo+1); comboTimer=2.8;
  maxCombo=Math.max(maxCombo,combo); scorePop=1;
  popup('CLOSE!',o.x,o.y-14,C.gold,18,.75);
  burst('spark',o.x+o.w/2,o.y,6,{color:'#ffe6a3',min:60,max:170,g:280,lifeMax:.45});
  shake=Math.max(shake,3);
  AudioFX.sfx('near');
}
function hurt(o){
  const p=player;
  o.hit=true;
  if(p.invuln>0) return;
  p.hp--; p.invuln=1.35;
  combo=1; comboTimer=0;
  shake=22; hitStop=0.075; flash=0.42; flashRGB='255,80,60';
  burst('feather',p.x,p.y-110,16,{color:'#fff4df',min:90,max:320,g:420,drag:1.1,lifeMax:1.0});
  burst('spark',o.x+o.w/2,o.y+o.h/2,12,{color:C.coral,min:80,max:280,g:400,lifeMax:.6});
  popup('OUCH!',p.x+30,p.y-210,C.coral,26,1);
  AudioFX.sfx('hit');
  if(p.hp<=0) gameOver();
}
function milestone(){
  const n=Math.floor(nextMilestone/100)*100;
  popup(n+'!',W/2,groundY-300,C.gold,42,1.3);
  burst('confetti',W/2,groundY-260,26,{min:100,max:340,g:520,drag:.7,
    colors:[C.gold,C.coral,C.teal,C.cream],lifeMin:.7,lifeMax:1.2,angle:-Math.PI/2,spread:1.2});
  for(let i=0;i<26;i++){ const q=particles[particles.length-1-i]; if(q) q.color=[C.gold,C.coral,C.teal,C.cream][i%4]; }
  shake=Math.max(shake,6);
  AudioFX.sfx('gold');
}

/* ------------------------------------------------------------ game flow */
function showScreen(name){
  Object.keys(screens).forEach(k=>screens[k].classList.add('hidden'));
  if(name) screens[name].classList.remove('hidden');
  $('btnPause').classList.toggle('hidden',!(mode==='playing'||mode==='paused'));
  $('btnPause').title = mode==='paused' ? 'Resume (P)' : 'Pause (P)';
}
function startGame(){
  AudioFX.init(); AudioFX.resume();
  mode='playing';
  showScreen(null);
  Object.assign(player,{x:W*0.22,y:groundY,vy:0,onGround:true,coyote:0,jumps:0,hold:0,
    hp:3,invuln:0,squash:0,flap:0,crashed:false,crashRot:0});
  obstacles.length=0; pickups.length=0; particles.length=0; popups.length=0;
  distance=0; wheelAngle=0; speed=330; score=0; displayScore=0;
  combo=1; comboTimer=0; maxCombo=1; fishCaught=0; elapsed=0; nextMilestone=1000;
  shake=0; flash=0; hitStop=0; scorePop=0; pouchFill=0; pouchTarget=0;
  jumpBuffer=0; finalScore=0; isRecord=false; pending=false; savedName='';
  spawnTimer=1.0; forced=['crab','fish']; lastPattern='';
  arcFish(player.x+280,5,55,165,true);           // instant reward in <1 second
  arcFish(player.x+620,4,60,145);                // keeps the first seconds flowing
  popup('PEDAL!',W*0.5,groundY-260,C.cream,36,1.1);
  AudioFX.sfx('start');
}
function pauseGame(){
  if(mode!=='playing') return;
  mode='paused'; jumpHeld=false; showScreen('pause');
}
function resumeGame(){
  if(mode!=='paused') return;
  mode='playing'; showScreen(null); last=performance.now(); AudioFX.resume();
}
function togglePause(){ if(mode==='playing') pauseGame(); else if(mode==='paused') resumeGame(); }
function commitPending(name){
  if(!pending) return;
  const n=(name||'RIDER').toUpperCase().replace(/[^A-Z0-9 _!?.-]/g,'').trim().slice(0,10)||'RIDER';
  savedName=n; lsSet(K_NAME,n);
  highs.push({name:n,score:finalScore,date:Date.now()});
  highs.sort((a,b)=>b.score-a.score); highs=highs.slice(0,6);
  lsSet(K_HS,highs); pending=false; renderMenuHighs();
}
function gameOver(){
  mode='over'; player.crashed=true; jumpHeld=false;
  finalScore=Math.floor(score);
  isRecord=finalScore>bestScore();
  pending=qualifies(finalScore);
  shake=Math.max(shake,16);
  burst('feather',player.x,player.y-110,18,{min:70,max:280,g:400,drag:1,lifeMax:1.2});
  AudioFX.sfx('over');
  if(isRecord){ AudioFX.sfx('record');
    burst('confetti',W*0.5,groundY-280,30,{min:110,max:360,g:500,drag:.6,lifeMin:.8,lifeMax:1.4,angle:-Math.PI/2,spread:1.3});
  }
  renderOver(); showScreen('over');
}
function renderOver(){
  $('finalScore').textContent=finalScore.toLocaleString();
  $('statFish').textContent=fishCaught;
  $('statCombo').textContent='x'+maxCombo;
  $('statDist').textContent=Math.floor(distance/10)+'m';
  $('statBest').textContent=Math.max(bestScore(),finalScore).toLocaleString();
  $('recordBadge').classList.toggle('hidden',!isRecord);
  $('nameRow').classList.toggle('hidden',!pending);
  $('savedNote').classList.add('hidden');
  $('missNote').classList.toggle('hidden',pending||isRecord);
  $('nameInput').value=lsGet(K_NAME,'');
  renderRows($('overHighs'),pending?finalScore:null,null);
}
function saveName(){
  if(!pending) return;
  commitPending($('nameInput').value);
  $('nameRow').classList.add('hidden');
  $('savedNote').classList.remove('hidden');
  $('missNote').classList.add('hidden');
  $('nameInput').blur();
  renderRows($('overHighs'),null,savedName);
  AudioFX.sfx('fish',3);
}
function restart(){ commitPending($('nameInput').value); startGame(); }
function toMenu(){
  commitPending($('nameInput').value);
  mode='menu'; player.crashed=false; player.crashRot=0;
  player.y=groundY; player.vy=0; player.onGround=true;
  distance=0; speed=330; combo=1; pouchFill=0;
  obstacles.length=0; pickups.length=0; popups.length=0;
  menuFishTimer=0.5; menuHopTimer=1.4;
  renderMenuHighs(); showScreen('menu');
}
function primary(){
  if(mode==='menu') startGame();
  else if(mode==='playing') requestJump();
  else if(mode==='paused') resumeGame();
  else if(mode==='over') restart();
}

/* ------------------------------------------------------------ input */
function isUI(el){ return el instanceof Element && !!el.closest('button,input,.panel'); }
window.addEventListener('keydown',e=>{
  if(e.target instanceof HTMLInputElement){
    if(e.code==='Enter'){ e.preventDefault(); saveName(); restart(); }
    return;
  }
  const c=e.code;
  if(['Space','ArrowUp','KeyW','ArrowDown','KeyP','Escape','Enter','KeyR','KeyM'].includes(c)) e.preventDefault();
  if(e.repeat) return;
  if(c==='KeyM'){ AudioFX.init(); AudioFX.setMuted(!AudioFX.muted); return; }
  if(c==='KeyP'||c==='Escape'){ togglePause(); return; }
  if(c==='KeyR'){ if(mode==='over'||mode==='paused'||mode==='playing') restart(); else startGame(); return; }
  if(c==='Space'||c==='ArrowUp'||c==='KeyW'||c==='Enter'){
    if(mode==='playing') jumpHeld=true;
    AudioFX.init(); AudioFX.resume();
    primary();
  }
});
window.addEventListener('keyup',e=>{
  if(['Space','ArrowUp','KeyW','Enter'].includes(e.code)) jumpHeld=false;
});
$('app').addEventListener('pointerdown',e=>{
  if(isUI(e.target)) return;
  e.preventDefault();
  AudioFX.init(); AudioFX.resume();
  if(mode==='playing') jumpHeld=true;
  primary();
},{passive:false});
window.addEventListener('pointerup',()=>{jumpHeld=false;});
window.addEventListener('pointercancel',()=>{jumpHeld=false;});
window.addEventListener('contextmenu',e=>{ if(!isUI(e.target)) e.preventDefault(); });

$('btnStart').addEventListener('click',()=>{AudioFX.init();startGame();});
$('btnAgain').addEventListener('click',restart);
$('btnResume').addEventListener('click',resumeGame);
$('btnRestart').addEventListener('click',restart);
$('btnMenu').addEventListener('click',toMenu);
$('btnPause').addEventListener('click',togglePause);
$('btnSound').addEventListener('click',()=>{AudioFX.init();AudioFX.setMuted(!AudioFX.muted);});
$('btnSave').addEventListener('click',saveName);
window.addEventListener('resize',resize);
window.addEventListener('orientationchange',()=>setTimeout(resize,120));
document.addEventListener('visibilitychange',()=>{ if(document.hidden && mode==='playing') pauseGame(); });
window.addEventListener('blur',()=>{ jumpHeld=false; });

/* ------------------------------------------------------------ update */
function updateMenu(dt){
  speed=150; distance+=speed*dt; wheelAngle=distance/26;
  player.x=W*0.22;
  menuHopTimer-=dt;
  if(menuHopTimer<=0 && player.onGround){ player.vy=-690; player.onGround=false; player.squash=0.8; menuHopTimer=rand(2.8,4.2); }
  playerPhysics(dt);
  menuFishTimer-=dt;
  if(menuFishTimer<=0){ arcFish(W+60,randi(3,5),70,rand(150,205),Math.random()<0.25); menuFishTimer=rand(1.5,2.4); }
  for(let i=pickups.length-1;i>=0;i--){
    const f=pickups[i]; f.x-=speed*dt; f.phase+=dt*4;
    if(!f.taken && f.x<player.x+18){
      f.taken=true;
      burst('spark',f.x,f.y,6,{color:f.kind==='gold'?C.gold:'#bff0f5',min:50,max:160,g:300,lifeMax:.5});
    }
    if(f.x<-70||f.taken && f.x<player.x-40) pickups.splice(i,1);
  }
  pouchTarget=0.35+0.18*Math.sin(t*1.6);
  pouchFill+=(pouchTarget-pouchFill)*Math.min(1,dt*4);
  updateFX(dt);
  if(Math.random()<dt*7) burst('dust',player.x-40,groundY-2,1,{color:'#f0d3a4',min:20,max:60,g:150,drag:3,lifeMax:.4});
}
function updateOver(dt){
  player.crashRot=lerp(player.crashRot,-0.52,Math.min(1,dt*5));
  pouchFill+=(0-pouchFill)*Math.min(1,dt*3);
  updateFX(dt);
}
function updatePlaying(dt){
  elapsed+=dt;
  speed=Math.min(700,speed+5.2*dt);
  distance+=speed*dt; wheelAngle=distance/26;
  score+=speed*dt*0.10;
  displayScore+=(score-displayScore)*Math.min(1,dt*12);
  if(score>=nextMilestone){ milestone(); nextMilestone+=1000; }

  player.x=W*0.22;
  playerPhysics(dt);
  if(jumpBuffer>0){ jumpBuffer-=dt; if(player.onGround||player.coyote>0){ doJump(); jumpBuffer=0; } }
  player.invuln=Math.max(0,player.invuln-dt);
  if(combo>1){ comboTimer-=dt; if(comboTimer<=0) combo=1; }
  pouchTarget=clamp((combo-1)/7,0,1);
  pouchFill+=(pouchTarget-pouchFill)*Math.min(1,dt*5);

  spawnTimer-=dt;
  if(spawnTimer<=0) spawnPattern();

  const hb={x:player.x-30,y:player.y-150,w:66,h:132};
  for(let i=obstacles.length-1;i>=0;i--){
    const o=obstacles[i];
    o.x-=speed*dt; o.phase+=dt*3;
    if(o.air) o.y=o.baseY+Math.sin(o.phase*1.1)*8;
    else if(o.kind==='crab') o.y=o.baseY+Math.sin(o.phase*2.2)*2;
    const ox2=o.x+o.w, px2=hb.x+hb.w;
    if(o.x<px2 && ox2>hb.x){
      const gap=Math.max(0, o.y-(hb.y+hb.h), hb.y-(o.y+o.h));
      if(gap<o.minGap) o.minGap=gap;
      if(gap===0 && !o.hit) hurt(o);
      if(mode!=='playing') break;
    }
    if(ox2<hb.x && !o.passed){
      o.passed=true;
      if(!o.hit && o.minGap<26) nearMiss(o);
    }
    if(ox2<-90) obstacles.splice(i,1);
  }

  if(mode==='playing'){
    const cx=player.x+8, cy=player.y-110;
    for(let i=pickups.length-1;i>=0;i--){
      const f=pickups[i];
      f.x-=speed*dt; f.phase+=dt*4;
      const fy=f.y+Math.sin(f.phase)*5, rr=60+f.r;
      if(!f.taken && (f.x-cx)*(f.x-cx)+(fy-cy)*(fy-cy)<rr*rr) collect(f);
      if(f.x<-70||f.taken) pickups.splice(i,1);
    }
    if(player.onGround && Math.random()<dt*24)
      burst('dust',player.x-40,groundY-2,1,{color:'#f0d3a4',min:25,max:80,g:180,drag:3,lifeMax:.35});
  }
  updateFX(dt);
}
function update(dt){
  t+=dt;
  if(mode==='menu') updateMenu(dt);
  else if(mode==='over') updateOver(dt);
  else if(mode==='playing') updatePlaying(dt);
}

/* ------------------------------------------------------------ drawing primitives */
function rr(x,y,w,h,r){
  r=Math.min(r,w/2,h/2);
  ctx.beginPath(); ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}
function ell(x,y,rx,ry,fill,strokeC,lw,rot){
  ctx.beginPath(); ctx.ellipse(x,y,rx,ry,rot||0,0,TAU);
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(strokeC){ctx.strokeStyle=strokeC;ctx.lineWidth=lw||2;ctx.stroke();}
}
function circ(x,y,r,fill,strokeC,lw){ ell(x,y,r,r,fill,strokeC,lw); }
function line(x1,y1,x2,y2,col,w){
  ctx.strokeStyle=col; ctx.lineWidth=w; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
}
function poly(pts,fill,strokeC,lw){
  ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]);
  ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(strokeC){ctx.strokeStyle=strokeC;ctx.lineWidth=lw||2;ctx.lineJoin='round';ctx.stroke();}
}
function text(str,x,y,size,color,align,weight,outline){
  ctx.font=(weight||900)+' '+u(size)+'px "Trebuchet MS","Segoe UI",system-ui,sans-serif';
  ctx.textAlign=align||'left'; ctx.textBaseline='alphabetic';
  if(outline){ctx.lineWidth=u(4);ctx.strokeStyle=outline;ctx.lineJoin='round';ctx.strokeText(str,x,y);}
  ctx.fillStyle=color; ctx.fillText(str,x,y);
}

/* ------------------------------------------------------------ background */
function drawSky(){
  ctx.fillStyle='#26265c'; ctx.fillRect(-40,-40,W+80,H+80);
  ctx.fillStyle=skyGrad; ctx.fillRect(-40,-40,W+80,horizonY+90);
}
function drawStars(){
  if(lowQ) return;
  for(const s of stars){
    const y=s.cy*horizonY;
    const a=0.16+0.16*Math.sin(t*2+s.ph);
    if(a<=0) continue;
    ctx.fillStyle='rgba(255,246,225,'+a.toFixed(3)+')';
    ctx.fillRect(s.p*W,y,s.r,s.r);
  }
}
function drawSun(){
  const sx=W*0.73, sy=horizonY-205, r=78;
  ctx.drawImage(sunSprite,sx-175,sy-175,350,350);
  ctx.save();
  ctx.beginPath(); ctx.arc(sx,sy,r,0,TAU); ctx.clip();
  circ(sx,sy,r,'#ffe9ae');
  ctx.fillStyle='rgba(120,65,115,.26)';
  for(let i=0;i<6;i++) ctx.fillRect(sx-r,sy+10+i*14,r*2,3+i*1.5);
  ctx.restore();
  circ(sx,sy,r,null,'rgba(255,246,220,.55)',2);
}
function drawClouds(){
  for(const c of clouds){
    const span=W+440;
    const x=((c.p*span-distance*c.v)%span+span)%span-220;
    const y=c.cy*horizonY, s=c.s*(lowQ?0.85:1);
    ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.globalAlpha=c.a*0.7;
    ell(0,0,44,15,'rgba(255,236,222,.95)');
    ell(-27,-7,25,17,'rgba(255,236,222,.95)');
    ell(3,-14,31,21,'rgba(255,240,228,.95)');
    ell(33,-3,24,15,'rgba(255,236,222,.95)');
    ctx.globalAlpha=c.a*0.32;
    ell(2,11,48,7,'rgba(150,95,140,.6)');
    ctx.restore();
  }
}
function tileBlit(img,w,h,y,par){
  const off=(distance*par)%w;
  for(let x=-off;x<W+w;x+=w) ctx.drawImage(img,x,y,w,h);
}
function drawOcean(){
  ctx.fillStyle=oceanGrad; ctx.fillRect(0,horizonY,W,groundY-horizonY+2);
  ctx.fillStyle='rgba(255,220,150,.16)';
  const sx=W*0.73;
  for(let i=0;i<9;i++){
    const yy=horizonY+12+i*15;
    const ww=(34-i*2)+Math.sin(t*2+i)*8;
    ctx.fillRect(sx-ww/2+Math.sin(i*3+t)*14,yy,ww,2.2);
  }
  for(let k=0;k<3;k++){
    const yy=horizonY+28+k*46;
    ctx.strokeStyle='rgba(255,246,230,'+(0.10+k*0.045)+')'; ctx.lineWidth=2;
    ctx.beginPath();
    for(let x=0;x<=W+16;x+=16){
      const y=yy+Math.sin((x+distance*(0.24+k*0.1))*0.025+k)*3.4;
      if(x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
  }
  for(const b of boats){
    const span=W+200;
    const x=((b.p*span-distance*0.18)%span+span)%span-100;
    const y=horizonY+40+b.cy*80, s=b.s;
    ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
    poly([[-15,0],[15,0],[9,7],[-9,7]],'rgba(255,246,230,.85)');
    poly([[0,-24],[0,0],[13,0]],'rgba(255,201,120,.9)');
    ctx.restore();
  }
}
function drawSpeedLines(){
  if(lowQ||speed<400) return;
  const a=clamp((speed-400)/300,0,1)*0.26;
  ctx.strokeStyle='rgba(255,246,230,'+a.toFixed(3)+')'; ctx.lineWidth=1.6;
  const span=W+240;
  for(const s of speedLines){
    const x=((s.p*span-distance*1.25)%span+span)%span-120;
    const y=s.cy*horizonY;
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+34+s.len,y); ctx.stroke();
  }
}
function drawBoardwalk(){
  ctx.fillStyle=woodGrad; ctx.fillRect(0,groundY,W,H-groundY+2);
  const off=distance%46;
  ctx.lineWidth=2;
  for(let x=-off;x<W+46;x+=46){
    ctx.strokeStyle='rgba(76,42,22,.34)';
    ctx.beginPath(); ctx.moveTo(x,groundY); ctx.lineTo(x,H); ctx.stroke();
    ctx.fillStyle='rgba(60,32,16,.3)';
    circ(x+8,groundY+16,1.8,'rgba(60,32,16,.32)');
    circ(x+38,groundY+52,1.8,'rgba(60,32,16,.28)');
  }
  ctx.fillStyle='rgba(255,255,255,.07)'; ctx.fillRect(0,groundY+26,W,2);
  ctx.fillStyle='rgba(70,38,20,.28)'; ctx.fillRect(0,groundY+8,W,7);
  ctx.fillStyle='#ffe2ad'; ctx.fillRect(0,groundY-7,W,7);
  ctx.fillStyle='rgba(30,43,70,.5)'; ctx.fillRect(0,groundY-9,W,2);
}

/* ------------------------------------------------------------ entities art */
function drawPickup(f){
  const y=f.y+Math.sin(f.phase)*5;
  const gold=f.kind==='gold';
  ctx.save(); ctx.translate(f.x,y);
  ctx.globalAlpha=0.24;
  circ(0,0,gold?24:19,gold?'#ffd86b':'#b9eef4');
  ctx.globalAlpha=1;
  const body=gold?C.gold:C.silver, dark=gold?C.goldD:'#5fa6bb';
  poly([[-13,0],[-24,-9],[-22,0],[-24,9]],dark,C.ink,1.6);
  ell(1,0,15,8.5,body,C.ink,2);
  poly([[-2,-8],[5,-15],[9,-7]],dark,C.ink,1.5);
  circ(9,-2,2.2,C.white); circ(10,-2,1.2,C.ink);
  ctx.strokeStyle='rgba(255,255,255,.75)'; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.moveTo(-6,-4); ctx.lineTo(4,-5); ctx.stroke();
  if(gold){
    ctx.fillStyle='#fff8d8';
    for(let i=0;i<4;i++){
      const a=f.phase*1.4+i*TAU/4;
      const px=Math.cos(a)*22, py=Math.sin(a)*16;
      poly([[px,py-4],[px+1.5,py-1],[px+4,py],[px+1.5,py+1],[px,py+4],[px-1.5,py+1],[px-4,py],[px-1.5,py-1]],'#fff8d8');
    }
  }
  ctx.restore();
}
function drawObstacle(o){
  ctx.save(); ctx.translate(o.x+o.w/2,o.y+o.h/2);
  const k=o.kind;
  if(k==='crab'){
    const bob=Math.sin(o.phase*2.2)*2;
    ctx.translate(0,bob);
    for(let i=-1;i<=1;i++){
      line(i*11,6,i*16-3,15,'#c9432f',3);
      line(i*11,6,i*16+3,15,'#c9432f',3);
    }
    ell(0,0,22,13,'#ff6a4a',C.ink,2.4);
    ell(-6,-3,9,4,'rgba(255,255,255,.28)');
    line(-18,-6,-25,-16,'#ff6a4a',4); line(18,-6,25,-16,'#ff6a4a',4);
    poly([[-30,-19],[-21,-22],[-25,-13],[-33,-13]],'#ff8062',C.ink,2);
    poly([[30,-19],[21,-22],[25,-13],[33,-13]],'#ff8062',C.ink,2);
    line(-8,-11,-9,-21,'#ff6a4a',3); line(8,-11,9,-21,'#ff6a4a',3);
    circ(-9,-23,3.6,C.white,C.ink,1.5); circ(9,-23,3.6,C.white,C.ink,1.5);
    circ(-8.4,-23,1.7,C.ink); circ(9.6,-23,1.7,C.ink);
    ctx.strokeStyle=C.ink; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(0,4,7,0.15*Math.PI,0.85*Math.PI); ctx.stroke();
  } else if(k==='crate'){
    ctx.translate(0,0);
    rr(-o.w/2,-o.h/2,o.w,o.h,5); ctx.fillStyle='#c68748'; ctx.fill();
    ctx.strokeStyle=C.ink; ctx.lineWidth=3; ctx.stroke();
    ctx.strokeStyle='rgba(88,48,22,.6)'; ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(-o.w/2+3,-o.h/2+5); ctx.lineTo(o.w/2-3,o.h/2-5);
    ctx.moveTo(o.w/2-3,-o.h/2+5); ctx.lineTo(-o.w/2+3,o.h/2-5);
    ctx.stroke();
    ctx.fillStyle='rgba(255,232,190,.75)';
    ctx.fillRect(-13,-9,26,16);
    text('F',0,5,13,C.ink,'center',900);
    circ(-o.w/2+5,-o.h/2+5,2,'#5c3318'); circ(o.w/2-5,-o.h/2+5,2,'#5c3318');
  } else if(k==='buoy'){
    rr(-13,-o.h/2,26,o.h,9); ctx.fillStyle='#fff1d8'; ctx.fill();
    ctx.strokeStyle=C.ink; ctx.lineWidth=3; ctx.stroke();
    ctx.save();
    rr(-13,-o.h/2,26,o.h,9); ctx.clip();
    ctx.fillStyle=C.coral;
    for(let i=0;i<5;i++) ctx.fillRect(-14,-o.h/2+8+i*19,28,10);
    ctx.restore();
    circ(0,-o.h/2+2,9,C.gold,C.ink,2.5);
    ctx.strokeStyle='rgba(40,30,50,.5)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(0,o.h/2-4,19,0.1*Math.PI,0.9*Math.PI); ctx.stroke();
  } else if(k==='gull'){
    const flap=Math.sin(o.phase*4)*8;
    ctx.save();
    poly([[-4,-2],[-34,-14-flap],[-20,4],[-4,6]],'#e7eef2',C.ink,2);
    poly([[4,-2],[34,-14+flap],[20,4],[4,6]],'#eef4f6',C.ink,2);
    ctx.restore();
    ell(0,0,21,11,C.white,C.ink,2.2);
    ell(-4,-4,9,4,'rgba(160,180,195,.5)');
    poly([[18,-3],[31,0],[18,3]],C.gold,C.ink,1.8);
    circ(10,-4,3.3,C.white,C.ink,1.3); circ(11,-4,1.7,C.ink);
    ctx.strokeStyle=C.ink; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(5,-8); ctx.lineTo(14,-6); ctx.stroke();
  }
  ctx.restore();
}

/* ------------------------------------------------------------ the pelican + bike */
function wheel(cx,cy,r){
  ctx.strokeStyle=C.navy; ctx.lineWidth=6;
  ctx.beginPath(); ctx.arc(cx,cy,r,0,TAU); ctx.stroke();
  ctx.strokeStyle='#f7e7c7'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(cx,cy,r-5,0,TAU); ctx.stroke();
  for(let i=0;i<7;i++){
    const a=wheelAngle+i*TAU/7;
    line(cx,cy,cx+Math.cos(a)*(r-6),cy+Math.sin(a)*(r-6),'rgba(38,50,79,.5)',1.3);
  }
  circ(cx,cy,4.5,C.coral,C.ink,1.5);
}
function drawPlayerShadow(){
  const h=clamp(groundY-player.y,0,430);
  const a=clamp(0.28-h/900,0.05,0.28);
  ctx.save(); ctx.globalAlpha=a;
  ell(player.x+2,groundY+2,46-h*0.035,9-h*0.008,'#2a1c30');
  ctx.restore();
}
function drawPlayer(){
  const p=player;
  drawPlayerShadow();
  ctx.save();
  ctx.translate(p.x,p.y+(p.crashed?8:0));
  ctx.translate(0,-42);
  ctx.rotate((p.onGround?0:clamp(p.vy/4200,-0.16,0.16))+(p.crashed?p.crashRot:0));
  ctx.translate(0,42);
  const sx=1-p.squash*0.15, sy=1+p.squash*0.15;
  ctx.scale(sx,sy);
  if(p.invuln>0 && Math.floor(p.invuln*13)%2===0) ctx.globalAlpha=0.45;
  ctx.lineJoin='round'; ctx.lineCap='round';

  const rw=[-38,-26], fw=[40,-26], bb=[0,-30], st=[-16,-78], ht=[30,-74];
  wheel(rw[0],rw[1],26); wheel(fw[0],fw[1],26);

  // frame
  const F=(a,b)=>line(a[0],a[1],b[0],b[1],C.teal,7);
  F(rw,bb); F(bb,st); F(st,rw); F(bb,ht); F(ht,fw); F(st,ht);
  line(rw[0],rw[1],bb[0],bb[1],'rgba(38,50,79,.55)',1.6);
  line(rw[0],rw[1]+4,bb[0],bb[1]+4,'rgba(38,50,79,.55)',1.6);
  circ(bb[0],bb[1],10,'#ffe1a6',C.navy,2.5);
  circ(bb[0],bb[1],3.5,C.navy);
  // handlebars
  line(ht[0],ht[1],34,-92,C.navy,5);
  line(34,-92,17,-96,C.navy,5);
  line(17,-96,13,-95,C.coral,6);
  // saddle
  ctx.save(); ctx.translate(st[0],st[1]-3); ctx.rotate(-0.12);
  rr(-16,-4,32,8,4); ctx.fillStyle=C.navy; ctx.fill(); ctx.restore();
  // small teal front basket, visibly bolted to the bars
  line(32,-80,44,-78,C.navy,3);
  rr(40,-88,20,17,4); ctx.fillStyle=C.teal; ctx.fill();
  ctx.strokeStyle=C.navy; ctx.lineWidth=2.2; ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.lineWidth=1.2;
  for(let i=0;i<2;i++){
    ctx.beginPath(); ctx.moveTo(43+i*8,-87); ctx.lineTo(43+i*8,-72); ctx.stroke();
  }

  // scarf trailing behind
  const sw=Math.sin(t*11)*4*(0.4+speed/700);
  ctx.strokeStyle=C.coral; ctx.lineWidth=8;
  ctx.beginPath(); ctx.moveTo(4,-138);
  ctx.quadraticCurveTo(-18,-134+sw,-38,-144-sw);
  ctx.quadraticCurveTo(-54,-150+sw,-66,-140-sw);
  ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(4,-141); ctx.quadraticCurveTo(-18,-137+sw,-36,-147-sw); ctx.stroke();

  // legs pedalling
  const crank=wheelAngle*1.5;
  const ped=(sgn)=>[bb[0]+Math.cos(crank+sgn*Math.PI)*13, bb[1]+Math.sin(crank+sgn*Math.PI)*13];
  for(const sgn of [0,1]){
    const q=ped(sgn);
    const hipx=-4+sgn*7, hipy=-100;
    const kneex=(hipx+q[0])/2-9, kneey=(hipy+q[1])/2-3;
    line(hipx,hipy,kneex,kneey,'#f0a83c',6);
    line(kneex,kneey,q[0],q[1],'#f0a83c',6);
    ell(q[0]+3,q[1]+1,8,3.4,'#ff9a3c',C.ink,1.6,0.2);
    line(bb[0],bb[1],q[0],q[1],C.navy,2.5);
  }

  // body
  const bob=p.onGround?Math.sin(wheelAngle*2)*1.6:0;
  ctx.save(); ctx.translate(0,bob);
  poly([[-32,-122],[-58,-136],[-52,-116],[-62,-108],[-34,-104]],C.cream2,C.ink,2.4);
  ell(-6,-116,36,28,C.cream,C.ink,2.8);
  ell(-12,-106,22,13,'rgba(255,220,180,.35)');
  // wing
  ctx.save(); ctx.translate(-16,-120); ctx.rotate(-0.75*p.flap);
  ctx.beginPath();
  ctx.moveTo(4,-10); ctx.quadraticCurveTo(26,4,10,20);
  ctx.quadraticCurveTo(-8,20,-14,4); ctx.quadraticCurveTo(-10,-6,4,-10);
  ctx.closePath(); ctx.fillStyle=C.cream2; ctx.fill();
  ctx.strokeStyle=C.ink; ctx.lineWidth=2.2; ctx.stroke();
  ctx.strokeStyle='rgba(120,95,80,.4)'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(-4,3); ctx.quadraticCurveTo(6,10,10,16); ctx.stroke();
  ctx.restore();
  // neck (outline + fill)
  ctx.lineCap='round';
  ctx.strokeStyle=C.ink; ctx.lineWidth=27;
  ctx.beginPath(); ctx.moveTo(4,-130); ctx.quadraticCurveTo(6,-156,20,-166); ctx.stroke();
  ctx.strokeStyle=C.cream; ctx.lineWidth=22;
  ctx.beginPath(); ctx.moveTo(4,-130); ctx.quadraticCurveTo(6,-156,20,-166); ctx.stroke();
  // head
  circ(22,-172,19,C.cream,C.ink,2.8);
  // cap
  ctx.beginPath(); ctx.arc(21,-178,19,Math.PI*1.06,Math.PI*1.94);
  ctx.lineTo(40,-178); ctx.closePath();
  ctx.fillStyle=C.teal; ctx.fill(); ctx.strokeStyle=C.ink; ctx.lineWidth=2.4; ctx.stroke();
  poly([[36,-180],[51,-177],[36,-173]],C.tealD,C.ink,2);
  ctx.strokeStyle=C.coral; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(8,-186); ctx.quadraticCurveTo(21,-195,34,-187); ctx.stroke();
  // eye
  if(p.crashed){
    line(25,-179,33,-171,C.ink,2.6); line(33,-179,25,-171,C.ink,2.6);
  }else{
    circ(29,-176,5.6,C.white,C.ink,1.6);
    circ(30.4,-176,2.9,C.ink);
    circ(31.6,-177.6,1.1,C.white);
    ctx.strokeStyle=C.ink; ctx.lineWidth=1.8;
    ctx.beginPath(); ctx.moveTo(24,-185); ctx.lineTo(33,-183); ctx.stroke();
  }
  // beak + pouch
  const bulge=16+24*pouchFill;
  poly([[34,-170],[94,-165],[34,-159]],C.gold,C.ink,2.6);
  ctx.beginPath(); ctx.moveTo(34,-159);
  ctx.quadraticCurveTo(58,-159+bulge,88,-163);
  ctx.lineTo(34,-159); ctx.closePath();
  ctx.fillStyle=C.coral; ctx.fill(); ctx.strokeStyle=C.ink; ctx.lineWidth=2.6; ctx.stroke();
  line(36,-165,88,-164,'rgba(255,255,255,.5)',2);
  if(pouchFill>0.55){
    poly([[52,-154],[62,-164],[60,-150]],C.silver,C.ink,1.4);
    poly([[66,-152],[76,-161],[74,-148]],'#bff0f5',C.ink,1.4);
  }
  ctx.restore();
  ctx.restore();
}

/* ------------------------------------------------------------ fx + hud */
function drawParticles(){
  for(const q of particles){
    const a=clamp(q.life/q.max,0,1);
    ctx.save(); ctx.globalAlpha=a;
    switch(q.kind){
      case 'ring':
        ctx.strokeStyle=q.color; ctx.lineWidth=3*a+0.5;
        ctx.beginPath(); ctx.arc(q.x,q.y,q.r,0,TAU); ctx.stroke(); break;
      case 'feather':
        ctx.translate(q.x,q.y); ctx.rotate(q.rot);
        ell(0,0,q.size*0.55,q.size*1.5,q.color,'rgba(30,43,70,.35)',1);
        break;
      case 'dust':
        circ(q.x,q.y,q.size*(1.4-a*0.5),q.color); break;
      case 'star':
        ctx.translate(q.x,q.y); ctx.rotate(q.rot);
        poly([[0,-q.size*1.7],[q.size*.45,-q.size*.45],[q.size*1.7,0],
              [q.size*.45,q.size*.45],[0,q.size*1.7],[-q.size*.45,q.size*.45],
              [-q.size*1.7,0],[-q.size*.45,-q.size*.45]],q.color);
        break;
      case 'confetti':
        ctx.translate(q.x,q.y); ctx.rotate(q.rot);
        ctx.fillStyle=q.color; ctx.fillRect(-q.size*0.7,-q.size*0.35,q.size*1.6,q.size*0.8);
        break;
      default:
        ctx.fillStyle=q.color;
        ctx.fillRect(q.x-q.size/2,q.y-q.size/2,q.size,q.size);
    }
    ctx.restore();
  }
}
function drawPopups(){
  for(const p of popups){
    const a=clamp(p.life/p.max,0,1);
    ctx.save(); ctx.globalAlpha=a;
    ctx.translate(p.x,p.y);
    const s=0.6+0.4*p.sc+0.12*(1-a);
    ctx.scale(s,s);
    text(p.txt,0,0,p.size,p.color,'center',900,'rgba(30,30,60,.9)');
    ctx.restore();
  }
}
function heart(x,y,s,fill){
  ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
  ctx.beginPath(); ctx.moveTo(0,6);
  ctx.bezierCurveTo(-12,-2,-11,-12,-3,-9);
  ctx.bezierCurveTo(-1,-8,0,-6,0,-6);
  ctx.bezierCurveTo(0,-6,1,-8,3,-9);
  ctx.bezierCurveTo(11,-12,12,-2,0,6);
  ctx.closePath();
  ctx.fillStyle=fill; ctx.fill();
  ctx.strokeStyle=C.ink; ctx.lineWidth=1.8; ctx.stroke();
  ctx.restore();
}
function drawHUD(){
  const m=u(16);
  rr(m,m,u(198),u(66),u(16));
  ctx.fillStyle='rgba(255,246,230,.92)'; ctx.fill();
  ctx.strokeStyle='rgba(30,43,70,.22)'; ctx.lineWidth=u(2); ctx.stroke();
  text('SCORE',m+u(15),m+u(21),11,'rgba(30,43,70,.6)','left',900);
  ctx.save();
  ctx.translate(m+u(14),m+u(55));
  const sc=1+scorePop*0.14; ctx.scale(sc,sc);
  text(Math.floor(displayScore).toLocaleString(),0,0,32,C.ink,'left',900);
  ctx.restore();
  rr(m,m+u(72),u(126),u(20),u(8));
  ctx.fillStyle='rgba(30,43,70,.78)'; ctx.fill();
  text('BEST '+Math.max(bestScore(),finalScore).toLocaleString(),m+u(9),m+u(86),10,C.cream,'left',900);

  // hearts
  for(let i=0;i<3;i++){
    const hx=W-u(30)-i*u(34), hy=m+u(14);
    heart(hx,hy,u(0.95),i<player.hp?C.coral:'rgba(255,246,230,.28)');
  }

  // combo
  if(combo>=2){
    const cw=u(146), ch=u(38);
    const narrow=cssW<620;
    const cx=narrow ? W-u(16)-cw : W/2-cw/2;
    const cy=narrow ? m+u(46) : m;
    rr(cx,cy,cw,ch,u(12));
    ctx.fillStyle='rgba(30,43,70,.86)'; ctx.fill();
    text('x'+combo+' COMBO',cx+cw/2,cy+u(24),16,C.gold,'center',900);
    const bw=cw-u(14);
    rr(cx+u(7),cy+ch-u(8),bw,u(4),u(2)); ctx.fillStyle='rgba(255,255,255,.2)'; ctx.fill();
    rr(cx+u(7),cy+ch-u(8),bw*clamp(comboTimer/2.8,0,1),u(4),u(2));
    ctx.fillStyle=C.coral; ctx.fill();
  }

  // hint (fades out)
  if(elapsed<7){
    const narrow=cssW<620;
    const hint=narrow ? 'TAP = HOP    ·    TAP AGAIN = FLAP'
                      : 'SPACE / TAP = HOP    ·    AGAIN = WING FLAP    ·    P = PAUSE';
    ctx.save(); ctx.globalAlpha=clamp((7-elapsed)/2,0,1)*0.85;
    text(hint,u(18),H-u(18),narrow?10:12,C.cream,'left',900,'rgba(30,30,60,.8)');
    ctx.restore();
  }
}
function drawOverlays(){
  ctx.fillStyle=vignetteGrad; ctx.fillRect(0,0,W,H);
  if(flash>0){
    ctx.fillStyle='rgba('+flashRGB+','+(flash*0.55).toFixed(3)+')';
    ctx.fillRect(0,0,W,H);
  }
}

/* ------------------------------------------------------------ render */
function render(){
  ctx.setTransform(dpr*scale,0,0,dpr*scale,0,0);
  drawSky();
  ctx.save();
  if(shake>0.15) ctx.translate(rand(-shake,shake),rand(-shake,shake)*0.7);
  drawStars();
  drawSun();
  drawClouds();
  tileBlit(islandTile,1400,240,horizonY-230,0.12);
  drawOcean();
  tileBlit(palmTile,1200,280,groundY-270,0.42);
  drawSpeedLines();
  drawBoardwalk();
  for(const f of pickups) if(!f.taken) drawPickup(f);
  for(const o of obstacles) drawObstacle(o);
  drawPlayer();
  drawParticles();
  drawPopups();
  ctx.restore();
  drawOverlays();
  if(mode==='playing'||mode==='paused') drawHUD();
}

/* ------------------------------------------------------------ main loop */
let last=performance.now();
function frame(now){
  const raw=(now-last)/1000; last=now;
  const dt=Math.min(raw>0?raw:0.016,1/30);
  frameAvg=frameAvg*0.95+Math.min(raw*1000,100)*0.05;
  if(frameAvg>24) lowQ=true; else if(frameAvg<18.5) lowQ=false;
  if(hitStop>0) hitStop-=dt;
  else update(dt);
  render();
  requestAnimationFrame(frame);
}

/* ------------------------------------------------------------ boot */
buildSun(); buildTiles();
renderMenuHighs();
$('btnSound').classList.toggle('muted',AudioFX.muted);
$('btnSound').title=AudioFX.muted?'Unmute (M)':'Mute (M)';
resize();
player.y=groundY;
showScreen('menu');
requestAnimationFrame(frame);
})();
