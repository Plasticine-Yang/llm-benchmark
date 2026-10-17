import * as THREE from 'three';
import { BASE_SIZE, ROAD_Y, SIDEWALK_Y, STREET, STORE, PALETTE } from './config.js';
import {
  addBox,
  addCylinder,
  addGroundPlane,
  addGroundGlow,
  addGlowSprite,
  addPlane,
  addRoundedBox,
  addRodBetween,
  toon,
  standard,
  physical,
  basic,
  planeMaterial,
  canvasTexture,
  pavingTexture,
  asphaltTexture,
  tactileTexture,
  manholeTexture,
  roadStopTexture,
  plaqueTexture,
  reflectionTexture,
  puddleGeometry,
  shelfTagTexture,
  addTube,
  mulberry32,
  outlineOff,
  JP_FONT,
  LATIN_FONT,
} from './lib.js';

const SIDE = STREET.shopWalkRight;
const WALK_FRONT = STREET.shopWalkFront;

const sidewalkTop = SIDEWALK_Y + 0.004;
const roadTop = ROAD_Y + 0.005;

function cloneRepeat(tex, x, y) {
  const t = tex.clone();
  t.needsUpdate = true;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(x, y);
  return t;
}

function addPuddle(parent, x, z, rx, rz, seed, y, puddles) {
  const geo = puddleGeometry(rx, rz, seed);
  const mat = physical(0x0b1720, {
    roughness: 0.055,
    metalness: 0.72,
    clearcoat: 1,
    clearcoatRoughness: 0.035,
    transparent: true,
    opacity: 0.8,
    envMapIntensity: 1.65,
    side: THREE.DoubleSide,
    outline: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  mesh.renderOrder = 1;
  parent.add(mesh);

  // A low, soft rim catches the sky and makes the puddle sit in the pavement.
  const rimGeo = puddleGeometry(rx * 1.015, rz * 1.015, seed + 9);
  const rimMat = basic(0x6e97a9, {
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = -Math.PI / 2;
  rim.position.set(x, y + 0.001, z);
  rim.renderOrder = 2;
  parent.add(rim);

  puddles.push({ x, z, rx, rz, y: y + 0.006, seed });
  return mesh;
}

function addLine(parent, x, z, w, d, mat, ry = 0, y = roadTop, opacity = 1) {
  const m = addGroundPlane(parent, w, d, mat, x, y, z, { rotation: ry });
  m.receiveShadow = true;
  return m;
}

function baseAndGround(parent, ctx) {
  const ink = toon(0x0a111c);
  const trim = toon(0x2d3540);
  const brass = toon(0x8e7955, { emissive: 0x2d2418, emissiveIntensity: 0.25 });

  const baseBody = addRoundedBox(parent, BASE_SIZE + 0.05, 0.6, BASE_SIZE + 0.05, 0.1, ink, 0, -0.3, 0, {
    segments: 3,
    cast: true,
    receive: true,
  });
  baseBody.name = 'diorama-base';
  addRoundedBox(parent, BASE_SIZE + 0.09, 0.095, BASE_SIZE + 0.09, 0.085, trim, 0, -0.607, 0, {
    segments: 2,
    cast: true,
    receive: true,
  });
  addRoundedBox(parent, BASE_SIZE + 0.075, 0.062, BASE_SIZE + 0.075, 0.07, brass, 0, -0.032, 0, {
    segments: 2,
    cast: true,
    receive: true,
  });
  // Small corner blocks on the base fascia.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBox(parent, 0.16, 0.17, 0.06, brass, sx * 5.81, -0.25, sz * 6.015, {
        cast: false,
        receive: false,
      });
    }
  }

  // Brass maker plaque on the front face of the plinth.
  const plaqueTex = plaqueTexture();
  addPlane(parent, 3.55, 0.52, planeMaterial(plaqueTex, {}), 1.8, -0.31, BASE_SIZE / 2 + 0.028);
  for (const dx of [-1.61, 1.61]) {
    addCylinder(parent, 0.036, 0.036, 0.018, brass, 1.8 + dx, -0.31, BASE_SIZE / 2 + 0.045, {
      rx: Math.PI / 2,
      segments: 12,
      cast: false,
    });
  }

  // Raised shop-side pavement, forming an L around the store.
  const shopWalkW = SIDE + 6;
  const shopWalkD = WALK_FRONT + 6;
  const shopWalk = addBox(parent, shopWalkW, SIDEWALK_Y, shopWalkD, standard(0x63707c, { roughness: 0.72 }), -6 + shopWalkW / 2, SIDEWALK_Y / 2, -6 + shopWalkD / 2, {
    cast: false,
    receive: true,
  });
  shopWalk.name = 'shop-sidewalk';
  const paveTexture = pavingTexture();
  const walkMat = physical(0xffffff, {
    map: cloneRepeat(paveTexture, 5.8, 5.6),
    roughness: 0.38,
    metalness: 0.12,
    clearcoat: 0.75,
    clearcoatRoughness: 0.18,
    envMapIntensity: 0.7,
    outline: false,
  });
  const walkTop = addGroundPlane(parent, shopWalkW, shopWalkD, walkMat, -6 + shopWalkW / 2, sidewalkTop, -6 + shopWalkD / 2);
  walkTop.receiveShadow = true;

  // Near and far pavement strips complete the little diorama.
  const farWalkMat = physical(0xffffff, {
    map: cloneRepeat(paveTexture, 6, 0.37),
    roughness: 0.41,
    metalness: 0.08,
    clearcoat: 0.55,
    clearcoatRoughness: 0.22,
    envMapIntensity: 0.55,
    outline: false,
  });
  const nearWalk = addBox(parent, 12, SIDEWALK_Y, 0.45, standard(0x64717d, { roughness: 0.75 }), 0, SIDEWALK_Y / 2, 5.775, {
    cast: false,
    receive: true,
  });
  nearWalk.receiveShadow = true;
  addGroundPlane(parent, 12, 0.44, farWalkMat, 0, sidewalkTop, 5.775);
  const rightStrip = addBox(parent, 0.45, SIDEWALK_Y, 8.9, standard(0x64717d, { roughness: 0.75 }), 5.775, SIDEWALK_Y / 2, -1.55, {
    cast: false,
    receive: true,
  });
  rightStrip.receiveShadow = true;
  addGroundPlane(parent, 0.44, 8.9, cloneRepeat(paveTexture, 0.4, 4.8) && physical(0xffffff, {
    map: cloneRepeat(paveTexture, 0.4, 4.6),
    roughness: 0.42,
    metalness: 0.1,
    clearcoat: 0.5,
    envMapIntensity: 0.6,
    outline: false,
  }), 5.775, sidewalkTop, -1.55);

  // Asphalt roads.
  const asphalt = asphaltTexture();
  const roadMatMain = physical(0xffffff, {
    map: cloneRepeat(asphalt, 4, 1.3),
    roughness: 0.31,
    metalness: 0.23,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.15,
    outline: false,
  });
  const mainRoad = addGroundPlane(parent, 12, 2.65, roadMatMain, 0, roadTop, 4.225);
  mainRoad.name = 'main-road';
  mainRoad.receiveShadow = true;
  const roadMatSide = physical(0xffffff, {
    map: cloneRepeat(asphalt, 0.9, 3.1),
    roughness: 0.3,
    metalness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.09,
    envMapIntensity: 1.2,
    outline: false,
  });
  const sideRoad = addGroundPlane(parent, 2.43, 8.9, roadMatSide, 4.335, roadTop, -1.55);
  sideRoad.name = 'side-road';
  sideRoad.receiveShadow = true;

  // Wet gutter ribbons.
  const gutterMat = physical(0x202b35, {
    roughness: 0.12,
    metalness: 0.45,
    clearcoat: 1,
    envMapIntensity: 1.3,
    outline: false,
  });
  addBox(parent, 9.1, 0.02, 0.15, gutterMat, -1.44, 0.148, 2.96, { cast: false, receive: true });
  addBox(parent, 0.15, 0.02, 8.8, gutterMat, 3.2, 0.148, -1.47, { cast: false, receive: true });

  // Curb caps.
  const curbMat = toon(PALETTE.curb);
  addBox(parent, 9.18, 0.14, 0.16, curbMat, -1.41, 0.07, 2.98, { cast: true, receive: true });
  addBox(parent, 0.16, 0.14, 8.8, curbMat, 3.19, 0.07, -1.48, { cast: true, receive: true });
  addBox(parent, 12, 0.14, 0.15, curbMat, 0, 0.07, 5.55, { cast: true, receive: true });
  addBox(parent, 0.15, 0.14, 8.75, curbMat, 5.55, 0.07, -1.44, { cast: true, receive: true });
  // White highlight on the curb lip.
  const curbLip = basic(0xb7c4c5, { transparent: true, opacity: 0.38 });
  addBox(parent, 9.18, 0.012, 0.08, curbLip, -1.41, 0.143, 2.98, { cast: false, receive: false });
  addBox(parent, 0.08, 0.012, 8.8, curbLip, 3.19, 0.143, -1.48, { cast: false, receive: false });

  // Tactile paving at the crossing and toward the shop door.
  const tactileMat = physical(0xffffff, {
    map: tactileTexture(),
    roughness: 0.4,
    metalness: 0.04,
    clearcoat: 0.3,
    outline: false,
  });
  addGroundPlane(parent, 1.5, 0.3, tactileMat, 2.17, 0.154, 2.79);
  addGroundPlane(parent, 1.5, 0.26, tactileMat, 2.17, 0.154, 5.61);
  addGroundPlane(parent, 0.68, 0.28, tactileMat, 2.12, 0.154, 2.48);
  addGroundPlane(parent, 0.35, 0.36, tactileMat, 1.58, 0.154, 2.25);

  // Drainage grates.
  const grateMat = toon(0x303c46);
  const slotMat = basic(0x070b10);
  function grate(x, z, w = 0.72, d = 0.28, ry = 0) {
    const g = new THREE.Group();
    g.position.set(x, 0.153, z);
    g.rotation.y = ry;
    addBox(g, w, 0.03, d, grateMat, 0, 0, 0, { cast: false, receive: true });
    for (let i = 0; i < 8; i++) {
      addBox(g, w / 10, 0.012, d * 0.78, slotMat, -w * 0.39 + i * w * 0.11, 0.02, 0, {
        cast: false,
        receive: false,
      });
    }
    parent.add(g);
  }
  grate(-0.2, 2.91);
  grate(2.82, 2.91, 0.55, 0.26);
  grate(3.12, -1.6, 0.26, 0.72, Math.PI / 2);
  grate(4.8, 5.48, 0.62, 0.25);
  grate(-4.9, 2.76, 0.55, 0.25);

  // Rainwater channel seam down the side street.
  addGroundPlane(parent, 0.06, 2.65, basic(0x060a0f, { transparent: true, opacity: 0.6 }), 5.15, roadTop + 0.002, 4.2);

  return { shopWalk, walkTop, mainRoad, sideRoad };
}

function roadMarkings(parent) {
  const whiteMat = physical(0xe4e5d7, {
    roughness: 0.38,
    metalness: 0.02,
    clearcoat: 0.7,
    clearcoatRoughness: 0.2,
    envMapIntensity: 0.7,
    outline: false,
  });
  const fadedWhite = physical(0xd3d5c9, {
    roughness: 0.5,
    metalness: 0.02,
    clearcoat: 0.4,
    envMapIntensity: 0.45,
    outline: false,
  });
  whiteMat.color.multiplyScalar(0.92);

  // Wide foreground zebra crossing, its paint catching the shop glow.
  for (let i = 0; i < 4; i++) {
    addLine(parent, 2.18, 3.2 + i * 0.6, 1.62, 0.36, whiteMat, 0, roadTop + 0.004);
  }
  // Slightly worn stop line before the side street crossing.
  addLine(parent, 4.32, 2.58, 2.12, 0.18, fadedWhite, 0, roadTop + 0.004);
  addLine(parent, 5.28, 1.45, 2.0, 0.08, fadedWhite, 0, roadTop + 0.004);

  // A modest lane edge, kept intentionally imperfect.
  for (let i = 0; i < 3; i++) {
    addLine(parent, -5.25 + i * 1.22, 4.09, 0.7, 0.055, fadedWhite, 0, roadTop + 0.003);
  }
  addLine(parent, -1.18, 3.11, 1.8, 0.055, fadedWhite, 0, roadTop + 0.003);

  // Parking bay in the side street.
  const bayLine = 0.08;
  addLine(parent, 4.48, -2.0, 2.35, bayLine, fadedWhite, 0, roadTop + 0.003);
  addLine(parent, 3.36, -0.88, bayLine, 2.22, fadedWhite, 0, roadTop + 0.003);
  addLine(parent, 5.52, -0.88, bayLine, 2.22, fadedWhite, 0, roadTop + 0.003);
  addLine(parent, 4.45, 0.22, 2.15, bayLine, fadedWhite, 0, roadTop + 0.003);

  // P lettering and parking text.
  const ptex = canvasTexture(384, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(225,228,211,0.72)';
    ctx.font = `800 350px ${'"Arial Narrow", "Helvetica Neue", sans-serif'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P', w / 2, 225);
    ctx.font = `700 40px ${'"Hiragino Sans", sans-serif'}`;
    ctx.fillText('駐車場', w / 2, 448);
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 110; i++) {
      ctx.globalAlpha = 0.25;
      ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 50, 2 + Math.random() * 4);
    }
  });
  addGroundPlane(parent, 1.05, 1.4, basic(0xffffff, { map: ptex, transparent: true, depthWrite: false, opacity: 0.8 }), 4.45, roadTop + 0.007, -1.0);
  addBox(parent, 1.6, 0.1, 0.14, toon(0xa7a99a), 4.48, 0.07, -2.06, { cast: false, receive: true });

  // STOP characters on the narrow side street.
  const stopTex = roadStopTexture();
  addGroundPlane(parent, 1.7, 1.05, basic(0xffffff, { map: stopTex, transparent: true, opacity: 0.8, depthWrite: false }), 4.34, roadTop + 0.008, 1.55);

  // A manhole cover as a little dark jewel of wet detail.
  const mTex = manholeTexture();
  const manholeMat = physical(0xffffff, {
    map: mTex,
    transparent: true,
    roughness: 0.22,
    metalness: 0.45,
    clearcoat: 1,
    envMapIntensity: 1.15,
    outline: false,
    side: THREE.DoubleSide,
  });
  const manhole = new THREE.Mesh(new THREE.CircleGeometry(0.46, 32), manholeMat);
  manhole.rotation.x = -Math.PI / 2;
  manhole.position.set(4.42, roadTop + 0.006, 4.42);
  manhole.receiveShadow = true;
  parent.add(manhole);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.025, 6, 32), toon(0x8e918b));
  rim.rotation.x = -Math.PI / 2;
  rim.position.set(4.42, roadTop + 0.004, 4.42);
  parent.add(rim);
}

function alleyAndBuildings(parent, ctx) {
  const neighborMat = toon(0x343941);
  const neighborTrim = toon(0x202730);
  const plaster = toon(0x6f6f66);
  const pipeMat = toon(0x3b454e);
  const rusty = toon(0x6f4e3c);

  // Neighbouring narrow building at the left edge of the diorama.
  const neighbour = new THREE.Group();
  neighbour.position.set(-5.62, SIDEWALK_Y, -1.77);
  parent.add(neighbour);
  addBox(neighbour, 0.78, 6.05, 7.25, neighborMat, 0, 3.025, 0, { cast: true, receive: true });
  addBox(neighbour, 0.9, 0.18, 7.4, neighborTrim, -0.02, 6.12, 0, { cast: true, receive: true });
  // Facade pilasters.
  addBox(neighbour, 0.02, 6.0, 0.12, neighborTrim, 0.4, 3.0, 3.63, { cast: false });
  addBox(neighbour, 0.86, 0.14, 0.22, neighborTrim, 0, 4.84, 3.64, { cast: true });
  addBox(neighbour, 0.86, 0.12, 0.22, neighborTrim, 0, 2.85, 3.64, { cast: true });
  // Shuttered little bar at street level.
  const shutterTex = canvasTexture(512, 512, (ctx2, w, h) => {
    ctx2.fillStyle = '#3c4448';
    ctx2.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 28) {
      ctx2.fillStyle = y % 56 === 0 ? '#4b5458' : '#333b40';
      ctx2.fillRect(0, y, w, 15);
      ctx2.fillStyle = 'rgba(255,255,255,0.05)';
      ctx2.fillRect(0, y + 1, w, 2);
    }
    ctx2.strokeStyle = 'rgba(16,22,25,0.6)';
    ctx2.lineWidth = 4;
    for (let x = 0; x < w; x += 28) {
      ctx2.beginPath();
      ctx2.moveTo(x, 0);
      ctx2.lineTo(x, h);
      ctx2.stroke();
    }
    ctx2.fillStyle = 'rgba(114,91,66,0.24)';
    for (let i = 0; i < 45; i++) {
      ctx2.fillRect(Math.random() * w, Math.random() * h, 6 + Math.random() * 25, 3 + Math.random() * 50);
    }
  });
  addPlane(neighbour, 0.7, 1.75, planeMaterial(shutterTex), 0.01, 0.94, 3.63, { ry: 0 });
  addBox(neighbour, 0.76, 0.08, 0.16, neighborTrim, 0, 1.87, 3.6, { cast: true });
  addBox(neighbour, 0.7, 0.12, 0.18, toon(0x8c7a5e), 0, 1.91, 3.52, { cast: true });

  // Warm window with lace curtain, high above the alley.
  addBox(neighbour, 0.035, 1.02, 1.8, toon(0x171d25), 0.4, 4.75, 1.38, { cast: false });
  const winTex = canvasTexture(512, 320, (ctx2, w, h) => {
    const g = ctx2.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#f5c580');
    g.addColorStop(0.55, '#e49255');
    g.addColorStop(1, '#9b5436');
    ctx2.fillStyle = g;
    ctx2.fillRect(0, 0, w, h);
    ctx2.fillStyle = 'rgba(255,248,218,0.65)';
    for (let x = 20; x < w; x += 34) {
      ctx2.beginPath();
      ctx2.arc(x, 0, 48, 0, Math.PI * 2);
      ctx2.fill();
    }
    ctx2.fillStyle = 'rgba(66,44,35,0.42)';
    ctx2.fillRect(0, h * 0.56, w, h * 0.44);
    ctx2.fillStyle = 'rgba(255,225,171,0.34)';
    ctx2.fillRect(w * 0.14, h * 0.6, w * 0.2, h * 0.3);
    ctx2.strokeStyle = '#3e302b';
    ctx2.lineWidth = 10;
    ctx2.beginPath();
    ctx2.moveTo(w / 2, 0);
    ctx2.lineTo(w / 2, h);
    ctx2.stroke();
  });
  addPlane(neighbour, 0.62, 0.96, planeMaterial(winTex), 0.406, 4.76, 1.38, { ry: Math.PI / 2 });
  // Lace curtain edge.
  addBox(neighbour, 0.018, 0.52, 1.68, basic(0xf5dfba, { transparent: true, opacity: 0.26 }), 0.42, 4.59, 1.38, { cast: false, receive: false });

  // Small window AC and pipework on neighbour facade.
  addBox(neighbour, 0.35, 0.38, 0.62, toon(0xb9b5a5), 0.56, 3.32, 1.52, { cast: true });
  for (let i = 0; i < 4; i++) {
    addBox(neighbour, 0.02, 0.02, 0.5, toon(0x646b6a), 0.745, 3.2 + i * 0.055, 1.52, { cast: false });
  }
  addTube(neighbour, [[0.35, 3.12, 1.6], [0.48, 2.9, 1.6], [0.5, 2.4, 1.61], [0.49, 1.9, 1.6]], 0.022, pipeMat, { segments: 16, radialSegments: 5 });
  addBox(neighbour, 0.03, 2.8, 0.035, rusty, 0.36, 2.1, 3.55, { cast: false });

  // Vertical old snack-bar sign, quietly pink against the blue night.
  const signTex = canvasTexture(256, 1024, (ctx2, w, h) => {
    ctx2.fillStyle = '#281e2b';
    ctx2.fillRect(0, 0, w, h);
    ctx2.strokeStyle = '#ff9fbe';
    ctx2.lineWidth = 6;
    ctx2.strokeRect(12, 12, w - 24, h - 24);
    ctx2.save();
    ctx2.translate(w / 2, 120);
    ctx2.fillStyle = '#ff9fbe';
    ctx2.font = `700 88px ${'"Hiragino Mincho ProN", "Yu Mincho", serif'}`;
    ctx2.textAlign = 'center';
    ctx2.fillText('ス', 0, 0);
    ctx2.fillText('ナ', 0, 100);
    ctx2.fillText('ッ', 0, 200);
    ctx2.fillText('ク', 0, 300);
    ctx2.restore();
    ctx2.strokeStyle = 'rgba(255,159,190,0.55)';
    ctx2.lineWidth = 3;
    ctx2.beginPath();
    ctx2.arc(w / 2, 520, 58, 0, Math.PI * 2);
    ctx2.stroke();
    drawLocalStar(ctx2, w / 2, 520, 31, 9, '#ffd8a6');
    ctx2.save();
    ctx2.translate(w / 2, 650);
    ctx2.fillStyle = '#f6e7bb';
    ctx2.font = `700 66px ${'"Hiragino Mincho ProN", serif'}`;
    ctx2.textAlign = 'center';
    ctx2.fillText('星', 0, 0);
    ctx2.restore();
    ctx2.fillStyle = 'rgba(255,159,190,0.8)';
    ctx2.font = `700 24px ${'"Avenir Next", sans-serif'}`;
    ctx2.textAlign = 'center';
    ctx2.letterSpacing = '4px';
    ctx2.fillText('SNACK BAR', w / 2, 910);
    ctx2.fillStyle = '#ff9fbe';
    ctx2.fillRect(34, 954, w - 68, 4);
  });
  // The same little bar's neon blade sign, this time on the street facade.
  addBox(neighbour, 0.46, 1.52, 0.16, toon(0x211b28), 0.08, 3.96, 3.64, { cast: true });
  addPlane(neighbour, 0.4, 1.42, planeMaterial(signTex), 0.08, 3.96, 3.728, { renderOrder: 6 });
  addGlowSprite(neighbour, 0xff9bc0, 2.4, 0.08, 3.96, 3.84, 0.12);
  // A tiny entry lantern under the blade sign.
  addBox(neighbour, 0.16, 0.2, 0.16, toon(0x46372d), 0.08, 3.02, 3.78, { cast: true });
  addBox(neighbour, 0.1, 0.13, 0.1, basic(0xffd69b), 0.08, 3.0, 3.82, { cast: false });
  addGlowSprite(neighbour, 0xffca91, 0.7, 0.08, 3.0, 3.9, 0.1);

  addBox(neighbour, 0.18, 1.55, 0.47, toon(0x241e2b), 0.55, 3.58, 2.48, { cast: true });
  addPlane(neighbour, 0.39, 1.43, planeMaterial(signTex), 0.646, 3.58, 2.48, { ry: Math.PI / 2 });
  addPlane(neighbour, 0.39, 1.43, planeMaterial(signTex), 0.46, 3.58, 2.48, { ry: -Math.PI / 2 });

  // The outer left wall is the biggest surface visible from the model's left
  // orbit, so it gets a faded hand-painted advertisement, windows and services.
  const gableAd = canvasTexture(1300, 920, (ctx2, w, h) => {
    ctx2.fillStyle = '#e7dcc3';
    ctx2.fillRect(0, 0, w, h);
    ctx2.fillStyle = '#22494a';
    ctx2.fillRect(0, h * 0.68, w, h * 0.32);
    ctx2.fillStyle = '#cf7e55';
    ctx2.beginPath();
    ctx2.arc(w * 0.2, h * 0.3, 110, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = '#f3e6c9';
    ctx2.beginPath();
    ctx2.arc(w * 0.2, h * 0.3, 82, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = '#2a4e4d';
    ctx2.font = `700 94px ${JP_FONT}`;
    ctx2.textAlign = 'left';
    ctx2.fillText('雨の日も', 430, 220);
    ctx2.fillText('いつもの店で。', 430, 330);
    ctx2.fillStyle = '#936d48';
    ctx2.font = `700 35px ${LATIN_FONT}`;
    ctx2.letterSpacing = '6px';
    ctx2.fillText('HOSHIZORA MART', 436, 406);
    ctx2.letterSpacing = '0px';
    ctx2.fillStyle = '#52746a';
    ctx2.font = `600 28px ${JP_FONT}`;
    ctx2.fillText('星見町二丁目  /  24 HOURS  /  SINCE 1998', 436, 462);
    // Faux window illustration.
    ctx2.fillStyle = '#3d6f65';
    ctx2.fillRect(824, 120, 300, 360);
    ctx2.fillStyle = '#f5dca8';
    ctx2.fillRect(844, 140, 260, 320);
    ctx2.fillStyle = '#4c735d';
    ctx2.fillRect(844, 315, 260, 145);
    ctx2.fillStyle = '#d98659';
    ctx2.beginPath();
    ctx2.arc(1110, 236, 42, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = '#f0e6ce';
    ctx2.fillRect(960, 302, 26, 24);
    ctx2.fillStyle = 'rgba(37,75,71,0.3)';
    for (let i = 0; i < 8; i++) ctx2.fillRect(120, 610 + i * 24, 1060 - i * 42, 4);
    // Weathering and flaking paint.
    ctx2.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 220; i++) {
      ctx2.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.13})`;
      ctx2.beginPath();
      ctx2.ellipse(Math.random() * w, Math.random() * h, 2 + Math.random() * 16, 1 + Math.random() * 7, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx2.fill();
    }
    ctx2.globalCompositeOperation = 'source-over';
    // Steel bracket frame overlay.
    ctx2.strokeStyle = 'rgba(30,50,48,0.6)';
    ctx2.lineWidth = 7;
    ctx2.strokeRect(12, 12, w - 24, h - 24);
    ctx2.fillStyle = '#f1e5cc';
    ctx2.font = `700 26px ${LATIN_FONT}`;
    ctx2.textAlign = 'right';
    ctx2.fillText('星見町商店街', w - 52, h - 67);
  });
  addBox(neighbour, 0.03, 2.18, 3.54, toon(0x2a3033), -0.398, 3.12, -0.55, { cast: false });
  addPlane(neighbour, 3.4, 2.06, planeMaterial(gableAd), -0.418, 3.12, -0.55, { ry: -Math.PI / 2, renderOrder: 2 });
  addCylinder(neighbour, 0.035, 0.035, 3.5, pipeMat, -0.42, 2.2, -3.5, { segments: 6, cast: true });
  const sideWin = canvasTexture(560, 420, (ctx2, w, h) => {
    const g = ctx2.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ebc987');
    g.addColorStop(1, '#b9784f');
    ctx2.fillStyle = g;
    ctx2.fillRect(0, 0, w, h);
    ctx2.fillStyle = 'rgba(56,45,39,0.65)';
    ctx2.fillRect(0, h * 0.6, w, h * 0.4);
    ctx2.fillStyle = 'rgba(252,238,198,0.4)';
    ctx2.fillRect(60, 40, 130, h - 80);
    ctx2.fillStyle = 'rgba(69,50,43,0.55)';
    ctx2.beginPath();
    ctx2.arc(w * 0.7, h * 0.6, 80, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.strokeStyle = '#3f3a31';
    ctx2.lineWidth = 12;
    ctx2.beginPath();
    ctx2.moveTo(w / 2, 0);
    ctx2.lineTo(w / 2, h);
    ctx2.stroke();
  });
  for (const [wz, lit] of [[2.75, true], [-4.55, false]]) {
    addBox(neighbour, 0.035, 1.2, 1.08, toon(0x252d30), -0.42, 4.46, wz, { cast: false });
    addPlane(neighbour, 0.94, 1.04, lit ? planeMaterial(sideWin) : toon(0x3b4545), -0.44, 4.46, wz, { ry: -Math.PI / 2 });
    addBox(neighbour, 0.12, 0.07, 0.3, toon(0x6e7170), -0.5, 3.82, wz, { cast: true });
    if (lit) addGlowSprite(neighbour, 0xffd49c, 1.6, -0.55, 4.45, wz, 0.08);
  }
  addBox(neighbour, 0.28, 0.36, 0.48, toon(0xa7a898), -0.58, 3.37, 2.75, { cast: true });
  for (let i = 0; i < 4; i++) addBox(neighbour, 0.02, 0.02, 0.4, toon(0x646b66), -0.72, 3.27 + i * 0.05, 2.75, { cast: false });
  addBox(neighbour, 0.02, 0.5, 0.36, toon(0x3a4b49), -0.404, 2.12, 3.25, { cast: false });
  addBox(neighbour, 0.02, 0.04, 0.3, toon(0x8f8d7b), -0.418, 2.3, 3.25, { cast: false });
  addCylinder(neighbour, 0.025, 0.025, 2.8, toon(0x4c5a58), -0.43, 1.6, 3.55, { segments: 6, cast: false });
  addGlowSprite(neighbour, 0xffca8b, 1.4, -0.58, 2.95, 3.1, 0.055);
  addBox(neighbour, 0.34, 0.06, 0.24, toon(0x212b2c), -0.52, 2.95, 3.1, { cast: true });
  addBox(neighbour, 0.26, 0.025, 0.18, basic(0xffd9a1), -0.52, 2.91, 3.1, { rx: Math.PI / 2 });
  // A narrow service pipe bracket that reads from the side.

  // Side of the neighbour: another warm window, a little balcony and rooftop clutter.
  addBox(neighbour, 0.035, 1.15, 1.05, toon(0x171d25), 0.4, 4.46, -1.55, { cast: false });
  addPlane(neighbour, 0.83, 1.0, planeMaterial(winTex), 0.425, 4.46, -1.55, { ry: Math.PI / 2 });
  addBox(neighbour, 0.05, 0.05, 1.13, toon(0x78664d), 0.42, 3.94, -1.55, { cast: true });
  for (let i = 0; i < 4; i++) {
    addRodBetween(neighbour, [0.48, 3.95, -2.08 + i * 0.35], [0.48, 4.36, -2.08 + i * 0.35], 0.008, toon(0x3c4649), { cast: false });
  }
  addRodBetween(neighbour, [0.48, 4.3, -2.08], [0.48, 4.3, -1.03], 0.01, toon(0x3c4649), { cast: false });
  addRodBetween(neighbour, [0.48, 3.98, -2.08], [0.48, 3.98, -1.03], 0.008, toon(0x3c4649), { cast: false });
  addCylinder(neighbour, 0.13, 0.11, 0.2, toon(0x8c7558), 0.55, 3.99, -1.8, { segments: 9, cast: true });
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.1, 4, 4), toon(i % 2 ? 0x3e6b52 : 0x628d68));
    leaf.position.set(0.55 + (i % 2) * 0.05, 4.13 + (i % 3) * 0.04, -1.8 + (i - 2) * 0.035);
    leaf.scale.set(1.2, 0.6, 0.8);
    neighbour.add(leaf);
  }
  addBox(neighbour, 0.34, 0.32, 0.52, toon(0xaab0a2), 0.58, 3.42, -2.3, { cast: true });
  for (let i = 0; i < 4; i++) addBox(neighbour, 0.02, 0.02, 0.42, toon(0x646d68), 0.76, 3.32 + i * 0.05, -2.3, { cast: false });
  addTube(neighbour, [[0.38, 3.58, -2.3], [0.5, 3.3, -2.3], [0.52, 2.8, -2.25], [0.52, 2.2, -2.1]], 0.018, pipeMat, { segments: 14, radialSegments: 4 });
  // Rooftop railing and water tank.
  for (let i = 0; i < 5; i++) {
    addCylinder(neighbour, 0.018, 0.018, 0.52, toon(0x485354), 0.32, 6.44, -3.0 + i * 1.55, { segments: 5, cast: false });
  }
  addRodBetween(neighbour, [0.32, 6.68, -3.05], [0.32, 6.68, 3.25], 0.018, toon(0x485354), { cast: false });
  addRodBetween(neighbour, [0.32, 6.45, -3.05], [0.32, 6.45, 3.25], 0.012, toon(0x485354), { cast: false });
  addCylinder(neighbour, 0.32, 0.32, 0.65, toon(0x858d83), -0.05, 6.55, 0.9, { segments: 12, cast: true });
  addCylinder(neighbour, 0.35, 0.35, 0.04, toon(0x5d6660), -0.05, 6.89, 0.9, { segments: 12, cast: false });
  addGlowSprite(neighbour, 0xffd69a, 1.45, 0.58, 4.45, -1.55, 0.11);
  addGlowSprite(neighbour, 0xffd69a, 0.8, 0.55, 3.95, -1.8, 0.05);

  // Alley floor stain and wetness.
  const alleyMat = physical(0x252429, {
    roughness: 0.24,
    metalness: 0.32,
    clearcoat: 0.9,
    envMapIntensity: 0.7,
    transparent: true,
    opacity: 0.76,
    outline: false,
  });
  addGroundPlane(parent, 1.17, 6.45, alleyMat, -4.64, 0.151, -1.45);

  // Alley walls, pipes, doors and a tiny warm lamp.
  const alleySideMat = toon(0x3d4447);
  addBox(parent, 0.08, 3.2, 6.4, alleySideMat, -5.24, 1.74, -1.45, { cast: true });
  // Vertical pipes and electric conduit.
  for (const [px, pz] of [[-5.17, 1.1], [-5.17, -0.6], [-4.14, -0.25]]) {
    addCylinder(parent, 0.035, 0.035, 3.0, pipeMat, px, 1.63, pz, { segments: 7, cast: true });
    addCylinder(parent, 0.052, 0.052, 0.08, rusty, px, 0.1, pz, { segments: 8, cast: false });
  }
  addBox(parent, 0.6, 0.5, 0.25, toon(0x4b4b45), -4.75, 1.08, 0.72, { cast: true });
  addCylinder(parent, 0.16, 0.16, 0.04, toon(0x62675f), -4.75, 1.1, 0.853, { rx: Math.PI / 2, segments: 16, cast: false });
  for (let i = 0; i < 5; i++) {
    addBox(parent, 0.24, 0.016, 0.018, toon(0x83857a), -4.75, 1.0 + i * 0.05, 0.86, { cast: false });
  }
  // Back door under a tiny lamp.
  addBox(parent, 0.88, 2.02, 0.08, toon(0x2c3e43), -4.6, 1.15, -4.5, { cast: true });
  addBox(parent, 0.66, 0.96, 0.025, toon(0x1b262d), -4.6, 1.16, -4.46, { cast: false });
  addBox(parent, 0.76, 0.05, 0.03, toon(0x8c8d80), -4.6, 2.15, -4.45, { cast: false });
  addCylinder(parent, 0.035, 0.035, 0.15, toon(0x9c9d8d), -4.28, 1.11, -4.4, { segments: 8, cast: false });
  addBox(parent, 0.2, 0.06, 0.2, toon(0x202a2e), -4.4, 2.35, -4.43, { cast: true });
  addBox(parent, 0.17, 0.025, 0.17, basic(0xffd6a0), -4.4, 2.315, -4.43, { rx: Math.PI / 2 });
  ctx.lights.push({ type: 'point', color: 0xffc687, intensity: 5.5, distance: 4.2, pos: [-4.35, 2.15, -3.95] });

  // Crates, bags and a broom in the alley.
  const crateMat = toon(0x8c5c42);
  addBox(parent, 0.43, 0.22, 0.34, crateMat, -4.82, 0.25, -2.58, { cast: true });
  addBox(parent, 0.37, 0.18, 0.3, toon(0x75523f), -4.82, 0.46, -2.58, { cast: true, rx: 0.03 });
  addBox(parent, 0.38, 0.18, 0.3, toon(0x916a4b), -4.36, 0.25, -3.25, { cast: true, ry: 0.1 });
  const bagMat = toon(0x3c4f50);
  for (let i = 0; i < 3; i++) {
    addCylinder(parent, 0.24, 0.28, 0.45, bagMat, -4.45 + i * 0.14, 0.38 + i * 0.03, 1.05 - i * 0.08, {
      segments: 7,
      cast: true,
      rz: i * 0.2,
    });
    addCylinder(parent, 0.045, 0.06, 0.1, toon(0x2e3b3d), -4.45 + i * 0.14, 0.64 + i * 0.03, 1.05 - i * 0.08, {
      segments: 6,
      cast: false,
    });
  }
  addCylinder(parent, 0.018, 0.018, 1.5, toon(0x7b6449), -5.0, 0.87, -2.2, { segments: 5, cast: false, rz: -0.07 });
  addBox(parent, 0.3, 0.04, 0.12, toon(0x4a3f2c), -5.05, 1.63, -2.2, { cast: false, rz: -0.07 });

  // Hanging spider plant beside the alley entrance.
  const plantGroup = new THREE.Group();
  plantGroup.position.set(-4.23, 2.38, 1.55);
  parent.add(plantGroup);
  addCylinder(plantGroup, 0.17, 0.13, 0.18, toon(0x826c54), 0, 0, 0, { segments: 9 });
  for (let i = 0; i < 8; i++) {
    const leafMat = toon(i % 2 ? 0x5b8058 : 0x719568);
    const leaf = addBox(plantGroup, 0.045, 0.45 + (i % 3) * 0.14, 0.06, leafMat, 0, -0.2, 0, {
      rz: -0.8 + i * 0.24,
      ry: i * 1.1,
      cast: true,
    });
    leaf.position.x += Math.cos(i * 1.7) * 0.12;
    leaf.position.z += Math.sin(i * 1.3) * 0.12;
  }
  addRodBetween(parent, [-4.23, 2.58, 1.55], [-4.23, 3.0, 1.55], 0.012, pipeMat, { cast: false });

  // Rear service yard and boundary wall.
  addBox(parent, 7.9, 0.84, 0.12, toon(0x353d42), -1.45, 0.56, -5.72, { cast: true, receive: true });
  for (let i = 0; i < 13; i++) {
    addBox(parent, 0.08, 0.8, 0.13, toon(0x454e52), -5.4 + i * 0.63, 0.55, -5.71, { cast: false });
  }
  addBox(parent, 7.95, 0.08, 0.18, toon(0x747c7b), -1.45, 1.02, -5.72, { cast: true });
  // Hedge behind the wall.
  const rng = mulberry32(12);
  for (let i = 0; i < 22; i++) {
    const x = -5.1 + rng() * 7.7;
    const rg = new THREE.IcosahedronGeometry(0.22 + rng() * 0.22, 0);
    const bush = new THREE.Mesh(rg, toon(i % 3 ? 0x2f5748 : 0x376654));
    bush.position.set(x, 1.16 + rng() * 0.22, -5.66 + (rng() - 0.5) * 0.18);
    bush.scale.set(1.3, 0.8, 1);
    bush.castShadow = true;
    parent.add(bush);
  }
  // Back wall service door, pipes and lamp on the shop.
  addBox(parent, 0.95, 2.05, 0.08, toon(0x354c50), -3.2, 1.19, -4.62, { cast: true });
  addBox(parent, 0.66, 0.75, 0.03, toon(0x26373c), -3.2, 1.1, -4.57, { cast: false });
  addBox(parent, 0.1, 0.07, 0.04, toon(0x9e9e8d), -3.55, 1.15, -4.56, { cast: false });
  addBox(parent, 0.3, 0.06, 0.28, toon(0x222b2d), -2.7, 2.38, -4.56, { cast: true });
  addBox(parent, 0.24, 0.02, 0.22, basic(0xc5e8dc), -2.7, 2.345, -4.56, { rx: Math.PI / 2 });
  ctx.lights.push({ type: 'point', color: 0xa4e4d2, intensity: 3.5, distance: 3.6, pos: [-2.7, 2.1, -4.1] });
  addTube(parent, [[-4.0, 0.2, -4.54], [-4.0, 2.2, -4.54], [-3.96, 3.0, -4.54]], 0.03, pipeMat, { segments: 12, radialSegments: 5 });
  const acUnit = new THREE.Group();
  acUnit.position.set(0.3, 0.84, -5.3);
  parent.add(acUnit);
  addBox(acUnit, 0.75, 0.58, 0.42, toon(0xc3bca8), 0, 0, 0, { cast: true });
  addCylinder(acUnit, 0.2, 0.2, 0.015, toon(0x59615e), -0.12, 0.02, 0.215, { rx: Math.PI / 2, segments: 14, cast: false });
  for (let i = 0; i < 4; i++) {
    addBox(acUnit, 0.35, 0.018, 0.015, toon(0x6e7570), 0.02, -0.19 + i * 0.11, 0.222, { cast: false });
  }
  addBox(acUnit, 0.8, 0.05, 0.5, toon(0x555d5d), 0.02, -0.33, 0, { cast: false });
  addTube(parent, [[0.65, 1.13, -5.3], [0.72, 1.6, -5.3], [0.72, 2.05, -5.18], [0.6, 2.1, -4.7]], 0.022, pipeMat, { segments: 16, radialSegments: 4 });
  // Small recycling station against the back.
  addBox(parent, 0.56, 0.9, 0.5, toon(0x496d63), 1.2, 0.58, -5.3, { cast: true });
  addBox(parent, 0.5, 0.06, 0.44, toon(0x283e38), 1.2, 1.05, -5.3, { cast: false });
  addPlane(parent, 0.36, 0.2, basic(0xdde9cf, { map: canvasTexture(256, 128, (c, w, h) => {
    c.fillStyle = '#dce7d2';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#3b6254';
    c.font = `700 36px ${'"Hiragino Sans", sans-serif'}`;
    c.textAlign = 'center';
    c.fillText('資源回収', w / 2, 72);
  }) }), 1.2, 0.72, -5.04);

  // Rear bicycle, old and parked at an angle.
  ctx.buildRearBicycle?.(parent);

  // A decorative wrapped parcel/poster tube by the back door.
  addCylinder(parent, 0.08, 0.08, 0.75, toon(0xa8936d), -3.85, 0.5, -5.05, { rx: 0.1, segments: 8, cast: true, rz: 0.6 });
}

function drawLocalStar(ctx, cx, cy, outer, inner, color, points = 4) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (Math.PI * i) / points;
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function puddlesAndReflections(parent, ctx) {
  const puddles = [];
  // Sidewalk rainwater.
  addPuddle(parent, -2.9, 2.36, 1.15, 0.38, 7, 0.155, puddles);
  addPuddle(parent, 1.5, 2.52, 0.8, 0.3, 13, 0.155, puddles);
  addPuddle(parent, -4.63, 0.3, 0.3, 0.85, 22, 0.155, puddles);
  addPuddle(parent, 2.62, -1.2, 0.24, 1.2, 31, 0.155, puddles);
  addPuddle(parent, -1.4, 1.9, 0.42, 0.22, 41, 0.155, puddles);
  addPuddle(parent, 4.8, 5.76, 0.75, 0.16, 5, 0.155, puddles);
  addPuddle(parent, 5.76, 0.65, 0.12, 1.1, 27, 0.155, puddles);
  addPuddle(parent, 1.2, -5.3, 0.9, 0.2, 11, 0.155, puddles);

  // Street puddles, catching all the little sign colours.
  addPuddle(parent, 0.8, 4.85, 1.25, 0.36, 19, 0.035, puddles);
  addPuddle(parent, 4.16, 3.85, 0.46, 0.22, 33, 0.035, puddles);
  addPuddle(parent, 3.7, 0.98, 0.7, 0.2, 8, 0.035, puddles);
  addPuddle(parent, 5.1, 1.75, 0.35, 0.17, 12, 0.035, puddles);
  addPuddle(parent, 4.78, -3.2, 0.22, 0.8, 15, 0.035, puddles);
  addPuddle(parent, 3.55, 5.12, 0.42, 0.2, 24, 0.035, puddles);

  // Storefront reflection, a painted ribbon of warm and mint neon.
  const shopReflTex = reflectionTexture(['rgba(255,171,89,0.95)', 'rgba(255,231,163,0.8)', 'rgba(83,232,199,0.65)', 'rgba(255,110,135,0.5)'], 5, 32);
  const reflMat = basic(0xffffff, {
    map: shopReflTex,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const shopRefl = addGroundPlane(parent, 6.2, 2.42, reflMat, -0.53, 0.039, 4.15);
  shopRefl.renderOrder = 3;
  const walkReflMat = basic(0xffffff, {
    map: reflectionTexture(['rgba(255,193,120,0.8)', 'rgba(255,228,174,0.55)', 'rgba(112,221,189,0.35)'], 9, 18),
    transparent: true,
    opacity: 0.56,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  addGroundPlane(parent, 5.8, 1.02, walkReflMat, -0.45, 0.159, 2.36);

  // Vending machine spilling cyan-pink light.
  const vendRefl = addGroundPlane(parent, 1.25, 2.3, basic(0xffffff, {
    map: reflectionTexture(['rgba(91,233,224,0.9)', 'rgba(255,121,177,0.8)', 'rgba(255,206,132,0.6)'], 13, 12),
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  }), -4.35, 0.041, 2.95);
  vendRefl.renderOrder = 3;

  // A stronger foreground spill, full of broken neon colours.
  const neonPool = addGroundPlane(parent, 6.9, 2.55, basic(0xffffff, {
    map: reflectionTexture(['rgba(255,168,92,0.76)', 'rgba(255,228,157,0.5)', 'rgba(93,229,203,0.42)', 'rgba(255,111,159,0.3)'], 31, 34),
    transparent: true,
    opacity: 0.54,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  }), -0.45, 0.046, 4.33);
  neonPool.renderOrder = 3;

  // Vending-machine ribbon on the sidewalk and into the gutter.
  addGroundPlane(parent, 1.5, 2.1, basic(0xffffff, {
    map: reflectionTexture(['rgba(96,241,229,0.92)', 'rgba(255,130,177,0.8)', 'rgba(255,236,172,0.6)'], 43, 15),
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  }), -4.35, 0.156, 3.18);
  // A magenta glimmer from the snack bar, reaching the wet pavement.
  addGroundGlow(parent, 0xff78b2, 3.6, 2.1, -4.6, 2.8, 0.16, 0.157);
  addGroundGlow(parent, 0xffdeae, 2.0, 1.0, -3.8, 2.2, 0.14, 0.157);

  // Cool streetlamp reflection, long and fragmented.
  addGroundPlane(parent, 0.85, 3.0, basic(0xffffff, {
    map: reflectionTexture(['rgba(164,221,255,0.9)', 'rgba(255,225,162,0.55)', 'rgba(120,194,197,0.4)'], 21, 10),
    transparent: true,
    opacity: 0.56,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  }), 2.92, 0.038, 4.48);

  // Crosswalk glints under the shop lights.
  for (let i = 0; i < 4; i++) {
    addGroundGlow(parent, i % 2 ? 0xffd7a5 : 0x9ce9e2, 1.8, 0.9, 2.15, 3.18 + i * 0.6, 0.09, 0.042);
  }
  addGroundGlow(parent, 0xffbd7e, 5.9, 1.4, -0.7, 3.55, 0.12, 0.043);
  addGroundGlow(parent, 0x9fe4ff, 1.9, 2.6, 3.15, 3.95, 0.13, 0.044);
  addGroundGlow(parent, 0xff91b9, 1.2, 1.8, -4.55, 2.95, 0.12, 0.048);

  // Sidewalk painted reflections.
  addGroundGlow(parent, 0xffc887, 4.6, 1.35, 0.1, 2.2, 0.27, 0.16);
  addGroundGlow(parent, 0x72dfcd, 1.6, 1.0, 2.45, 2.55, 0.17, 0.16);

  ctx.puddles = puddles;
  return puddles;
}

function addWetDust(parent) {
  const rng = mulberry32(52);
  const geo = new THREE.BufferGeometry();
  const count = 240;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (rng() - 0.5) * 12;
    pos[i * 3 + 1] = 0.2 + rng() * 3.6;
    pos[i * 3 + 2] = (rng() - 0.5) * 12;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0x95b8cc,
    size: 0.018,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  parent.add(points);
}

export function buildEnvironment(ctx) {
  const group = new THREE.Group();
  group.name = 'street-and-diorama-base';
  ctx.scene.add(group);
  baseAndGround(group, ctx);
  roadMarkings(group);
  alleyAndBuildings(group, ctx);
  puddlesAndReflections(group, ctx);
  addWetDust(group);
  return { group, puddles: ctx.puddles ?? [] };
}
