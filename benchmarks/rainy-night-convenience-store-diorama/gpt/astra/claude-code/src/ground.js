import * as THREE from 'three';
import { WetReflection } from './reflection.js';
import { box, cylinder, torus, plane, material, canvasTexture, label, rng, group, rod } from './kit.js';

const wetShader = {
  uniforms: {
    color:{value:new THREE.Color('#314856')},
    tDiffuse:{value:null}, textureMatrix:{value:new THREE.Matrix4()}, time:{value:0},
  },
  vertexShader: `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec2 vSurface;
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vSurface = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec3 color;
    uniform float time;
    varying vec4 vUv;
    varying vec2 vSurface;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
    }
    void main() {
      vec2 st = vSurface;
      float n = noise(st*10.)*.6 + noise(st*23.)*.3 + noise(st*51.)*.1;
      float puddle = smoothstep(.36,.67,n);
      vec4 uv = vUv;
      uv.x += (sin(st.y*180.+time*1.4)*.00065 + noise(st*105.+time*.12)*.0013)*uv.w;
      uv.y += (sin(st.x*146.-time*1.9)*.00045)*uv.w;
      vec3 reflected = texture2DProj(tDiffuse,uv).rgb;
      float grain = hash(st*1800.)*.015;
      vec3 asphalt = vec3(.027,.049,.076) + n*.025 + grain;
      float fresnel = .19 + puddle*.49;
      vec3 col = mix(asphalt, reflected*vec3(.74,.88,.96), fresnel);
      gl_FragColor = vec4(col,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

function asphaltPaint() {
  return canvasTexture(512,512,(ctx,w,h)=>{
    ctx.fillStyle='#cad9ca';ctx.fillRect(0,0,w,h);
    const random=rng(177);
    for(let i=0;i<2800;i++) {
      ctx.fillStyle=`rgba(43,65,73,${random()*.25})`;
      const s=random()*3+1;ctx.fillRect(random()*w,random()*h,s,s);
    }
  });
}
function reflectedLight(parent, pos, size, rgb, seed) {
  const random=rng(seed);
  const texture=canvasTexture(384,768,(ctx,w,h)=>{
    const glow=ctx.createRadialGradient(w*.5,h*.42,0,w*.5,h*.42,h*.50);
    glow.addColorStop(0,`rgba(${rgb},.27)`);glow.addColorStop(.45,`rgba(${rgb},.12)`);glow.addColorStop(1,`rgba(${rgb},0)`);
    ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    for(let i=0;i<230;i++) {
      const y=random()*h,fade=Math.sin(y/h*Math.PI);
      const x=w*(.5+(random()-.5)*(.25+.7*y/h));
      const width=(8+random()*88)*fade;
      const streak=ctx.createLinearGradient(x-width/2,0,x+width/2,0);
      const alpha=(.025+random()*.16)*fade;
      streak.addColorStop(0,`rgba(${rgb},0)`);streak.addColorStop(.45,`rgba(${rgb},${alpha})`);streak.addColorStop(1,`rgba(${rgb},0)`);
      ctx.fillStyle=streak;ctx.fillRect(x-width/2,y,width,1+random()*2.5);
    }
    ctx.globalCompositeOperation='destination-in';
    const fadeX=ctx.createLinearGradient(0,0,w,0);
    fadeX.addColorStop(0,'transparent');fadeX.addColorStop(.24,'white');fadeX.addColorStop(.76,'white');fadeX.addColorStop(1,'transparent');
    ctx.fillStyle=fadeX;ctx.fillRect(0,0,w,h);
    const fadeY=ctx.createLinearGradient(0,0,0,h);
    fadeY.addColorStop(0,'transparent');fadeY.addColorStop(.18,'white');fadeY.addColorStop(.78,'white');fadeY.addColorStop(1,'transparent');
    ctx.fillStyle=fadeY;ctx.fillRect(0,0,w,h);
  });
  const mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.70,depthWrite:false,blending:THREE.AdditiveBlending});
  const p=plane(parent,pos,size,mat,[-Math.PI/2,0,0]);p.userData.dynamic=true;
  return mat;
}
export function buildGround(parent, renderer) {
  const g=group(parent);
  box(g,[0,-.33,0],[14,.74,14],'#283d4d',{bevel:.14,outline:true});
  box(g,[0,-.61,0],[13.89,.14,13.89],'#1b2e41',{bevel:.085,outline:true});
  box(g,[0,.035,0],[13.97,.09,13.97],'#425968',{bevel:.045,outline:true});
  // A visible strata line makes the complete square read as a collectible model base.
  for(const z of [-7.005,7.005]) box(g,[0,-.20,z],[13.72,.018,.011],'#536a77');
  for(const x of [-7.005,7.005]) box(g,[x,-.20,0],[.011,.018,13.72],'#536a77');
  for(let x=-6.6;x<6.8;x+=1.25) {
    box(g,[x,-.37,7.008],[.012,.31,.008],'#203445');
    box(g,[7.008,-.37,x],[.008,.31,.012],'#203445');
  }
  const resolution = Math.min(1024, Math.max(512,Math.floor(innerWidth*.6)));
  const wet = new WetReflection(new THREE.PlaneGeometry(13.86,13.86),{resolution,shader:wetShader,height:.088});
  parent.add(wet);
  // Raised pavement and its individual kerbstones trace an unambiguous L-shaped corner.
  box(g,[-.43,.225,-1.53],[10.14,.28,7.96],'#657578',{bevel:.025,outline:true});
  box(g,[-.43,.382,-1.53],[10.14,.055,7.96],'#87918a',{bevel:.02});
  for(let x=-5.47;x<4.6;x+=.63) {
    for(let z=-5.45;z<2.43;z+=.64) {
      if(x>-4.08&&x<3.36&&z<.80&&z>-4.81) continue;
      box(g,[x+.285,.414,z+.28],[.575,.018,.57],((Math.round(x*10+z*10)%3)===0)?'#929991':'#818e88');
    }
  }
  for(let x=-5.4;x<4.55;x+=.50) box(g,[x+.23,.25,2.51],[.475,.32,.22],'#b2b7a7',{bevel:.018,outline:true});
  for(let z=-5.5;z<2.5;z+=.50) box(g,[4.70,.25,z+.23],[.22,.32,.475],'#b2b7a7',{bevel:.018,outline:true});
  for(let z=-5.5;z<2.5;z+=.50) box(g,[-5.58,.25,z+.23],[.18,.32,.475],'#82918a',{bevel:.015});
  // Drainage channels include recessed grates, slots and small puddled seams.
  box(g,[-.42,.10,2.76],[10.42,.03,.21],'#233c49');
  box(g,[4.94,.105,-1.46],[.22,.034,8.50],'#263f48');
  for(const x of [-4.4,-2,.4,2.9]) {
    box(g,[x,.13,2.76],[.89,.038,.20],'#53666a',{outline:true});
    for(let xx=x-.38;xx<x+.39;xx+=.085) box(g,[xx,.152,2.76],[.035,.01,.135],'#1d3442');
  }
  for(const z of [-3.8,-.8,1.6]) {
    box(g,[4.94,.13,z],[.2,.04,.77],'#53666a',{outline:true});
    for(let zz=z-.32;zz<z+.34;zz+=.083) box(g,[4.94,.155,zz],[.13,.01,.035],'#203441');
  }
  const paint = new THREE.MeshStandardMaterial({map:asphaltPaint(),color:'#a7bdba',roughness:.25,metalness:.12,emissive:'#75938b',emissiveIntensity:.10});
  for(let i=0;i<6;i++) {
    const stripe=plane(g,[.9+i*.87,.112,4.77],[.48,3.50],paint,[-Math.PI/2,0,0]);
  }
  // Short lane markings lead around the corner rather than implying an endless street.
  for(let z=-5.8;z<.3;z+=1.9) box(g,[5.90,.115,z],[.085,.008,.88],'#afb9a6',{emissive:'#597278',intensity:.16});
  for(let x=-6.15;x<-.7;x+=1.65) box(g,[x,.115,6.48],[.83,.008,.08],'#9aaea8');
  // A single small parking bay, two wheel stops and a worn painted bicycle marking.
  for(const x of [-5.54,-1.26]) box(g,[x,.117,4.44],[.055,.01,2.63],'#9aafa9');
  box(g,[-3.40,.117,5.75],[4.34,.01,.055],'#9aafa9');
  for(const x of [-4.65,-2.14]) {
    box(g,[x,.19,3.19],[.71,.16,.16],'#919990',{bevel:.025,outline:true});
    box(g,[x,.274,3.19],[.28,.014,.165],'#c4b887');
  }
  label(g,'P',[-3.4,.126,4.35],[.65,.84],{bg:'#314b59',color:'#a5bcb3',rotation:[-Math.PI/2,0,0]});
  // Tactile warning tiles sit at the corner crossing, catching the shop's amber light.
  for(let i=0;i<6;i++) {
    box(g,[.8+i*.48,.445,2.10],[.43,.029,.34],'#baaa69',{bevel:.01});
    for(let a=0;a<4;a++) for(let b=0;b<3;b++) cylinder(g,[.65+i*.48+a*.097,.466,2.0+b*.096],.017,.02,.014,'#d3bf75',{segments:6});
  }
  // Round cast-iron manhole, concentric casting rings, and a restrained hatch pattern.
  cylinder(g,[-.49,.121,5.91],.51,.51,.035,'#3b515c',{segments:40,outline:true});
  for(const r of [.43,.48]) torus(g,[-.49,.143,5.91],r,.011,'#72868a',{rotation:[Math.PI/2,0,0]});
  for(let x=-.77;x<-.16;x+=.13) for(let z=5.65;z<6.22;z+=.13) {
    if((x+.49)**2+(z-5.91)**2<.15) box(g,[x,.149,z],[.067,.014,.047],'#5d737a');
  }
  // Water in the back service lane and roof puddles is matte, not a perfect mirror.
  const random=rng(12);
  for(let i=0;i<22;i++) {
    const x=random()*12.2-6.1,z=random()*12.2-6.1;
    if(x>-5.6&&x<4.8&&z<2.7&&z>-5.6) continue;
    const patch=new THREE.Mesh(new THREE.CircleGeometry(.3+random()*.54,24),new THREE.MeshBasicMaterial({color:i%2?'#6e9da4':'#355a6e',transparent:true,opacity:.065,depthWrite:false}));
    patch.rotation.x=-Math.PI/2;patch.position.set(x,.12,z);patch.scale.y=.3+random()*.35;g.add(patch);
  }
  // Tiny grass tufts grow only along the back alley's unfinished edge.
  for(let i=0;i<26;i++) {
    const x=-5.85+random()*10.8,z=-5.76-random()*.22;
    for(let j=0;j<3;j++) rod(g,[x,.08,z],[x+(random()-.5)*.10,.15+random()*.15,z+(random()-.5)*.09],.013,'#5b7c71');
  }
  // Soft, broken light spill complements the physically reflected image at miniature scale.
  const glints=[
    reflectedLight(g,[-2.45,.126,4.63],[3.8,3.85],'242,185,106',58),
    reflectedLight(g,[-4.97,.128,3.99],[1.4,2.35],'92,204,178',13),
    reflectedLight(g,[2.05,.128,4.62],[2.1,3.83],'239,200,130',127),
    reflectedLight(g,[5.83,.128,-.7],[1.8,4.75],'108,190,169',314),
  ];
  return { wet, update(t) {
    wet.material.uniforms.time.value=t;
    glints.forEach((mat,i)=>{mat.opacity=.67+Math.sin(t*1.15+i*2)*.045;});
  } };

}
