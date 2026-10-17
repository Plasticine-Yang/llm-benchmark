import * as THREE from 'three';
import { group, rng, plane, rod, halo } from './kit.js';

function rainGeometry(count, random) {
  const geometry=new THREE.BufferGeometry();
  const points=new Float32Array(count*6), seeds=new Float32Array(count*4);
  for(let i=0;i<count;i++) {
    seeds[i*4]=random()*13.8-6.9;seeds[i*4+1]=random()*9;
    seeds[i*4+2]=random()*13.8-6.9;seeds[i*4+3]=.13+random()*.16;
  }
  geometry.setAttribute('position',new THREE.BufferAttribute(points,3).setUsage(THREE.DynamicDrawUsage));
  return {geometry,seeds,points};
}
export function buildWeather(parent) {
  const g=group(parent);g.userData.dynamic=true;
  const random=rng(602);
  const rain=rainGeometry(1250,random);
  const rainMat=new THREE.LineBasicMaterial({color:'#9fb8d0',transparent:true,opacity:.16,depthWrite:false});
  const lines=new THREE.LineSegments(rain.geometry,rainMat);lines.frustumCulled=false;g.add(lines);
  // Rings expand independently; they never continue through the shop or its pavement.
  const ringGeo=new THREE.RingGeometry(.82,1,32);
  const ringOpacity=new Float32Array(100);
  ringGeo.setAttribute('aOpacity',new THREE.InstancedBufferAttribute(ringOpacity,1));
  const ringMat=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,
    uniforms:{color:{value:new THREE.Color('#a2c9d3')}},
    vertexShader:`attribute float aOpacity;varying float vOpacity;void main(){vOpacity=aOpacity;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform vec3 color;varying float vOpacity;void main(){gl_FragColor=vec4(color,vOpacity);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`,
  });
  const ringInstances=new THREE.InstancedMesh(ringGeo,ringMat,100);
  ringInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  ringInstances.frustumCulled=false;g.add(ringInstances);
  const ringTransform=new THREE.Object3D();ringTransform.rotation.x=-Math.PI/2;
  const ripples=[];
  for(let i=0;i<65;i++) {
    let x,z;
    do{x=random()*13.3-6.65;z=random()*13.3-6.65;}while(x>-5.65&&x<4.83&&z<2.65&&z>-5.65);
    const position=new THREE.Vector3(x,.139,z);
    ripples.push({position,phase:random()*2.5,speed:1+random()*.8,max:.11+random()*.21});
    if(i%3===0) ripples.push({position,phase:random()*2.5,speed:1+random()*.8,max:.18+random()*.2});
  }
  ringInstances.count=ripples.length;
  const drips=rainGeometry(46,random);
  const dripLines=new THREE.LineSegments(drips.geometry,new THREE.LineBasicMaterial({color:'#fae6bc',transparent:true,opacity:.39,depthWrite:false}));dripLines.frustumCulled=false;g.add(dripLines);
  for(let i=0;i<46;i++){drips.seeds[i*4]=-4.1+random()*7.68;drips.seeds[i*4+1]=random()*3;}
  // Refraction-like glass streaks: sparse, short and almost transparent.
  const glassShader=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,
    uniforms:{time:{value:0},aspect:{value:1}},
    vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`
      varying vec2 vUv; uniform float time; uniform float aspect;
      float h(float x){return fract(sin(x*127.1)*43758.5453);}
      void main(){
        vec2 uv=vUv; float grid=uv.x*aspect*70.; float id=floor(grid);float x=fract(grid);
        float center=.2+h(id)*.6;float y=fract(uv.y*1.8+time*(.04+h(id)*.11)+h(id*2.1));
        float drop=smoothstep(.035,.0,abs(x-center))*smoothstep(.17,.0,y);
        float bead=smoothstep(.10,.0,length(vec2((x-center)*.5,y*1.8)));
        float strength=(drop*.15+bead*.10)*step(.53,h(id*8.3));
        gl_FragColor=vec4(.75,.88,.9,strength);
      }`,
  });
  const front=glassShader.clone();front.uniforms.aspect.value=7.1/2.4;
  plane(g,[-.27,1.96,.875],[7.1,2.39],front);
  const side=glassShader.clone();side.uniforms.aspect.value=5.3/2.4;
  plane(g,[3.403,1.96,-1.97],[5.3,2.4],side,[0,Math.PI/2,0]);
  // Short needle splashes are much less prominent than the quiet concentric ripples.
  const splashGeo=new THREE.BufferGeometry(),splashPoints=new Float32Array(30*12);
  splashGeo.setAttribute('position',new THREE.BufferAttribute(splashPoints,3).setUsage(THREE.DynamicDrawUsage));
  const splashes=new THREE.LineSegments(splashGeo,new THREE.LineBasicMaterial({color:'#c8dedd',transparent:true,opacity:.18,depthWrite:false}));splashes.frustumCulled=false;g.add(splashes);
  g.traverse(object=>{object.layers.set(1);});
  return {
    update(t) {
      for(let i=0;i<rain.seeds.length/4;i++) {
        const k=i*4,p=i*6;
        const y=9-((rain.seeds[k+1]+t*(5.2+rain.seeds[k+3]*5))%9);
        const x=rain.seeds[k]+Math.sin(t*.4)*.035, z=rain.seeds[k+2];
        const indoors=x>-4.2&&x<3.62&&z>-4.9&&z<1.6&&y<4.43;
        rain.points[p]=x;rain.points[p+1]=indoors?-2:y;rain.points[p+2]=z;
        rain.points[p+3]=x-.045;rain.points[p+4]=indoors?-2:y+rain.seeds[k+3];rain.points[p+5]=z-.014;
      }
      rain.geometry.attributes.position.needsUpdate=true;
      ripples.forEach((r,i)=>{
        const a=(t*r.speed+r.phase)%2.2/2.2;
        ringTransform.position.copy(r.position);ringTransform.scale.setScalar(.014+a*r.max);ringTransform.updateMatrix();
        ringInstances.setMatrixAt(i,ringTransform.matrix);ringOpacity[i]=(1-a)*.25;
      });
      ringInstances.instanceMatrix.needsUpdate=true;ringGeo.attributes.aOpacity.needsUpdate=true;
      for(let i=0;i<46;i++) {
        const k=i*4,p=i*6,y=3.15-((t*2.3+drips.seeds[k+1])%2.75);
        drips.points[p]=drips.seeds[k];drips.points[p+1]=y;drips.points[p+2]=1.6;
        drips.points[p+3]=drips.seeds[k]-.006;drips.points[p+4]=y+.052;drips.points[p+5]=1.6;
      }
      drips.geometry.attributes.position.needsUpdate=true;
      for(let i=0;i<30;i++) {
        const r=ripples[i],a=(t*1.8+r.phase)%1,p=i*12;
        const height=Math.sin(a*Math.PI)*.09;
        for(let j=0;j<2;j++) {
          const q=p+j*6,sign=j?1:-1;
          splashPoints[q]=r.position.x+sign*a*.085;splashPoints[q+1]=.14+height;splashPoints[q+2]=r.position.z;
          splashPoints[q+3]=r.position.x+sign*a*.065;splashPoints[q+4]=.14+height+.025*(1-a);splashPoints[q+5]=r.position.z+.01;
        }
      }
      splashGeo.attributes.position.needsUpdate=true;
      front.uniforms.time.value=t;side.uniforms.time.value=t;
    },
  };
}
