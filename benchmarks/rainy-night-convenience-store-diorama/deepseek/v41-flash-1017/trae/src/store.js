import * as THREE from 'three';
import { STORE, DOOR, SIDEWALK_Y } from './layout.js';
import { toon, box, cylinder, addOutline, unlit, sprite } from './materials.js';
import {
  makeMainSignTexture,
  makePylonSignTexture,
  makeWindowDecalTexture,
  makePosterTexture,
  makeBannerTexture,
  makeInteriorFloorTexture,
  makeCurtainTexture,
  makeClockTexture,
  makeFloorArrowTexture,
  makeNoticeBoardTexture,
  makeShutterTexture,
  makeGlowTexture,
} from './textures.js';

const FLOOR = 0.5;

function glassMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTint: { value: new THREE.Color(0xbfe0f5) } },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTint;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.6);
        float a = 0.006 + 0.075 * f;
        vec3 c = mix(vec3(0.02, 0.05, 0.09), uTint, f);
        gl_FragColor = vec4(c, a);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

function pane(w, h, x, y, z, rotY = 0) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMaterial());
  p.position.set(x, y, z);
  p.rotation.y = rotY;
  return p;
}

function mullion(w, h, d, x, y, z, mat) {
  const m = box(w, h, d, mat, { outline: false, thick: 0.01, cast: false });
  m.position.set(x, y, z);
  return m;
}

/* ============================================================ 外部 */

function createExterior(root) {
  const wall = toon(0xd8cfba);
  const wallShade = toon(0xc8bfaa);
  const trim = toon(0x2c333d);
  const metal = toon(0x9aa3ad);
  const darkMetal = toon(0x3b424b);
  const groundDark = toon(0x45443f);

  // 基座
  const slab = box(11.25, 0.38, 10.25, toon(0x4a4843), { outline: true, thick: 0.02, cast: false });
  slab.position.set(2.5, SIDEWALK_Y + 0.19, -4);
  root.add(slab);

  // 外墙
  const back = box(11.0, 6.43, 0.3, wallShade, { outline: true, thick: 0.024, cast: true });
  back.position.set(2.5, 3.335, -8.85);
  root.add(back);

  const right = box(0.3, 6.43, 10, wall, { outline: true, thick: 0.024 });
  right.position.set(7.85, 3.335, -4);
  root.add(right);

  const upperFront = box(11.0, 3.53, 0.3, wall, { outline: true, thick: 0.024 });
  upperFront.position.set(2.5, 4.785, 0.85);
  root.add(upperFront);

  const upperLeft = box(0.3, 3.53, 10, wall, { outline: true, thick: 0.024 });
  upperLeft.position.set(-2.85, 4.785, -4);
  root.add(upperLeft);

  // 一层的墙垛
  const pierMat = wall;
  const corner = box(0.56, 2.92, 0.56, pierMat, { outline: true, thick: 0.02 });
  corner.position.set(-2.72, 1.6, 0.72);
  root.add(corner);
  const rightPier = box(0.56, 2.92, 0.32, pierMat, { outline: true, thick: 0.02 });
  rightPier.position.set(7.72, 1.6, 0.84);
  root.add(rightPier);
  const leftBackPier = box(0.56, 2.92, 0.32, pierMat, { outline: true, thick: 0.02 });
  leftBackPier.position.set(-2.72, 1.6, -8.84);
  root.add(leftBackPier);

  // 下层裙板
  const skirtF = box(11.1, 0.5, 0.24, groundDark, { outline: true, thick: 0.016, cast: false });
  skirtF.position.set(2.5, 0.37, 1.0);
  root.add(skirtF);
  const skirtL = box(0.24, 0.5, 10.1, groundDark, { outline: true, thick: 0.016, cast: false });
  skirtL.position.set(-2.98, 0.37, -4);
  root.add(skirtL);

  // 玻璃 + 竖框
  const glassY = (0.62 + 3.02) / 2;
  const glassH = 3.02 - 0.62;
  root.add(pane(3.55, glassH, -0.675, glassY, 0.95));
  root.add(pane(2.5, glassH, 4.15, glassY, 0.95));
  root.add(pane(9.0, glassH, -2.95, glassY, -4.05, Math.PI / 2));

  // 右侧实体墙段（公告栏所在）
  const solidFront = box(2.05, 2.42, 0.26, wall, { outline: true, thick: 0.018, cast: false });
  solidFront.position.set(6.43, 1.83, 0.92);
  root.add(solidFront);

  const mullX = [-2.45, -0.66, 1.1, 2.9, 5.4, 7.45];
  for (const x of mullX) root.add(mullion(0.075, glassH + 0.14, 0.12, x, glassY, 0.95, darkMetal));
  for (const z of [-8.55, -6.75, -4.95, -3.15, -1.35, 0.45]) {
    root.add(mullion(0.12, glassH + 0.14, 0.075, -2.95, glassY, z, darkMetal));
  }
  // 横向框
  const railTop = mullion(10.5, 0.12, 0.16, 2.5, 3.0, 0.95, darkMetal);
  root.add(railTop);
  const railBot = mullion(10.5, 0.1, 0.16, 2.5, 0.6, 0.95, darkMetal);
  root.add(railBot);
  const railTopL = mullion(0.16, 0.12, 9.4, -2.95, 3.0, -4.05, darkMetal);
  root.add(railTopL);
  const railBotL = mullion(0.16, 0.1, 9.4, -2.95, 0.6, -4.05, darkMetal);
  root.add(railBotL);

  // 自动门（两片，可滑动）
  const doorH = 2.32;
  const doorY = 0.62 + doorH / 2;
  const doorFrameMat = darkMetal;
  const doorPanels = [];
  for (let i = 0; i < 2; i++) {
    const pg = new THREE.Group();
    const leaf = box(0.9, doorH, 0.06, doorFrameMat, { outline: true, thick: 0.012, cast: false });
    leaf.position.set(0, doorY, 0.9);
    pg.add(leaf);
    const glass = pane(0.74, doorH - 0.22, 0, doorY, 0.94);
    pg.add(glass);
    const handle = box(0.03, 0.5, 0.1, metal, { cast: false });
    handle.position.set(i === 0 ? 0.34 : -0.34, 1.25, 1.0);
    pg.add(handle);
    pg.position.set(i === 0 ? 1.58 : 2.42, 0, 0);
    root.add(pg);
    doorPanels.push(pg);
  }
  // 门楣 + 感应器
  const header = box(2.1, 0.16, 0.3, trim, { outline: true, thick: 0.012, cast: false });
  header.position.set(2.0, 2.96, 0.92);
  root.add(header);
  const sensor = box(0.44, 0.09, 0.16, darkMetal, { cast: false });
  sensor.position.set(2.0, 3.02, 1.12);
  root.add(sensor);
  const sensorEye = unlit(0xff5a4a);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), sensorEye);
  eye.position.set(2.0, 3.02, 1.21);
  root.add(eye);

  // 门口地垫
  const mat = box(1.85, 0.03, 1.2, toon(0x3f4348), { cast: false });
  mat.position.set(2.0, SIDEWALK_Y + 0.02, 1.55);
  root.add(mat);
  const matIn = box(1.7, 0.02, 0.9, toon(0x4a4e52), { cast: false });
  matIn.position.set(2.0, FLOOR + 0.012, 0.35);
  root.add(matIn);

  // 玻璃贴纸
  const decalTex = makeWindowDecalTexture();
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 1.3),
    new THREE.MeshBasicMaterial({ map: decalTex, color: 0xd8d0be, transparent: true, depthWrite: false })
  );
  decal.position.set(4.5, 1.75, 0.97);
  root.add(decal);
  const decal2 = decal.clone();
  decal2.position.set(-0.3, 2.3, 0.97);
  decal2.scale.set(0.8, 0.8, 1);
  root.add(decal2);

  // 店内暖光空气感（很轻的叠加，让橱窗整体发亮）
  const hazeMat = new THREE.MeshBasicMaterial({
    color: 0xffb765,
    transparent: true,
    opacity: 0.1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const hazeF = new THREE.Mesh(new THREE.PlaneGeometry(10.4, 2.4), hazeMat);
  hazeF.position.set(2.5, 1.82, 0.9);
  root.add(hazeF);
  const hazeL = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 2.4), hazeMat);
  hazeL.rotation.y = Math.PI / 2;
  hazeL.position.set(-2.9, 1.82, -4.05);
  root.add(hazeL);

  // 玻璃内海报
  const posters = ['drink', 'onigiri', 'coffee', 'karaage'];
  const pxs = [-1.75, 0.35, 3.9];
  posters.slice(0, 3).forEach((p, i) => {
    const tex = makePosterTexture(p);
    const pm = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, 1.0),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    pm.position.set(pxs[i], 1.95, 0.86);
    root.add(pm);
    const frame = box(0.78, 1.06, 0.03, trim, { cast: false });
    frame.position.set(pxs[i], 1.95, 0.84);
    root.add(frame);
  });

  // 招牌（正面 + 左侧）
  const signTex = makeMainSignTexture();
  const signFrontMat = new THREE.MeshBasicMaterial({ map: signTex });
  const signMats = [];
  const signBoxMat = [trim, trim, trim, trim, signFrontMat, trim];
  const signF = new THREE.Mesh(new THREE.BoxGeometry(10.98, 0.96, 0.16), signBoxMat);
  signF.position.set(2.5, 3.53, 1.03);
  signF.castShadow = false;
  root.add(signF);
  signMats.push(signFrontMat);

  const signLeftMat = new THREE.MeshBasicMaterial({ map: signTex });
  const signLMatArr = [trim, signLeftMat, trim, trim, trim, trim];
  const signL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.96, 9.9), signLMatArr);
  signL.position.set(-3.03, 3.53, -4.0);
  signL.castShadow = false;
  root.add(signL);
  signMats.push(signLeftMat);

  // 招牌外框
  const frameF = box(11.16, 1.12, 0.2, trim, { outline: true, thick: 0.018, cast: false });
  frameF.position.set(2.5, 3.53, 0.94);
  root.add(frameF);
  const frameL = box(0.2, 1.12, 10.16, trim, { outline: true, thick: 0.018, cast: false });
  frameL.position.set(-2.94, 3.53, -4);
  root.add(frameL);

  // 雨棚
  const awnMat = toon(0x343b45);
  const awnGlow = unlit(0xffe9c2);
  const awningF = box(11.25, 0.07, 0.92, awnMat, { outline: true, thick: 0.012 });
  awningF.position.set(2.5, 2.99, 1.5);
  awningF.rotation.x = -0.05;
  root.add(awningF);
  const fasciaF = box(11.25, 0.2, 0.06, awnMat, { outline: true, thick: 0.012 });
  fasciaF.position.set(2.5, 2.93, 1.95);
  root.add(fasciaF);
  const stripF = box(11.0, 0.03, 0.02, awnGlow, { cast: false });
  stripF.position.set(2.5, 2.85, 1.93);
  root.add(stripF);
  const soffitF = new THREE.Mesh(new THREE.PlaneGeometry(11.1, 0.86), new THREE.MeshBasicMaterial({ color: 0xffe6c2 }));
  soffitF.rotation.x = Math.PI / 2;
  soffitF.position.set(2.5, 2.945, 1.5);
  root.add(soffitF);

  const awningL = box(0.92, 0.07, 10.15, awnMat, { outline: true, thick: 0.012 });
  awningL.position.set(-3.48, 2.99, -4);
  awningL.rotation.z = -0.05;
  root.add(awningL);
  const fasciaL = box(0.06, 0.2, 10.15, awnMat, { outline: true, thick: 0.012 });
  fasciaL.position.set(-3.93, 2.93, -4);
  root.add(fasciaL);
  const stripL = box(0.02, 0.03, 9.9, awnGlow, { cast: false });
  stripL.position.set(-3.91, 2.85, -4);
  root.add(stripL);
  const soffitL = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 10.05), new THREE.MeshBasicMaterial({ color: 0xffe6c2 }));
  soffitL.rotation.x = Math.PI / 2;
  soffitL.rotation.z = Math.PI / 2;
  soffitL.position.set(-3.48, 2.945, -4);
  root.add(soffitL);

  // 雨棚下筒灯
  for (let i = 0; i < 6; i++) {
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), unlit(0xfff1d4));
    d.rotation.x = Math.PI / 2;
    d.position.set(-2.0 + i * 1.85, 2.93, 1.72);
    root.add(d);
  }
  for (let i = 0; i < 4; i++) {
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), unlit(0xfff1d4));
    d.rotation.x = Math.PI / 2;
    d.rotation.z = Math.PI / 2;
    d.position.set(-3.72, 2.93, -7.2 + i * 2.0);
    root.add(d);
  }

  // 二层窗户
  const curtainWarm = makeCurtainTexture(true);
  const curtainDark = makeCurtainTexture(false);
  const addWindow = (x, y, z, w, h, rotY, warm) => {
    const grp = new THREE.Group();
    const inner = new THREE.Mesh(
      new THREE.PlaneGeometry(w - 0.14, h - 0.14),
      new THREE.MeshBasicMaterial({ map: warm ? curtainWarm : curtainDark })
    );
    inner.position.z = 0.02;
    grp.add(inner);
    const fr = box(w + 0.04, h + 0.04, 0.1, trim, { outline: true, thick: 0.012, cast: false });
    fr.position.z = -0.05;
    grp.add(fr);
    const barV = box(0.045, h, 0.06, trim, { cast: false });
    barV.position.z = 0.05;
    grp.add(barV);
    const barH = box(w, 0.05, 0.06, trim, { cast: false });
    barH.position.set(0, h * 0.05, 0.05);
    grp.add(barH);
    const sill = box(w + 0.18, 0.08, 0.22, wallShade, { outline: true, thick: 0.01 });
    sill.position.set(0, -h / 2 - 0.04, 0.06);
    grp.add(sill);
    grp.position.set(x, y, z);
    grp.rotation.y = rotY;
    root.add(grp);
    return grp;
  };
  addWindow(-1.15, 5.28, 1.02, 1.35, 1.2, 0, true);
  addWindow(2.95, 5.28, 1.02, 1.35, 1.2, 0, false);
  addWindow(6.6, 5.28, 1.02, 1.1, 1.2, 0, true);
  addWindow(-3.02, 5.28, -6.75, 1.3, 1.2, Math.PI / 2, true);
  addWindow(-3.02, 5.28, -3.25, 1.3, 1.2, Math.PI / 2, false);

  // 二层横向装饰线
  const belt = box(11.1, 0.1, 0.36, wallShade, { outline: true, thick: 0.012, cast: false });
  belt.position.set(2.5, 4.2, 0.9);
  root.add(belt);
  const beltL = box(0.36, 0.1, 10.1, wallShade, { outline: true, thick: 0.012, cast: false });
  beltL.position.set(-2.9, 4.2, -4);
  root.add(beltL);

  // 招牌上沿挑檐
  const ledge = box(11.2, 0.12, 0.5, wallShade, { outline: true, thick: 0.014 });
  ledge.position.set(2.5, 4.13, 1.05);
  root.add(ledge);

  // 空调外机（左墙）
  for (const z of [-4.6, -1.4]) {
    const ac = box(0.42, 0.58, 0.86, toon(0xcfc9bb), { outline: true, thick: 0.014 });
    ac.position.set(-3.2, 4.55, z);
    root.add(ac);
    const grille = new THREE.Mesh(
      new THREE.CircleGeometry(0.22, 16),
      new THREE.MeshBasicMaterial({ color: 0x4a4f56 })
    );
    grille.rotation.y = -Math.PI / 2;
    grille.position.set(-3.42, 4.55, z);
    root.add(grille);
    const bracket = box(0.1, 0.5, 0.9, darkMetal, { cast: false });
    bracket.position.set(-3.05, 4.25, z);
    root.add(bracket);
  }

  // 屋顶
  const roof = box(11.2, 0.22, 10.2, wallShade, { outline: true, thick: 0.02 });
  roof.position.set(2.5, 6.66, -4);
  root.add(roof);
  const parapetH = 0.4;
  const parapetMat = wall;
  const pFront = box(11.2, parapetH, 0.18, parapetMat, { outline: true, thick: 0.014 });
  pFront.position.set(2.5, 6.95, 0.94);
  root.add(pFront);
  const pBack = pFront.clone();
  pBack.position.z = -8.94;
  root.add(pBack);
  const pLeft = box(0.18, parapetH, 10.0, parapetMat, { outline: true, thick: 0.014 });
  pLeft.position.set(-2.92, 6.95, -4);
  root.add(pLeft);
  const pRight = pLeft.clone();
  pRight.position.x = 7.92;
  root.add(pRight);

  // 屋顶设备
  const tankY = 7.85;
  const tank = cylinder(0.55, 0.55, 0.95, 16, toon(0xb9bcc0), { outline: true, thick: 0.014 });
  tank.position.set(5.4, tankY, -6.6);
  root.add(tank);
  const tankTop = cylinder(0.58, 0.58, 0.08, 16, toon(0x9aa0a6), { outline: true, thick: 0.012 });
  tankTop.position.set(5.4, tankY + 0.52, -6.6);
  root.add(tankTop);
  for (const [dx, dz] of [[-0.38, -0.38], [0.38, -0.38], [-0.38, 0.38], [0.38, 0.38]]) {
    const leg = cylinder(0.045, 0.045, 0.5, 6, metal, { cast: false });
    leg.position.set(5.4 + dx, 7.1, -6.6 + dz);
    root.add(leg);
  }
  const acRoof = box(0.95, 0.72, 0.55, toon(0xc7c2b5), { outline: true, thick: 0.014 });
  acRoof.position.set(0.5, 7.45, -6.9);
  root.add(acRoof);
  const acRoof2 = box(0.7, 0.9, 0.5, toon(0xbdb8ab), { outline: true, thick: 0.014 });
  acRoof2.position.set(3.0, 7.55, -7.1);
  root.add(acRoof2);
  const vent = cylinder(0.13, 0.13, 1.1, 10, metal, { outline: true, thick: 0.01 });
  vent.position.set(1.7, 7.35, -2.2);
  root.add(vent);
  const ventCap = cylinder(0.28, 0.24, 0.1, 12, metal, { outline: true, thick: 0.01 });
  ventCap.position.set(1.7, 7.92, -2.2);
  root.add(ventCap);
  // 天线
  const mast = cylinder(0.025, 0.025, 1.8, 6, metal, { cast: false });
  mast.position.set(-1.6, 7.6, -6.2);
  root.add(mast);
  for (let i = 0; i < 3; i++) {
    const bar = box(0.9 - i * 0.15, 0.02, 0.02, metal, { cast: false });
    bar.position.set(-1.6, 8.2 + i * 0.16, -6.2);
    root.add(bar);
  }
  // 屋顶小门房
  const hut = box(1.35, 1.15, 1.15, wallShade, { outline: true, thick: 0.016 });
  hut.position.set(-1.9, 7.35, -5.1);
  root.add(hut);
  const hutDoor = box(0.7, 0.92, 0.05, toon(0x5a6068), { outline: true, thick: 0.01, cast: false });
  hutDoor.position.set(-1.9, 7.2, -4.51);
  root.add(hutDoor);

  // 落水管
  for (const [x, z] of [[-2.95, 0.98], [7.95, 0.98], [-2.95, -8.9], [7.95, -8.9]]) {
    const pipe = cylinder(0.06, 0.06, 6.7, 8, toon(0x8b9199), { outline: true, thick: 0.008 });
    pipe.position.set(x, 3.5, z);
    root.add(pipe);
  }

  // 后场门 / 侧门 / 壁灯
  const serviceDoor = box(1.0, 2.1, 0.08, toon(0x5a616a), { outline: true, thick: 0.012, cast: false });
  serviceDoor.position.set(-0.2, 1.35, -8.67);
  root.add(serviceDoor);
  const serviceLamp = box(0.3, 0.12, 0.18, unlit(0xffe3ad), { cast: false });
  serviceLamp.position.set(-0.2, 2.6, -8.62);
  root.add(serviceLamp);
  const sideDoor = box(0.08, 2.0, 0.95, toon(0x646b74), { outline: true, thick: 0.012, cast: false });
  sideDoor.position.set(7.68, 1.3, -6.2);
  root.add(sideDoor);
  const sideLamp = box(0.18, 0.1, 0.28, unlit(0xffdca0), { cast: false });
  sideLamp.position.set(7.65, 2.5, -6.2);
  root.add(sideLamp);
  const alleySign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.55),
    new THREE.MeshBasicMaterial({ map: makePosterTexture('sale') })
  );
  alleySign.rotation.y = -Math.PI / 2;
  alleySign.position.set(7.66, 1.85, -3.4);
  root.add(alleySign);

  // 二层小细节：檐口通风管、墙面小灯、监控
  const ventPipe = cylinder(0.09, 0.09, 1.1, 8, toon(0x9aa1a8), { outline: true, thick: 0.006, cast: false });
  ventPipe.position.set(6.4, 4.75, 1.02);
  root.add(ventPipe);
  const wallLamp = box(0.16, 0.1, 0.22, unlit(0xffe0ab), { cast: false });
  wallLamp.position.set(2.0, 4.35, 1.07);
  root.add(wallLamp);
  const lampGlow = sprite(makeGlowTexture(), 0xffdda0, 1.4, 0.28);
  lampGlow.position.set(2.0, 4.3, 1.25);
  root.add(lampGlow);
  const camBody = box(0.16, 0.1, 0.3, toon(0xdfd9c9), { outline: true, thick: 0.006, cast: false });
  camBody.position.set(0.2, 3.16, 1.2);
  root.add(camBody);
  const camLens = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 8), unlit(0x2b3440));
  camLens.rotation.x = Math.PI / 2;
  camLens.position.set(0.2, 3.14, 1.36);
  root.add(camLens);

  // 后墙细节：格栅窗、通风口、标识、落水管
  const backWin = box(0.95, 0.72, 0.06, trim, { cast: false });
  backWin.position.set(4.6, 4.75, -9.02);
  root.add(backWin);
  const backGlass = box(0.8, 0.58, 0.03, new THREE.MeshBasicMaterial({ color: 0x2b3542 }), { cast: false });
  backGlass.position.set(4.6, 4.75, -9.05);
  root.add(backGlass);
  for (let i = 0; i < 4; i++) {
    const bar = box(0.03, 0.68, 0.05, metal, { cast: false });
    bar.position.set(4.28 + i * 0.21, 4.75, -9.07);
    root.add(bar);
  }
  const wallVent = box(0.7, 0.42, 0.08, toon(0x8d949b), { outline: true, thick: 0.008, cast: false });
  wallVent.position.set(1.3, 5.3, -9.02);
  root.add(wallVent);
  for (let i = 0; i < 3; i++) {
    const slat = box(0.62, 0.03, 0.02, toon(0x5c6268), { cast: false });
    slat.position.set(1.3, 5.18 + i * 0.1, -9.07);
    root.add(slat);
  }
  const staffFlag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.22),
    new THREE.MeshBasicMaterial({ color: 0xe7ddc2 })
  );
  staffFlag.position.set(0.55, 2.35, -8.99);
  root.add(staffFlag);
  const backPipe2 = cylinder(0.055, 0.055, 6.2, 8, toon(0x7f858c), { outline: true, thick: 0.006, cast: false });
  backPipe2.position.set(7.25, 3.2, -9.04);
  root.add(backPipe2);

  // 后墙空调 + 管道
  for (const x of [3.4, 6.4]) {
    const ac = box(0.8, 0.55, 0.4, toon(0xc9c4b7), { outline: true, thick: 0.012 });
    ac.position.set(x, 4.9, -9.15);
    root.add(ac);
  }
  const backPipe = cylinder(0.05, 0.05, 4.4, 8, toon(0x8b9199), { cast: false });
  backPipe.position.set(2.4, 3.4, -9.06);
  root.add(backPipe);

  // 公告栏（门右侧实体墙）
  const boardTex = makeNoticeBoardTexture();
  const boardFrame = box(1.5, 1.12, 0.08, toon(0x6b5844), { outline: true, thick: 0.014, cast: false });
  boardFrame.position.set(6.35, 1.92, 1.08);
  root.add(boardFrame);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.98), new THREE.MeshBasicMaterial({ map: boardTex }));
  board.position.set(6.35, 1.92, 1.13);
  root.add(board);
  const boardTop = box(1.58, 0.06, 0.22, trim, { outline: true, thick: 0.01, cast: false });
  boardTop.position.set(6.35, 2.52, 1.13);
  root.add(boardTop);

  // 小海报（实体墙右侧）
  const smallPoster = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.84),
    new THREE.MeshBasicMaterial({ map: makePosterTexture('sale') })
  );
  smallPoster.position.set(7.28, 1.95, 1.06);
  root.add(smallPoster);

  // 门口吊挂小灯箱
  const bladeTex = makeWindowDecalTexture();
  const bladeFace = new THREE.MeshBasicMaterial({ map: bladeTex, transparent: true });
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.1), [trim, trim, trim, trim, bladeFace, bladeFace]);
  blade.position.set(2.0, 2.42, 1.28);
  blade.castShadow = false;
  root.add(blade);
  const bladeArm = box(0.5, 0.05, 0.05, trim, { cast: false });
  bladeArm.position.set(2.0, 2.76, 1.28);
  root.add(bladeArm);
  const bladeGlow = sprite(makeGlowTexture(), 0xfff0cc, 1.6, 0.32);
  bladeGlow.position.set(2.0, 2.42, 1.35);
  root.add(bladeGlow);

  return { doorPanels, signMats };
}

/* ============================================================ 店内 */

function collectProducts(items, parent) {
  if (!items.length) return;
  const mat = new THREE.MeshToonMaterial({ color: 0xffffff, emissive: 0x1a1712 });
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, items.length);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  items.forEach((it, i) => {
    dummy.position.set(it.x, it.y, it.z);
    dummy.rotation.set(0, it.ry || 0, 0);
    dummy.scale.set(it.w, it.h, it.d);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, col.setHex(it.color));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;
  parent.add(mesh);
}

const PRODUCT_COLORS = [
  0xf28b82, 0xf6bf6a, 0xf7e07a, 0x9bd67f, 0x7fc8c8, 0x8ab6ea, 0xb99ae6, 0xf0a0c0,
  0xe8e2d2, 0xd96b5b, 0x6fa8d8, 0xf0c26a, 0x8fbf9a, 0xe8a0a0,
];

function createInterior(root) {
  const pick = (i) => PRODUCT_COLORS[i % PRODUCT_COLORS.length];
  const floorTex = makeInteriorFloorTexture();
  const innerWall = new THREE.MeshToonMaterial({ color: 0xf7e2bd, emissive: 0x5c3f22 });
  const white = new THREE.MeshToonMaterial({ color: 0xefe6d2, emissive: 0x2a2013 });
  const shelfMat = new THREE.MeshToonMaterial({ color: 0xe6dcc6, emissive: 0x40301c });
  const counterMat = new THREE.MeshToonMaterial({ color: 0xf0e4cd, emissive: 0x45321e });

  // 地板
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10.4, 9.1), new THREE.MeshBasicMaterial({ map: floorTex, color: 0xe9c894 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(2.5, FLOOR + 0.005, -3.95);
  root.add(floor);

  // 内衬墙
  const bwall = box(10.4, 2.78, 0.06, new THREE.MeshToonMaterial({ color: 0xf2ddb8, emissive: 0x51381e }), { cast: false });
  bwall.position.set(2.5, FLOOR + 1.39, -8.66);
  root.add(bwall);
  const rwall = box(0.06, 2.78, 9.1, innerWall, { cast: false });
  rwall.position.set(7.64, FLOOR + 1.39, -3.95);
  root.add(rwall);
  const lwall = box(0.06, 2.78, 9.1, innerWall, { cast: false });
  lwall.position.set(-2.64, FLOOR + 1.39, -3.95);
  root.add(lwall);
  const fwall = box(10.4, 0.2, 0.06, innerWall, { cast: false });
  fwall.position.set(2.5, 3.15, 0.66);
  root.add(fwall);

  // 天花板
  const ceil = box(10.4, 0.06, 9.1, new THREE.MeshToonMaterial({ color: 0xfdf6e6, emissive: 0x6b4c2a }), { cast: false, receive: false });
  ceil.position.set(2.5, 3.3, -3.95);
  root.add(ceil);

  // 灯盘
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xf6e0b4 });
  for (const x of [-0.6, 2.0, 4.4, 6.4]) {
    for (let i = 0; i < 4; i++) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.05, 0.42), lightMat);
      panel.position.set(x, 3.25, -1.4 - i * 1.75);
      root.add(panel);
    }
  }
  // 灯盘周边框
  for (const x of [-0.6, 2.0, 4.4, 6.4]) {
    for (let i = 0; i < 4; i++) {
      const f = box(1.88, 0.04, 0.55, toon(0xe6e0cf), { cast: false, receive: false });
      f.position.set(x, 3.27, -1.4 - i * 1.75);
      root.add(f);
    }
  }

  // 吊挂灯箱
  const banners = [
    ['oden', 0.9, -1.0],
    ['hot', 5.4, -0.9],
    ['coffee', 5.0, -4.6],
    ['bento', -0.9, -4.4],
  ];
  for (const [kind, x, z] of banners) {
    const tex = makeBannerTexture(kind);
    const bm = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
    const b = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.5), bm);
    b.position.set(x, 2.52, z);
    root.add(b);
    for (const dx of [-0.45, 0.45]) {
      const wire = cylinder(0.008, 0.008, 0.44, 4, toon(0x888888), { cast: false });
      wire.position.set(x + dx, 2.98, z);
      root.add(wire);
    }
  }

  // 后墙饮料冷柜
  const coolerX0 = -2.45;
  const coolerX1 = 3.25;
  const coolerW = coolerX1 - coolerX0;
  const coolerZ = -7.95;
  const cabinetBack = box(coolerW + 0.2, 2.35, 0.14, white, { cast: false });
  cabinetBack.position.set((coolerX0 + coolerX1) / 2, FLOOR + 1.15, -8.5);
  root.add(cabinetBack);
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(coolerW, 2.05),
    new THREE.MeshBasicMaterial({ color: 0xfff3d8 })
  );
  glow.position.set((coolerX0 + coolerX1) / 2, FLOOR + 1.2, -8.4);
  root.add(glow);
  // 层板
  const bottleItems = [];
  for (let level = 0; level < 4; level++) {
    const shelfY = FLOOR + 0.55 + level * 0.5;
    const sh = box(coolerW, 0.04, 0.55, toon(0xf8f6ee), { cast: false });
    sh.position.set((coolerX0 + coolerX1) / 2, shelfY, -8.12);
    root.add(sh);
    for (let i = 0; i < 15; i++) {
      const bx = coolerX0 + 0.22 + i * ((coolerW - 0.44) / 14);
      const bz = -8.12 + (i % 2 === 0 ? 0.1 : -0.1);
      bottleItems.push({ x: bx, y: shelfY + 0.15, z: bz, color: pick(level * 15 + i) });
    }
  }
  const bottleGeo = new THREE.CylinderGeometry(0.042, 0.048, 0.26, 8);
  const bottleMat = new THREE.MeshToonMaterial({ color: 0xffffff, emissive: 0x222018 });
  const bottles = new THREE.InstancedMesh(bottleGeo, bottleMat, bottleItems.length);
  {
    const d = new THREE.Object3D();
    const c = new THREE.Color();
    bottleItems.forEach((b, i) => {
      d.position.set(b.x, b.y, b.z);
      d.scale.set(1, 0.75 + (i % 3) * 0.14, 1);
      d.updateMatrix();
      bottles.setMatrixAt(i, d.matrix);
      bottles.setColorAt(i, c.setHex(b.color));
    });
    bottles.instanceMatrix.needsUpdate = true;
    bottles.frustumCulled = false;
    root.add(bottles);
  }
  // 冷柜门框
  const doorW = coolerW / 3;
  for (let i = 0; i < 3; i++) {
    const cx = coolerX0 + doorW * (i + 0.5);
    const fr = box(doorW - 0.03, 2.2, 0.08, toon(0xd9d5c9), { cast: false });
    fr.position.set(cx, FLOOR + 1.15, -7.66);
    root.add(fr);
    const gl = pane(doorW - 0.16, 2.02, cx, FLOOR + 1.15, -7.61);
    root.add(gl);
    const handle = box(0.035, 0.55, 0.07, toon(0x9aa0a8), { cast: false });
    handle.position.set(cx + doorW / 2 - 0.14, FLOOR + 1.15, -7.57);
    root.add(handle);
  }
  const coolerTop = box(coolerW + 0.2, 0.22, 0.7, white, { cast: false });
  coolerTop.position.set((coolerX0 + coolerX1) / 2, FLOOR + 2.34, -8.15);
  root.add(coolerTop);
  const coolerSign = box(coolerW + 0.18, 0.16, 0.05, new THREE.MeshBasicMaterial({ color: 0xdff3ff }), { cast: false });
  coolerSign.position.set((coolerX0 + coolerX1) / 2, FLOOR + 2.44, -7.72);
  root.add(coolerSign);

  // 货架（三条）
  const units = [
    { x: -1.45, z0: -7.15, z1: -2.45 },
    { x: 0.55, z0: -7.15, z1: -2.45 },
    { x: 2.55, z0: -7.15, z1: -2.45 },
  ];
  const items = [];
  for (const u of units) {
    const len = u.z1 - u.z0;
    const base = box(1.02, 0.28, len, toon(0xdad6c9), { cast: false });
    base.position.set(u.x, FLOOR + 0.14, (u.z0 + u.z1) / 2);
    root.add(base);
    const spine = box(0.06, 1.18, len, toon(0xe4e0d4), { cast: false });
    spine.position.set(u.x, FLOOR + 0.82, (u.z0 + u.z1) / 2);
    root.add(spine);
    const levels = [0.62, 0.92, 1.22, 1.44];
    for (const ly of levels) {
      const sh = box(0.96, 0.035, len - 0.06, shelfMat, { cast: false });
      sh.position.set(u.x, FLOOR + ly, (u.z0 + u.z1) / 2);
      root.add(sh);
      for (const side of [-1, 1]) {
        const n = 13;
        for (let i = 0; i < n; i++) {
          if (Math.random() < 0.14) continue;
          const z = u.z0 + 0.24 + (i / (n - 1)) * (len - 0.6);
          const h = 0.15 + Math.random() * 0.1;
          items.push({
            x: u.x + side * (0.2 + Math.random() * 0.04),
            y: FLOOR + ly + h / 2 + 0.02,
            z,
            w: 0.24 + Math.random() * 0.08,
            h,
            d: 0.13 + Math.random() * 0.06,
            ry: (Math.random() - 0.5) * 0.15,
            color: pick(Math.floor(Math.random() * 999)),
          });
        }
        // 价签条
        const tag = box(0.02, 0.05, len - 0.1, toon(0xfbfaf4), { cast: false });
        tag.position.set(u.x + side * 0.49, FLOOR + ly + 0.03, (u.z0 + u.z1) / 2);
        root.add(tag);
      }
    }
    // 端架促销
    const endcap = box(0.9, 0.12, 0.36, shelfMat, { cast: false });
    endcap.position.set(u.x, FLOOR + 0.86, u.z1 + 0.22);
    root.add(endcap);
    for (let i = 0; i < 5; i++) {
      items.push({
        x: u.x - 0.32 + i * 0.16,
        y: FLOOR + 1.02,
        z: u.z1 + 0.22,
        w: 0.12,
        h: 0.18,
        d: 0.12,
        color: pick(i + 3),
      });
    }
  }
  collectProducts(items, root);

  // 杂志架（靠左侧玻璃）
  const magItems = [];
  const rack = box(0.62, 0.9, 3.0, toon(0xdcd8cc), { cast: false });
  rack.position.set(-2.34, FLOOR + 0.45, -5.0);
  root.add(rack);
  for (let lvl = 0; lvl < 2; lvl++) {
    const y = FLOOR + 0.28 + lvl * 0.3;
    for (let i = 0; i < 10; i++) {
      magItems.push({
        x: -2.34,
        y: y + 0.16,
        z: -6.3 + i * 0.28,
        w: 0.2,
        h: 0.3,
        d: 0.24,
        ry: 0,
        color: pick(i + lvl * 4),
      });
    }
    const magShelf = box(0.66, 0.035, 3.0, shelfMat, { cast: false });
    magShelf.position.set(-2.34, y, -5.0);
    root.add(magShelf);
  }
  collectProducts(magItems, root);

  // 收银台
  const counter = box(3.1, 0.98, 1.15, counterMat, { outline: true, thick: 0.014, cast: false });
  counter.position.set(5.9, FLOOR + 0.49, -2.2);
  root.add(counter);
  const counterTop = box(3.2, 0.07, 1.25, toon(0xcfc6b4), { cast: false });
  counterTop.position.set(5.9, FLOOR + 1.01, -2.2);
  root.add(counterTop);
  const counterFront = box(3.1, 0.5, 0.05, toon(0xe9e3d4), { cast: false });
  counterFront.position.set(5.9, FLOOR + 0.55, -1.61);
  root.add(counterFront);

  // 收银机
  const posBase = box(0.42, 0.16, 0.34, toon(0x3c4149), { outline: true, thick: 0.008, cast: false });
  posBase.position.set(5.1, FLOOR + 1.13, -2.15);
  root.add(posBase);
  const posScreen = box(0.42, 0.3, 0.04, new THREE.MeshBasicMaterial({ color: 0x7fe0ff }), { cast: false });
  posScreen.position.set(5.1, FLOOR + 1.36, -2.22);
  posScreen.rotation.x = -0.18;
  root.add(posScreen);
  const scanner = box(0.24, 0.06, 0.24, toon(0x2d3238), { cast: false });
  scanner.position.set(5.75, FLOOR + 1.06, -1.95);
  root.add(scanner);
  // 关东煮锅
  const oden = box(0.62, 0.2, 0.42, toon(0xb9bcc0), { outline: true, thick: 0.008, cast: false });
  oden.position.set(6.7, FLOOR + 1.14, -2.2);
  root.add(oden);
  const odenSoup = box(0.54, 0.04, 0.34, toon(0xd8a24c), { cast: false });
  odenSoup.position.set(6.7, FLOOR + 1.25, -2.2);
  root.add(odenSoup);
  for (let i = 0; i < 5; i++) {
    const skewer = cylinder(0.012, 0.012, 0.16, 4, toon(0xcfae7a), { cast: false });
    skewer.position.set(6.53 + i * 0.085, FLOOR + 1.3, -2.2);
    skewer.rotation.z = 0.28;
    root.add(skewer);
  }
  // 热食柜
  const hotCase = box(0.62, 0.5, 0.44, toon(0xe9e2d0), { outline: true, thick: 0.01, cast: false });
  hotCase.position.set(4.35, FLOOR + 1.3, -2.2);
  root.add(hotCase);
  const hotGlass = pane(0.56, 0.36, 4.35, FLOOR + 1.35, -1.99);
  root.add(hotGlass);
  for (let i = 0; i < 4; i++) {
    const chicken = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), toon(0xe0a049));
    chicken.position.set(4.2 + i * 0.11, FLOOR + 1.14, -2.2);
    chicken.scale.y = 0.7;
    root.add(chicken);
  }
  // 购物篮
  for (let i = 0; i < 3; i++) {
    const basket = box(0.34, 0.12, 0.26, toon(0xd85a4a), { cast: false });
    basket.position.set(7.2, FLOOR + 0.08 + i * 0.1, -1.5);
    root.add(basket);
  }
  // 收银员背后：烟架 + 货架
  const backdrop = box(0.22, 1.5, 2.6, toon(0x3f4650), { outline: true, thick: 0.012, cast: false });
  backdrop.position.set(7.5, FLOOR + 1.55, -2.5);
  root.add(backdrop);
  const packItems = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 12; c++) {
      packItems.push({
        x: 7.36,
        y: FLOOR + 1.0 + r * 0.22,
        z: -3.65 + c * 0.19,
        w: 0.06,
        h: 0.17,
        d: 0.16,
        color: pick(c + r * 3),
      });
    }
  }
  collectProducts(packItems, root);
  // 咖啡机
  const coffeeCounter = box(1.7, 0.9, 0.7, toon(0xe7e2d4), { outline: true, thick: 0.012, cast: false });
  coffeeCounter.position.set(6.4, FLOOR + 0.45, -4.3);
  root.add(coffeeCounter);
  const coffee = box(0.52, 0.72, 0.46, toon(0x3c4046), { outline: true, thick: 0.01, cast: false });
  coffee.position.set(6.6, FLOOR + 1.28, -4.3);
  root.add(coffee);
  const coffeePanel = box(0.3, 0.22, 0.03, new THREE.MeshBasicMaterial({ color: 0xffd8a0 }), { cast: false });
  coffeePanel.position.set(6.6, FLOOR + 1.42, -4.06);
  root.add(coffeePanel);
  const cupStack = cylinder(0.14, 0.11, 0.3, 12, toon(0xf6f3e8), { cast: false });
  cupStack.position.set(5.9, FLOOR + 1.05, -4.3);
  root.add(cupStack);

  // 冰柜（岛式）
  const freezer = box(1.5, 0.92, 0.95, toon(0xe4dfd2), { outline: true, thick: 0.014, cast: false });
  freezer.position.set(5.4, FLOOR + 0.46, -5.9);
  root.add(freezer);
  const freezerLid = pane(1.36, 0.8, 5.4, FLOOR + 0.93, -5.9);
  freezerLid.rotation.x = -Math.PI / 2;
  freezerLid.rotation.z = 0;
  root.add(freezerLid);
  const iceItems = [];
  for (let i = 0; i < 14; i++) {
    iceItems.push({
      x: 4.8 + (i % 4) * 0.38,
      y: FLOOR + 0.98,
      z: -6.2 + Math.floor(i / 4) * 0.2,
      w: 0.24,
      h: 0.1,
      d: 0.16,
      color: pick(i + 5),
    });
  }
  collectProducts(iceItems, root);

  // 便当冷藏柜（后右侧）
  const bentoCase = box(2.3, 1.25, 0.75, toon(0xeae5d8), { outline: true, thick: 0.012, cast: false });
  bentoCase.position.set(5.2, FLOOR + 0.63, -7.2);
  root.add(bentoCase);
  const bentoGlass = pane(2.2, 0.6, 5.2, FLOOR + 1.05, -6.82);
  root.add(bentoGlass);
  const bentoItems = [];
  for (let i = 0; i < 12; i++) {
    bentoItems.push({
      x: 4.25 + (i % 6) * 0.34,
      y: FLOOR + 0.9,
      z: -7.05 + Math.floor(i / 6) * 0.28,
      w: 0.26,
      h: 0.09,
      d: 0.2,
      color: pick(i * 2 + 1),
    });
  }
  collectProducts(bentoItems, root);

  // 后场门 + 储物
  const staffDoor = box(0.95, 2.05, 0.06, toon(0x59616b), { outline: true, thick: 0.01, cast: false });
  staffDoor.position.set(6.6, FLOOR + 1.02, -8.62);
  root.add(staffDoor);
  const staffSign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.18),
    new THREE.MeshBasicMaterial({ color: 0xf3ead6 })
  );
  staffSign.position.set(6.6, FLOOR + 1.75, -8.58);
  root.add(staffSign);
  for (let i = 0; i < 3; i++) {
    const crate = box(0.5, 0.36, 0.5, toon(0xbfa980), { outline: true, thick: 0.008, cast: false });
    crate.position.set(3.95, FLOOR + 0.18 + i * 0.37, -8.2 + (i % 2) * 0.2);
    root.add(crate);
  }
  // 储物柜
  const locker = box(0.5, 1.8, 0.9, toon(0x9aa2a8), { outline: true, thick: 0.012, cast: false });
  locker.position.set(7.35, FLOOR + 0.9, -7.7);
  root.add(locker);

  // 墙面时钟
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.24, 20), new THREE.MeshBasicMaterial({ map: makeClockTexture() }));
  clock.position.set(2.0, 2.62, -8.6);
  root.add(clock);

  // 地面导视
  const arrowTex = makeFloorArrowTexture();
  for (const [x, z, rot] of [[2.0, -0.6, 0], [0.2, -3.2, 0.4], [4.6, -3.9, -1.57]]) {
    const a = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshBasicMaterial({ map: arrowTex, transparent: true }));
    a.rotation.x = -Math.PI / 2;
    a.rotation.z = rot;
    a.position.set(x, FLOOR + 0.02, z);
    root.add(a);
  }

  // 入口伞架 + 垃圾桶
  const umbBin = box(0.32, 0.5, 0.32, toon(0x6b7078), { outline: true, thick: 0.008, cast: false });
  umbBin.position.set(3.2, FLOOR + 0.25, 0.35);
  root.add(umbBin);

  // 店内暖光
  const lights = [];
  const l1 = new THREE.PointLight(0xffb877, 18, 18, 2);
  l1.position.set(1.8, 2.85, -3.4);
  root.add(l1);
  lights.push(l1);
  const l2 = new THREE.PointLight(0xffc78c, 15, 17, 2);
  l2.position.set(5.6, 2.8, -3.2);
  root.add(l2);
  lights.push(l2);
  const l3 = new THREE.PointLight(0xffbb7a, 11, 15, 2);
  l3.position.set(0.4, 2.4, -6.6);
  root.add(l3);
  lights.push(l3);
  const l4 = new THREE.PointLight(0xffb06c, 6, 11, 2);
  l4.position.set(1.6, 2.2, -0.9);
  root.add(l4);
  lights.push(l4);

  return { lights };
}

/* ============================================================ 组装 */

export function createStore(scene) {
  const root = new THREE.Group();
  const ext = createExterior(root);
  createInterior(root);
  scene.add(root);
  return { group: root, ...ext };
}
