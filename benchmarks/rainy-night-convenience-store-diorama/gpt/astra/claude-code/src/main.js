import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { canvasTexture, batchStatic } from './kit.js';
import { buildGround } from './ground.js';
import { buildStore } from './store.js';
import { buildInterior } from './interior.js';
import { buildProps } from './props.js';
import { buildWeather } from './weather.js';

const scene = new THREE.Scene();
scene.background = canvasTexture(1024,1024,(ctx,w,h)=>{
  const gradient=ctx.createRadialGradient(w*.5,h*.42,w*.04,w*.5,h*.45,w*.74);
  gradient.addColorStop(0,'#294357');gradient.addColorStop(.42,'#1c3044');gradient.addColorStop(1,'#101927');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
});

let renderer;
try {
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
} catch(error) {
  const message=document.createElement('p');message.id='error';message.textContent='这个雨夜需要支持 WebGL 的浏览器。请开启硬件加速后重新打开。';document.body.append(message);
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.4));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate=false;
document.body.appendChild(renderer.domElement);
renderer.domElement.setAttribute('aria-label','雨宿り：可拖拽旋转、缩放的雨夜便利店微缩三维景观');
renderer.domElement.setAttribute('role','img');
renderer.domElement.tabIndex=0;

const camera=new THREE.OrthographicCamera(-12,12,10,-10,.1,100);
camera.layers.enable(1);
camera.position.set(16,12.2,20);
const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,2.35,0);
controls.enableDamping=true;controls.dampingFactor=.065;
controls.rotateSpeed=.62;controls.zoomSpeed=.85;controls.panSpeed=.65;
controls.minPolarAngle=.18;controls.maxPolarAngle=Math.PI*.485;
controls.minZoom=.58;controls.maxZoom=3.4;
controls.screenSpacePanning=true;
controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};
controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};
controls.update();

scene.add(new THREE.HemisphereLight('#abc9df','#253c52',1.15));
const moon=new THREE.DirectionalLight('#aecbe9',1.35);moon.position.set(-7,13,7);moon.castShadow=true;
moon.shadow.mapSize.set(2048,2048);moon.shadow.camera.left=-11;moon.shadow.camera.right=11;moon.shadow.camera.top=11;moon.shadow.camera.bottom=-11;
moon.shadow.camera.near=.5;moon.shadow.camera.far=35;moon.shadow.normalBias=.035;moon.shadow.bias=-.00035;moon.shadow.radius=3;
scene.add(moon);
const rim=new THREE.DirectionalLight('#5ea8c1',.8);rim.position.set(8,7,-7);scene.add(rim);

const world=new THREE.Group();scene.add(world);
const ground=buildGround(world,renderer);
const store=buildStore(world);
const interior=buildInterior(world);
const props=buildProps(world);
world.traverse(object => { if (object.isPointLight && object.intensity > 10) object.intensity *= .62; });
batchStatic(world);
const weather=buildWeather(world);
renderer.shadowMap.needsUpdate=true;

const renderTarget=new THREE.WebGLRenderTarget(innerWidth,innerHeight,{type:THREE.HalfFloatType,samples:2});
const composer=new EffectComposer(renderer,renderTarget);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.27,.62,1.02);
composer.addPass(bloom);
composer.addPass(new OutputPass());

function resize(){
  const aspect=innerWidth/innerHeight;
  const height=Math.max(15.5,22.5/aspect);
  camera.left=-height*aspect/2;camera.right=height*aspect/2;camera.top=height/2;camera.bottom=-height/2;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);
}
addEventListener('resize',resize);resize();
addEventListener('contextmenu',event=>event.preventDefault());
const initialPosition=camera.position.clone(),initialTarget=controls.target.clone();
renderer.domElement.addEventListener('dblclick',()=>{
  controls.enableDamping=false;
  controls.update();
  camera.position.copy(initialPosition);controls.target.copy(initialTarget);camera.zoom=1;
  camera.updateProjectionMatrix();controls.update();
  controls.enableDamping=true;
});

let elapsed=0,lastTime=performance.now(),frames=0;
function animate(now){
  const dt=Math.min((now-lastTime)/1000,.06);lastTime=now;
  if(!document.hidden)elapsed+=dt;
  controls.update();
  store.update(elapsed);ground.update(elapsed);weather.update(elapsed);props?.update?.(elapsed);interior?.update?.(elapsed);
  composer.render();frames++;
  if(frames===2){document.documentElement.dataset.ready='true';}
}
renderer.setAnimationLoop(animate);
document.addEventListener('visibilitychange',()=>{lastTime=performance.now();});
// Diagnostics expose scene state without placing any interface over the miniature.
window.__diorama={scene,camera,controls,renderer,store,get elapsed(){return elapsed;},get frames(){return frames;}};
