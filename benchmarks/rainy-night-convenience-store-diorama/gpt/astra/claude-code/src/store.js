import * as THREE from 'three';
import { C, box, cylinder, group, rod, torus, tube, label, plane, material, canvasTexture, light, halo } from './kit.js';

function shopSign() {
  return canvasTexture(2048, 256, (ctx, w, h) => {
    ctx.fillStyle = '#eee6cb'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#247c78'; ctx.fillRect(0, 0, w, 19); ctx.fillRect(0, h - 28, w, 28);
    ctx.fillStyle = '#df9155'; ctx.fillRect(0, h - 40, w, 9);
    ctx.save(); ctx.translate(170, 113);
    ctx.strokeStyle = '#2e7d78'; ctx.fillStyle = '#2e7d78'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 4, 67, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, 65); ctx.quadraticCurveTo(0, 92, -23, 83); ctx.stroke();
    ctx.strokeStyle = '#e5a24f'; [[-47,-89],[4,-100],[49,-88]].forEach(([x,y]) => {ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-4,y+17);ctx.stroke();});
    ctx.restore();
    ctx.fillStyle = '#255853'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = '800 130px "Hiragino Kaku Gothic ProN", sans-serif'; ctx.fillText('雨宿り', 320, 124);
    ctx.font = '500 24px sans-serif'; ctx.letterSpacing = '8px'; ctx.fillText('AMAYADORI', 344, 208); ctx.letterSpacing = '0px';
    ctx.fillStyle = '#63837a'; ctx.font = '600 31px "Hiragino Kaku Gothic ProN", sans-serif'; ctx.fillText('あなたの街の、あかり。', 850, 118);
    ctx.fillStyle = '#2c7b75'; ctx.fillRect(1640, 18, 407, 199);
    ctx.fillStyle = '#f6e8c4'; ctx.textAlign = 'center'; ctx.font = '700 94px sans-serif'; ctx.fillText('24', 1840, 102);
    ctx.font = '600 28px sans-serif'; ctx.letterSpacing = '6px'; ctx.fillText('HOURS', 1840, 174);
  });
}
function foodPoster() {
  return canvasTexture(384, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f3e4be'; ctx.fillRect(0,0,w,h);
    ctx.fillStyle = '#bf654f'; ctx.fillRect(0,0,w,72);
    ctx.fillStyle = '#fff3d9'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ほっと、一息。',w/2,50);
    ctx.fillStyle = '#dc9f54'; ctx.beginPath();ctx.arc(w/2,244,125,0,7);ctx.fill();
    ctx.fillStyle = '#f7f0d7'; ctx.beginPath();ctx.moveTo(192,145);ctx.quadraticCurveTo(167,134,91,300);ctx.quadraticCurveTo(192,339,288,296);ctx.quadraticCurveTo(239,185,192,145);ctx.fill();
    ctx.fillStyle = '#314b42'; ctx.fillRect(161,248,68,81);
    ctx.fillStyle = '#45564b';ctx.font = 'bold 37px sans-serif';ctx.fillText('手づくり おにぎり',w/2,402);
    ctx.fillStyle = '#b25946';ctx.font = 'bold 45px sans-serif';ctx.fillText('¥ 128',w/2,465);
  });
}
export function buildStore(parent) {
  const shell = group(parent);
  const trim = material('#304d55'), concrete = '#b5bbab', mint = '#3c8580';
  box(shell, [-.28,.40,-1.94], [7.48,.16,5.48], '#bdc6b5', { bevel:.04, outline:true });
  box(shell, [-3.94,2.18,-1.98], [.22,3.37,5.6], concrete, { outline:true });
  box(shell, [-.27,2.18,-4.7], [7.5,3.37,.18], '#a3b0a7', { outline:true });
  // Exposed exterior masonry courses on the narrow alley wall.
  for(let y=.76;y<3.3;y+=.31) {
    box(shell,[-4.058,y,-1.96],[.008,.012,5.3],'#849a95');
    for(let z=-4.45;z<.5;z+=.8) box(shell,[-4.062,y+.145,z+(Math.round(y*3)%2)*.38],[.008,.29,.009],'#91a59c');
  }
  for(const x of [-3.86,-1.5,.2,3.3]) box(shell,[x,1.94,.77],[.09,2.74,.13],trim,{outline:true});
  for(const z of [.72,-1.05,-2.85,-4.58]) box(shell,[3.36,1.94,z],[.13,2.74,.09],trim,{outline:true});
  box(shell,[-.27,.64,.77],[7.3,.22,.16],'#70877f',{outline:true});
  box(shell,[3.36,.68,-1.96],[.16,.30,5.5],'#70877f',{outline:true});
  box(shell,[-.27,3.23,.77],[7.3,.13,.18],trim);
  box(shell,[3.36,3.23,-1.96],[.17,.13,5.48],trim);
  const glass = new THREE.MeshStandardMaterial({ color:'#bde4d3', transparent:true, opacity:.075, roughness:.12, metalness:.1, depthWrite:false, side:THREE.DoubleSide });
  plane(shell,[-2.69,1.94,.793],[2.23,2.47],glass);
  plane(shell,[1.76,1.94,.793],[2.96,2.47],glass);
  plane(shell,[3.383,1.94,-1.94],[5.28,2.48],glass,[0,Math.PI/2,0]);
  // Glazing safety stripes: deliberately narrow, so the shop remains completely legible.
  for(const [x,w] of [[-2.68,2.23],[1.76,2.94]]) {
    box(shell,[x,1.33,.81],[w,.045,.014],'#80b8a2',{emissive:'#5c9980',intensity:.12});
    box(shell,[x,1.265,.812],[w,.018,.014],'#daa568');
  }
  box(shell,[3.396,1.33,-1.94],[.013,.045,5.29],'#80b8a2');
  box(shell,[3.399,1.265,-1.94],[.013,.018,5.29],'#daa568');
  // The two independently sliding door leaves, complete with rails and handles.
  const doors=[];
  for(const side of [-1,1]) {
    const leaf=group(shell,[-.65+side*.384,0,.835]); leaf.userData.dynamic=true;
    const w=.75;
    plane(leaf,[0,1.84,0],[w,2.5],glass);
    for(const x of [-w/2,w/2]) box(leaf,[x,1.84,0],[.035,2.55,.045],'#9eb3ae');
    for(const y of [.58,3.1]) box(leaf,[0,y,0],[w,.052,.05],'#92a8a3');
    box(leaf,[0,1.32,.03],[w,.055,.018],mint);
    box(leaf,[-side*.27,1.65,.049],[.032,.36,.065],'#dae1cc');
    label(leaf,'自動',[0,1.25,.041],[.25,.12],{bg:'#f0e7ce',color:'#53685d'});
    doors.push({leaf,home:leaf.position.x,side});
  }
  box(shell,[-.65,3.16,.86],[1.72,.14,.18],trim,{outline:true});
  box(shell,[-.65,3.17,.967],[.12,.04,.016],'#152b33');
  box(shell,[-.65,.555,.88],[1.66,.016,.23],'#9aaba6');
  for(let i=0;i<3;i++) box(shell,[-.65,.566,.80+i*.06],[1.63,.008,.008],'#647973');
  // A restrained vintage lightbox. All typography belongs to physical signage.
  box(shell,[-.27,3.64,.85],[7.7,.79,.34],'#234c50',{bevel:.035,outline:true});
  const signMap=shopSign();
  const signMat=new THREE.MeshStandardMaterial({map:signMap,color:'#667a70',emissiveMap:signMap,emissive:'#fff1c9',emissiveIntensity:.88,roughness:.8});
  plane(shell,[-.27,3.65,1.027],[7.48,.68],signMat);
  box(shell,[3.38,3.64,-1.98],[.3,.79,5.75],'#2d6160',{bevel:.025,outline:true});
  label(shell,'雨宿り  /  AMAYADORI',[3.538,3.68,-1.95],[5.51,.57],{bg:'#dddcc0',color:'#286d66',emissive:.72,rotation:[0,Math.PI/2,0]});
  box(shell,[3.544,3.38,-1.95],[.009,.055,5.51],'#db9760',{emissive:'#c68c52',intensity:.3});
  // A shallow, ribbed rain canopy with brass-edged gutter and warm underside.
  box(shell,[-.3,3.205,1.10],[7.93,.11,.89],'#416c6b',{outline:true});
  for(let x=-4.13;x<3.6;x+=.28) box(shell,[x,3.268,1.1],[.026,.03,.85],'#5c8580');
  box(shell,[-.3,3.2,1.55],[7.94,.15,.07],'#274c50',{outline:true});
  box(shell,[-.3,3.147,1.591],[7.92,.032,.012],'#d6a866');
  for(const x of [-2.55,.65,2.72]) box(shell,[x,3.128,1.2],[1.32,.027,.105],'#ffe9bc',{emissive:'#ffe2aa',intensity:1.7});
  light(shell,[-1.7,2.9,1.4],'#ffce83',15,5);
  light(shell,[2.7,2.7,.85],'#ffcf8d',12,4.7);
  // Roof: low parapet, waterproof seams, three small service installations.
  box(shell,[-.3,4.064,-1.97],[7.94,.22,5.88],'#517172',{bevel:.045,outline:true});
  box(shell,[-.3,4.18,-1.97],[7.59,.065,5.54],'#466367');
  for(const x of [-4.19,3.58]) box(shell,[x,4.27,-1.97],[.15,.24,5.86],'#688782',{outline:true});
  for(const z of [-4.84,.89]) box(shell,[-.3,4.27,z],[7.94,.24,.14],'#73918b',{outline:true});
  for(const x of [-4.19,3.58]) box(shell,[x,4.402,-1.97],[.22,.04,5.97],'#94a9a0',{outline:true});
  for(const z of [-4.84,.89]) box(shell,[-.3,4.402,z],[7.94,.04,.22],'#94a9a0',{outline:true});
  for(let x=-3.8;x<3.5;x+=.56) box(shell,[x,4.219,-1.96],[.018,.011,5.48],'#597777');
  for(const z of [-3.13,-1.35]) box(shell,[-.3,4.222,z],[7.56,.008,.014],'#354f56');
  for(const [x,z] of [[-2.7,-3.25],[-.9,-3.25]]) {
    for(const dx of [-.43,.43]) box(shell,[x+dx,4.28,z],[.1,.13,.76],'#344e55');
    box(shell,[x,4.61,z],[1.33,.58,.85],'#b4bfb0',{bevel:.045,outline:true});
    box(shell,[x,4.68,z+.435],[1.13,.37,.024],'#445d61');
    for(let yy=4.53;yy<4.86;yy+=.048) box(shell,[x,yy,z+.454],[1.1,.013,.025],'#83938a');
    cylinder(shell,[x,4.916,z],.29,.29,.025,'#28464d',{segments:24});
    for(let r=.09;r<.31;r+=.065) torus(shell,[x,4.937,z],r,.011,'#849c93',{rotation:[Math.PI/2,0,0]});
    for(let k=0;k<6;k++) {
      const a=k*Math.PI/3;rod(shell,[x,4.947,z],[x+Math.cos(a)*.29,4.947,z+Math.sin(a)*.29],.009,'#82988e');
    }
  }
  tube(shell,[[-2.7,4.43,-3.7],[-2.7,4.31,-4.4],[-3.5,4.29,-4.4],[-3.55,3.8,-4.55]],.045,'#c5bea5');
  box(shell,[1.85,4.28,-3.46],[1.03,.13,.86],'#344f59',{outline:true});
  cylinder(shell,[1.85,4.57,-3.46],.28,.34,.51,'#879b95',{segments:12,outline:true});
  cylinder(shell,[1.85,4.86,-3.46],.43,.36,.13,'#b2bca7',{segments:12,outline:true});
  box(shell,[1.68,4.245,-.73],[1.4,.045,1.28],'#334b54',{outline:true});
  box(shell,[1.68,4.28,-.73],[1.18,.034,1.05],'#577478',{outline:true});
  for(let x=1.21;x<2.23;x+=.24) box(shell,[x,4.305,-.73],[.025,.022,1.05],'#90a099');
  // Downpipes, junction boxes and exterior air-conditioning condenser.
  for(const [x,z] of [[-4.13,.45],[3.51,-4.59]]) {
    tube(shell,[[x,4.25,z],[x,3.92,z+.13],[x,1,z+.13],[x,.59,z+.32]],.045,'#496664');
    for(const y of [1.0,2.0,3.0]) box(shell,[x,y,z+.14],[.14,.052,.13],'#94a69b');
  }
  box(shell,[-4.11,1.3,-3.16],[.34,.68,1.1],'#bcc6b5',{bevel:.05,outline:true});
  cylinder(shell,[-4.302,1.3,-3.16],.245,.245,.027,'#314e55',{rotation:[0,0,Math.PI/2],segments:24});
  for(let r=.07;r<.25;r+=.053) torus(shell,[-4.323,1.3,-3.16],r,.01,'#97aaa0',{rotation:[0,Math.PI/2,0]});
  box(shell,[-4.082,2.62,-3.23],[.1,.37,.28],'#708b80',{outline:true});
  tube(shell,[[-4.08,2.45,-3.23],[-4.09,2.05,-3.23],[-4.1,1.7,-3.4]],.022,'#b5b49b');
  // A cafe poster and a real bulletin board beside the vending machine.
  const posterMap=foodPoster();
  plane(shell,[2.66,2.47,.816],[.49,.69],new THREE.MeshStandardMaterial({map:posterMap,roughness:1,emissive:'#e8b983',emissiveIntensity:.14}));
  box(shell,[-4.077,2.46,-.66],[.065,.84,.84],'#485e56',{outline:true});
  label(shell,'雨の日も、\nおかえりなさい。',[-4.116,2.45,-.65],[.71,.70],{bg:'#d9bc8e',color:'#4b5b51',rotation:[0,-Math.PI/2,0]});
  label(shell,'いらっしゃいませ',[-.65,.427,1.26],[1.64,.6],{bg:'#345955',color:'#b5c4a8',rotation:[-Math.PI/2,0,0]});
  label(shell,'OPEN\n24 HOURS',[-1.23,2.17,.858],[.29,.32],{bg:'#365c55',color:'#ead6aa',emissive:.35});
  halo(shell,[-1,3.65,1.06],'#ffe2a0',3,.065);
  return {
    update(t) {
      const cycle = t % 22;
      const open = cycle > 9 && cycle < 15 ? Math.min(1,(cycle-9)/1.4,(15-cycle)/1.4) : 0;
      const smooth = open * open * (3-2*open);
      doors.forEach(({leaf,home,side}) => {leaf.position.x=home+side*smooth*.66;});
      signMat.emissiveIntensity=.86 + Math.sin(t*1.8)*.012 - (Math.sin(t*2.7)>.997?.065:0);
    },
    doors,
  };
}
