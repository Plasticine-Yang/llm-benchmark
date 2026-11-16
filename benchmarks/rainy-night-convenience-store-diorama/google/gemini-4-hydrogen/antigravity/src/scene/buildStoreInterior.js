import * as THREE from 'three';
import {
  createCelMaterial,
  createCelMesh,
  createCanvasTexture,
  addOutline,
  addCreaseLines,
} from '../utils/toonFactory.js';

function createInteriorTextures() {
  // 1. Clean warm-cream Konbini tiled floor + directional floor decals (地面导视)
  const floorTex = createCanvasTexture(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#efe5d6';
    ctx.fillRect(0, 0, w, h);

    // Subtle alternating tile shade + crisp cel grout lines
    const cols = 16;
    const rows = 14;
    const cw = w / cols;
    const ch = h / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#f3eadb' : '#ebe0ce';
        ctx.fillRect(c * cw + 1, r * ch + 1, cw - 2, ch - 2);
      }
    }
    ctx.strokeStyle = 'rgba(130, 118, 105, 0.35)';
    ctx.lineWidth = 2;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cw, 0);
      ctx.lineTo(c * cw, h);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * ch);
      ctx.lineTo(w, r * ch);
      ctx.stroke();
    }

    // Map store interior X in [-5.5, 1.9] (7.4m), Z in [-5.7, 0.95] (6.65m)
    const toPxX = (wx) => ((wx + 5.5) / 7.4) * w;
    const toPxY = (wz) => ((wz + 5.7) / 6.65) * h;

    // Floor guidance decals (地面导视): Emerald path + queue footprints near checkout!
    ctx.fillStyle = '#259e6b';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;

    // Welcome arrow from entrance (+0.2, +0.6) toward checkout (+0.25, -1.2)
    const drawArrow = (wx, wz) => {
      const px = toPxX(wx);
      const py = toPxY(wz);
      ctx.save();
      ctx.translate(px, py);
      ctx.fillStyle = '#26a670';
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(9, 4);
      ctx.lineTo(3, 4);
      ctx.lineTo(3, 11);
      ctx.lineTo(-3, 11);
      ctx.lineTo(-3, 4);
      ctx.lineTo(-9, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    drawArrow(0.22, 0.35);
    drawArrow(0.22, -0.42);

    // Queue waiting circles ("ここでお待ちください") in front of checkout
    [
      { x: 0.22, z: -1.18, color: '#ff8a3d' },
      { x: -0.68, z: -1.18, color: '#26a670' },
    ].forEach((spot) => {
      const px = toPxX(spot.x);
      const py = toPxY(spot.z);
      ctx.save();
      ctx.translate(px, py);
      ctx.fillStyle = spot.color;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff9ee';
      ctx.lineWidth = 4;
      ctx.stroke();
      // Stylized footprints
      ctx.fillStyle = '#fff9ee';
      ctx.beginPath();
      ctx.ellipse(-7, 0, 5, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(7, 0, 5, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  });

  // 2. Crisp Anime Promotional Posters
  const makePoster = (bg, accent, title, sub) =>
    createCanvasTexture(256, 360, (ctx, w, h) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = accent;
      ctx.fillRect(14, 14, w - 28, h * 0.56);
      ctx.fillStyle = '#fff9ee';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.34, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.34, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#192038';
      ctx.font = 'bold 34px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, w * 0.5, h * 0.78);
      ctx.fillStyle = accent;
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(sub, w * 0.5, h * 0.89);
      ctx.strokeStyle = '#181c30';
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, w - 8, h - 8);
    });

  const posterOden = makePoster('#fff4de', '#e95d38', 'おでんフェア', '全品 10% OFF');
  const posterCoffee = makePoster('#212a42', '#e8a24b', '挽きたて珈琲', 'SORA CAFE ¥120');
  const posterSweets = makePoster('#ffe9f0', '#e35c8a', '限定スイーツ', '新発売！');

  // 3. Magazine cover sheet (tiled atlas feel via single drawing per batch)
  const makeMagTex = (bg, stripe, label) =>
    createCanvasTexture(128, 176, (ctx, w, h) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = stripe;
      ctx.fillRect(0, 0, w, 34);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, w * 0.5, 24);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.56, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = stripe;
      ctx.fillRect(14, h - 26, w - 28, 12);
      ctx.strokeStyle = '#181c30';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, w - 4, h - 4);
    });

  const magTextures = [
    makeMagTex('#ff7894', '#23315c', 'WEEKLY'),
    makeMagTex('#53b8ff', '#ff5733', 'MANGA'),
    makeMagTex('#ffd858', '#1b8a5a', 'ANIME'),
    makeMagTex('#a884ff', '#ff477e', 'MUSIC'),
    makeMagTex('#58e0b0', '#232840', 'TOWN'),
  ];

  // 4. Overhead Lightbox Header Signs (店内灯箱)
  const makeHeaderTex = (bg, accent, text) =>
    createCanvasTexture(512, 128, (ctx, w, h) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = accent;
      ctx.fillRect(0, h - 18, w, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, w * 0.5, h * 0.44);
    });

  const headerDrinks = makeHeaderTex('#1d72b8', '#42c4ff', 'DRINKS  お飲み物');
  const headerBento = makeHeaderTex('#269463', '#ff8e3c', 'お弁当・おにぎり');
  const headerAisle1 = makeHeaderTex('#fff9ed', '#22a66d', 'スナック・カップ麺');
  const headerAisle2 = makeHeaderTex('#fff9ed', '#ff7b3a', 'お菓子・日用品');

  return {
    floorTex,
    posterOden,
    posterCoffee,
    posterSweets,
    magTextures,
    headerDrinks,
    headerBento,
    headerAisle1,
    headerAisle2,
  };
}

export function buildStoreInterior() {
  const group = new THREE.Group();
  group.name = 'StoreInterior';
  const tex = createInteriorTextures();
  const floorY = 0.16;

  // --- 1. Floor & Ceiling ---
  const floorMat = createCelMaterial({
    color: 0xffffff,
    map: tex.floorTex,
    rimColor: 0xffe4be,
    rimStrength: 0.08,
    shadowTint: 0x62534b,
    shadowTintStrength: 0.25,
  });
  const floorMesh = createCelMesh(new THREE.BoxGeometry(7.4, 0.04, 6.65), floorMat, {
    outline: false,
    castShadow: false,
  });
  floorMesh.position.set(-1.8, floorY - 0.015, -2.375);
  group.add(floorMesh);

  // Warm interior ceiling & 6 glowing recessed fluorescent panels (店内灯箱)
  const ceilingMat = createCelMaterial({
    color: 0xf7efe0,
    emissive: 0x3b2d1b,
    rimStrength: 0.05,
  });
  const ceilingMesh = createCelMesh(new THREE.BoxGeometry(7.38, 0.05, 6.62), ceilingMat, {
    outline: false,
    castShadow: false,
  });
  ceilingMesh.position.set(-1.8, 3.08, -2.38);
  group.add(ceilingMesh);

  const panelMat = new THREE.MeshBasicMaterial({ color: 0xfff3d8 });
  const panelFrameMat = createCelMaterial({ color: 0xd6cdb8, rimStrength: 0.1 });
  const panelXs = [-3.9, -1.8, 0.4];
  const panelZs = [-4.0, -1.0];
  panelXs.forEach((px) => {
    panelZs.forEach((pz) => {
      const frame = createCelMesh(new THREE.BoxGeometry(1.52, 0.04, 0.44), panelFrameMat, {
        outline: false,
        castShadow: false,
      });
      frame.position.set(px, 3.05, pz);
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 0.34), panelMat);
      glow.rotation.x = Math.PI / 2;
      glow.position.set(px, 3.028, pz);
      group.add(frame, glow);
    });
  });

  // --- 2. Backroom Door & Employee/Parcel Lockers (后场门、储物柜) ---
  const doorMat = createCelMaterial({ color: 0xcfd6dc, rimColor: 0xffdfb8, rimStrength: 0.18 });
  const doorFrameMat = createCelMaterial({ color: 0x454f68, rimColor: 0xffdfb8, rimStrength: 0.15 });
  const staffDoor = createCelMesh(new THREE.BoxGeometry(0.92, 2.08, 0.06), doorMat, {
    outline: true,
    outlineThickness: 1.2,
    crease: true,
  });
  staffDoor.position.set(-4.85, floorY + 1.04, -5.56);
  group.add(staffDoor);

  // Small porthole & push bar & STAFF sign
  const porthole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16),
    new THREE.MeshBasicMaterial({ color: 0x26324d })
  );
  porthole.rotation.x = Math.PI / 2;
  porthole.position.set(-4.85, floorY + 1.56, -5.55);
  const pushBar = createCelMesh(new THREE.BoxGeometry(0.58, 0.05, 0.06), doorFrameMat, {
    outline: false,
  });
  pushBar.position.set(-4.85, floorY + 0.98, -5.51);
  const staffSign = createCelMesh(
    new THREE.BoxGeometry(0.46, 0.14, 0.02),
    { color: 0xe65245, emissive: 0x3b120e },
    { outline: false }
  );
  staffSign.position.set(-4.85, floorY + 1.85, -5.52);
  group.add(porthole, pushBar, staffSign);

  // 2 tall steel storage lockers (储物柜) next to backroom door
  const lockerMat = createCelMaterial({ color: 0x7e8ea8, rimColor: 0xffdfb8, rimStrength: 0.22 });
  [-3.95, -3.45].forEach((lx) => {
    const locker = createCelMesh(new THREE.BoxGeometry(0.46, 1.88, 0.50), lockerMat, {
      outline: true,
      outlineThickness: 1.2,
      crease: true,
    });
    locker.position.set(lx, floorY + 0.94, -5.36);
    group.add(locker);

    const handle = createCelMesh(new THREE.BoxGeometry(0.03, 0.14, 0.04), doorFrameMat, {
      outline: false,
    });
    handle.position.set(lx + 0.16, floorY + 1.05, -5.10);
    group.add(handle);
  });

  // --- 3. Bento & Onigiri Open Chiller (便当区、饭团) ---
  const chillerBodyMat = createCelMaterial({ color: 0x273045, rimColor: 0xffe4bc, rimStrength: 0.2 });
  const chillerInnerWarm = createCelMaterial({
    color: 0xfff5e4,
    emissive: 0x554229,
    rimStrength: 0.1,
  });
  const bentoUnit = new THREE.Group();
  bentoUnit.position.set(-1.75, floorY, -5.22);

  const bentoBack = createCelMesh(new THREE.BoxGeometry(2.34, 2.16, 0.72), chillerBodyMat, {
    outline: true,
    outlineThickness: 1.35,
    crease: true,
  });
  bentoBack.position.y = 1.08;
  bentoUnit.add(bentoBack);

  const bentoCavity = createCelMesh(new THREE.BoxGeometry(2.20, 1.48, 0.12), chillerInnerWarm, {
    outline: false,
    castShadow: false,
  });
  bentoCavity.position.set(0, 1.08, 0.31);
  bentoUnit.add(bentoCavity);

  // Backlit header sign ("お弁当・おにぎり")
  const bentoHeader = new THREE.Mesh(
    new THREE.PlaneGeometry(2.26, 0.34),
    new THREE.MeshBasicMaterial({ map: tex.headerBento })
  );
  bentoHeader.position.set(0, 1.96, 0.37);
  bentoUnit.add(bentoHeader);

  // 4 shelves inside bento case
  const shelfPlateMat = createCelMaterial({ color: 0xf4eee0, emissive: 0x221b11 });
  [0.48, 0.84, 1.20, 1.54].forEach((sy) => {
    const sh = createCelMesh(new THREE.BoxGeometry(2.18, 0.03, 0.44), shelfPlateMat, {
      outline: false,
    });
    sh.position.set(0, sy, 0.18);
    bentoUnit.add(sh);
  });

  // Populate Onigiri (top 2 shelves) & Bento boxes (bottom 2 shelves)
  const riceGeom = new THREE.CylinderGeometry(0.055, 0.068, 0.055, 3);
  const riceMat = createCelMaterial({ color: 0xfffbf0, emissive: 0x2a241b, rimStrength: 0.15 });
  const noriGeom = new THREE.BoxGeometry(0.08, 0.058, 0.062);
  const noriMat = createCelMaterial({ color: 0x1b2421, rimStrength: 0.1 });

  const onigiriCount = 28;
  const riceInst = new THREE.InstancedMesh(riceGeom, riceMat, onigiriCount);
  const noriInst = new THREE.InstancedMesh(noriGeom, noriMat, onigiriCount);
  const dummy = new THREE.Object3D();
  let idx = 0;
  for (let row = 0; row < 2; row++) {
    const sy = row === 0 ? 1.25 : 1.59;
    for (let col = 0; col < 14; col++) {
      const ox = -0.96 + col * 0.148;
      dummy.position.set(ox, sy, 0.25);
      dummy.rotation.set(Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      riceInst.setMatrixAt(idx, dummy.matrix);
      dummy.position.set(ox, sy - 0.008, 0.25);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      noriInst.setMatrixAt(idx, dummy.matrix);
      idx++;
    }
  }
  riceInst.instanceMatrix.needsUpdate = true;
  noriInst.instanceMatrix.needsUpdate = true;
  bentoUnit.add(riceInst, noriInst);

  // Bento boxes (bottom 2 shelves)
  const bentoTrayMat = createCelMaterial({ color: 0x1f222e });
  const bentoFoodColors = [0xff7755, 0xf5cb4d, 0x62be6f, 0xff9eb5, 0xf2a649];
  for (let row = 0; row < 2; row++) {
    const sy = row === 0 ? 0.52 : 0.88;
    for (let col = 0; col < 7; col++) {
      const bx = -0.90 + col * 0.30;
      const tray = createCelMesh(new THREE.BoxGeometry(0.24, 0.045, 0.18), bentoTrayMat, {
        outline: false,
      });
      tray.position.set(bx, sy, 0.24);
      const food = createCelMesh(
        new THREE.BoxGeometry(0.18, 0.025, 0.13),
        {
          color: bentoFoodColors[(row * 7 + col) % bentoFoodColors.length],
          emissive: 0x1a120a,
        },
        { outline: false }
      );
      food.position.set(bx, sy + 0.028, 0.24);
      bentoUnit.add(tray, food);
    }
  }
  group.add(bentoUnit);

  // --- 4. Open Refrigerated Drink Wall (饮料柜) ---
  const drinkUnit = new THREE.Group();
  drinkUnit.position.set(0.68, floorY, -5.22);

  const drinkCabinet = createCelMesh(new THREE.BoxGeometry(2.26, 2.24, 0.72), chillerBodyMat, {
    outline: true,
    outlineThickness: 1.4,
    crease: true,
  });
  drinkCabinet.position.y = 1.12;
  drinkUnit.add(drinkCabinet);

  // Cool sky-white backlit fridge interior wall
  const drinkGlowWall = new THREE.Mesh(
    new THREE.PlaneGeometry(2.12, 1.56),
    new THREE.MeshBasicMaterial({ color: 0xdff5ff })
  );
  drinkGlowWall.position.set(0, 1.10, 0.365);
  drinkUnit.add(drinkGlowWall);

  const drinkHeader = new THREE.Mesh(
    new THREE.PlaneGeometry(2.18, 0.34),
    new THREE.MeshBasicMaterial({ map: tex.headerDrinks })
  );
  drinkHeader.position.set(0, 2.02, 0.37);
  drinkUnit.add(drinkHeader);

  // 5 drink shelves + ~105 instanced colorful bottles & cans!
  const drinkShelfYs = [0.40, 0.72, 1.04, 1.36, 1.66];
  drinkShelfYs.forEach((sy) => {
    const sh = createCelMesh(new THREE.BoxGeometry(2.14, 0.028, 0.42), shelfPlateMat, {
      outline: false,
    });
    sh.position.set(0, sy, 0.22);
    drinkUnit.add(sh);
  });

  const bottleGeom = new THREE.CylinderGeometry(0.032, 0.035, 0.18, 10);
  const bottleMat = createCelMaterial({
    color: 0xffffff,
    emissive: 0x16222c,
    rimColor: 0xe6f8ff,
    rimStrength: 0.25,
    wetness: 0.35,
  });
  const totalBottles = 5 * 20;
  const bottleInst = new THREE.InstancedMesh(bottleGeom, bottleMat, totalBottles);
  const bottlePalette = [
    new THREE.Color(0x2fb973), // green tea
    new THREE.Color(0x4cb5ff), // sports drink
    new THREE.Color(0xf45d52), // cola / soda
    new THREE.Color(0xf7c948), // lemon / energy
    new THREE.Color(0xf7f7fa), // milk / calpis
    new THREE.Color(0x8d5738), // iced coffee
    new THREE.Color(0xff9248), // orange juice
  ];
  let bIdx = 0;
  for (let r = 0; r < 5; r++) {
    const sy = drinkShelfYs[r] + 0.105;
    for (let c = 0; c < 20; c++) {
      const bx = -0.96 + c * 0.101;
      dummy.position.set(bx, sy, 0.27);
      dummy.rotation.set(0, 0, 0);
      const scaleH = r >= 3 ? 0.78 : 1.0; // cans on top shelves, bottles below
      dummy.scale.set(1, scaleH, 1);
      dummy.updateMatrix();
      bottleInst.setMatrixAt(bIdx, dummy.matrix);
      bottleInst.setColorAt(bIdx, bottlePalette[(r * 3 + Math.floor(c / 2)) % bottlePalette.length]);
      bIdx++;
    }
  }
  dummy.scale.set(1, 1, 1);
  bottleInst.instanceMatrix.needsUpdate = true;
  if (bottleInst.instanceColor) bottleInst.instanceColor.needsUpdate = true;
  drinkUnit.add(bottleInst);
  group.add(drinkUnit);

  // --- 5. Left Wall Snack Rack & Promotional Posters (货架、宣传海报) ---
  const shelfSteelMat = createCelMaterial({ color: 0xf4eee3, rimColor: 0xffe2bc, rimStrength: 0.15 });
  const shelfAccentMat = createCelMaterial({ color: 0x269d6b, rimStrength: 0.2 });

  const wallRack = new THREE.Group();
  wallRack.position.set(-5.20, floorY, -2.55);
  const wallRackBack = createCelMesh(new THREE.BoxGeometry(0.10, 1.92, 3.0), shelfSteelMat, {
    outline: true,
    outlineThickness: 1.25,
    crease: true,
  });
  wallRackBack.position.set(-0.18, 0.96, 0);
  wallRack.add(wallRackBack);

  const packGeom = new THREE.BoxGeometry(0.14, 0.18, 0.16);
  const packMat = createCelMaterial({ color: 0xffffff, emissive: 0x16120c, rimStrength: 0.12 });
  const wallPacks = new THREE.InstancedMesh(packGeom, packMat, 4 * 14);
  const snackColors = [
    new THREE.Color(0xff6b57),
    new THREE.Color(0xffd04d),
    new THREE.Color(0x52b6ff),
    new THREE.Color(0x5ad489),
    new THREE.Color(0xf786b6),
    new THREE.Color(0xfff4e0),
  ];
  let wpIdx = 0;
  [0.34, 0.72, 1.12, 1.52].forEach((sy, r) => {
    const plank = createCelMesh(new THREE.BoxGeometry(0.38, 0.03, 2.94), shelfSteelMat, {
      outline: false,
    });
    plank.position.set(0.02, sy, 0);
    wallRack.add(plank);

    for (let c = 0; c < 14; c++) {
      dummy.position.set(0.05, sy + 0.105, -1.32 + c * 0.203);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      wallPacks.setMatrixAt(wpIdx, dummy.matrix);
      wallPacks.setColorAt(wpIdx, snackColors[(r + c) % snackColors.length]);
      wpIdx++;
    }
  });
  wallPacks.instanceMatrix.needsUpdate = true;
  if (wallPacks.instanceColor) wallPacks.instanceColor.needsUpdate = true;
  wallRack.add(wallPacks);
  group.add(wallRack);

  // Promotional Wall Posters (宣传海报)
  [
    { x: -5.42, y: 2.38, z: -3.2, ry: Math.PI / 2, map: tex.posterOden },
    { x: -5.42, y: 2.38, z: -1.8, ry: Math.PI / 2, map: tex.posterSweets },
    { x: 1.82, y: 2.25, z: -3.7, ry: -Math.PI / 2, map: tex.posterCoffee },
  ].forEach((p) => {
    const poster = new THREE.Mesh(
      new THREE.PlaneGeometry(0.68, 0.96),
      new THREE.MeshBasicMaterial({ map: p.map })
    );
    poster.position.set(p.x, p.y, p.z);
    poster.rotation.y = p.ry;
    group.add(poster);
  });

  // --- 6. Central Parallel Gondola Shelves (整齐排列的货架、零食陈列) ---
  const buildGondola = (cx, cz, headerMap) => {
    const gond = new THREE.Group();
    gond.position.set(cx, floorY, cz);

    // Center spine + base plinth + end-cap panels
    const spine = createCelMesh(new THREE.BoxGeometry(2.45, 1.38, 0.08), shelfSteelMat, {
      outline: true,
      outlineThickness: 1.3,
      crease: true,
    });
    spine.position.y = 0.69;
    const basePlinth = createCelMesh(new THREE.BoxGeometry(2.50, 0.14, 0.68), shelfAccentMat, {
      outline: true,
      outlineThickness: 1.2,
    });
    basePlinth.position.y = 0.07;
    gond.add(spine, basePlinth);

    const gondShelfYs = [0.22, 0.54, 0.88, 1.20];
    const itemsPerRow = 13;
    const itemInst = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.14, 0.19, 0.14),
      packMat,
      gondShelfYs.length * 2 * itemsPerRow
    );
    const priceRailMat = createCelMaterial({ color: 0xffd54f, emissive: 0x2c2000 });

    let gIdx = 0;
    gondShelfYs.forEach((sy, r) => {
      const sh = createCelMesh(new THREE.BoxGeometry(2.42, 0.03, 0.66), shelfSteelMat, {
        outline: false,
      });
      sh.position.y = sy;
      gond.add(sh);

      // Price tag strip on front (+Z) and back (-Z) edges
      [-0.335, 0.335].forEach((pz, sideIdx) => {
        const rail = createCelMesh(new THREE.BoxGeometry(2.42, 0.028, 0.015), priceRailMat, {
          outline: false,
        });
        rail.position.set(0, sy - 0.01, pz);
        gond.add(rail);

        const zItem = sideIdx === 0 ? -0.19 : 0.19;
        for (let c = 0; c < itemsPerRow; c++) {
          const ix = -1.08 + c * 0.18;
          dummy.position.set(ix, sy + 0.11, zItem);
          dummy.rotation.set(0, ((c + r) % 3 - 1) * 0.06, 0);
          dummy.scale.set(1, r === 3 ? 0.82 : 1.0, 1);
          dummy.updateMatrix();
          itemInst.setMatrixAt(gIdx, dummy.matrix);
          itemInst.setColorAt(
            gIdx,
            snackColors[(r * 2 + c + sideIdx * 3) % snackColors.length]
          );
          gIdx++;
        }
      });
    });
    dummy.scale.set(1, 1, 1);
    itemInst.instanceMatrix.needsUpdate = true;
    if (itemInst.instanceColor) itemInst.instanceColor.needsUpdate = true;
    gond.add(itemInst);

    // Hanging overhead illuminated aisle category sign (店内灯箱)
    const signBox = createCelMesh(new THREE.BoxGeometry(1.75, 0.34, 0.08), shelfSteelMat, {
      outline: true,
      outlineThickness: 1.1,
    });
    signBox.position.set(0, 2.35, 0);
    const signFaceF = new THREE.Mesh(
      new THREE.PlaneGeometry(1.70, 0.30),
      new THREE.MeshBasicMaterial({ map: headerMap })
    );
    signFaceF.position.set(0, 2.35, 0.045);
    const signFaceB = signFaceF.clone();
    signFaceB.rotation.y = Math.PI;
    signFaceB.position.z = -0.045;

    const rodMat = createCelMaterial({ color: 0x9aa4bd });
    [-0.68, 0.68].forEach((rx) => {
      const rod = createCelMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.56, 8), rodMat, {
        outline: false,
      });
      rod.position.set(rx, 2.75, 0);
      gond.add(rod);
    });
    gond.add(signBox, signFaceF, signFaceB);

    group.add(gond);
  };

  buildGondola(-2.55, -2.98, tex.headerAisle1);
  buildGondola(-2.55, -1.48, tex.headerAisle2);

  // --- 7. Checkout Counter, Oden Counter, Hot Steamer & Coffee Machine ---
  const counterGroup = new THREE.Group();
  counterGroup.position.set(0, floorY, 0);

  const counterBodyMat = createCelMaterial({
    color: 0xe6d4bc,
    rimColor: 0xfff0d6,
    rimStrength: 0.18,
  });
  const counterTopMat = createCelMaterial({
    color: 0xfbf6ec,
    rimColor: 0xffffff,
    rimStrength: 0.2,
  });
  const woodTrimMat = createCelMaterial({ color: 0xc28e5c, rimStrength: 0.15 });
  const darkMetalMat = createCelMaterial({
    color: 0x262d42,
    rimColor: 0x96b8f0,
    rimStrength: 0.22,
    wetness: 0.2,
  });

  // Main front-facing register counter (X: -0.05..1.72, Z: -2.20)
  const mainBase = createCelMesh(new THREE.BoxGeometry(1.78, 0.86, 0.68), counterBodyMat, {
    outline: true,
    outlineThickness: 1.4,
    crease: true,
  });
  mainBase.position.set(0.84, 0.43, -2.20);
  const mainTop = createCelMesh(new THREE.BoxGeometry(1.84, 0.06, 0.74), counterTopMat, {
    outline: true,
    outlineThickness: 1.2,
  });
  mainTop.position.set(0.84, 0.89, -2.20);
  const frontAccent = createCelMesh(new THREE.BoxGeometry(1.79, 0.12, 0.02), shelfAccentMat, {
    outline: false,
  });
  frontAccent.position.set(0.84, 0.68, -1.85);
  counterGroup.add(mainBase, mainTop, frontAccent);

  // Right-wing Coffee Station Counter (X: 1.40, Z: -1.85..-0.72)
  const wingBase = createCelMesh(new THREE.BoxGeometry(0.66, 0.86, 1.15), counterBodyMat, {
    outline: true,
    outlineThickness: 1.4,
    crease: true,
  });
  wingBase.position.set(1.40, 0.43, -1.30);
  const wingTop = createCelMesh(new THREE.BoxGeometry(0.72, 0.06, 1.20), counterTopMat, {
    outline: true,
    outlineThickness: 1.2,
  });
  wingTop.position.set(1.40, 0.89, -1.30);
  counterGroup.add(wingBase, wingTop);

  // POS Cash Register Terminal (X: 0.22, Z: -2.18)
  const posStand = createCelMesh(new THREE.BoxGeometry(0.32, 0.08, 0.28), darkMetalMat, {
    outline: true,
    outlineThickness: 1.0,
  });
  posStand.position.set(0.22, 0.96, -2.18);
  const posScreen = createCelMesh(new THREE.BoxGeometry(0.28, 0.22, 0.04), darkMetalMat, {
    outline: true,
    outlineThickness: 1.0,
  });
  posScreen.position.set(0.22, 1.13, -2.22);
  posScreen.rotation.x = -0.25;
  const posGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.24, 0.17),
    new THREE.MeshBasicMaterial({ color: 0x9ce2ff })
  );
  posGlow.position.set(0.22, 1.13, -2.195);
  posGlow.rotation.x = -0.25;
  counterGroup.add(posStand, posScreen, posGlow);

  // Hot Nikuman Steamer Box (X: 0.68, Z: -2.15)
  const steamerFrame = createCelMesh(new THREE.BoxGeometry(0.32, 0.42, 0.30), woodTrimMat, {
    outline: true,
    outlineThickness: 1.1,
    crease: true,
  });
  steamerFrame.position.set(0.68, 1.13, -2.15);
  const steamerGlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.30, 0.26),
    new THREE.MeshBasicMaterial({ color: 0xffd18c, transparent: true, opacity: 0.82 })
  );
  steamerGlow.position.set(0.68, 1.13, -2.15);
  counterGroup.add(steamerFrame, steamerGlow);

  // Oden Counter (关东煮柜台) at (X: 1.18, Z: -2.15) — super visible from front & right!
  const steelMat = createCelMaterial({ color: 0xc9d2e3, rimColor: 0xffffff, rimStrength: 0.35, wetness: 0.4 });
  const odenRim = createCelMesh(new THREE.BoxGeometry(0.46, 0.11, 0.38), steelMat, {
    outline: true,
    outlineThickness: 1.1,
    crease: true,
  });
  odenRim.position.set(1.18, 0.97, -2.15);
  const odenBroth = new THREE.Mesh(
    new THREE.PlaneGeometry(0.40, 0.32),
    new THREE.MeshBasicMaterial({ color: 0xf4ae44 })
  );
  odenBroth.rotation.x = -Math.PI / 2;
  odenBroth.position.set(1.18, 1.03, -2.15);

  // Cute oden food pieces sitting in the broth (daikon, tamago, chikuwa, konnyaku)
  const daikonMat = createCelMaterial({ color: 0xffeacc, emissive: 0x452b0d });
  const konnyakuMat = createCelMaterial({ color: 0x777185, emissive: 0x1b1822 });
  [
    { x: 1.08, z: -2.21, g: new THREE.CylinderGeometry(0.032, 0.032, 0.025, 10), m: daikonMat },
    { x: 1.18, z: -2.21, g: new THREE.SphereGeometry(0.028, 10, 8), m: daikonMat },
    { x: 1.28, z: -2.21, g: new THREE.BoxGeometry(0.055, 0.025, 0.045), m: konnyakuMat },
    { x: 1.10, z: -2.09, g: new THREE.CylinderGeometry(0.016, 0.016, 0.07, 8), m: woodTrimMat },
    { x: 1.25, z: -2.09, g: new THREE.CylinderGeometry(0.032, 0.032, 0.025, 10), m: daikonMat },
  ].forEach((f) => {
    const fm = new THREE.Mesh(f.g, f.m);
    fm.position.set(f.x, 1.035, f.z);
    if (f.m === woodTrimMat) fm.rotation.z = Math.PI / 2;
    counterGroup.add(fm);
  });

  // Glowing miniature "おでん" lantern sign beside the pot
  const odenLantern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.14, 12),
    new THREE.MeshBasicMaterial({ color: 0xff6e42 })
  );
  odenLantern.position.set(1.42, 1.28, -2.24);
  const odenPost = createCelMesh(new THREE.CylinderGeometry(0.01, 0.01, 0.42, 6), steelMat, {
    outline: false,
  });
  odenPost.position.set(1.42, 1.12, -2.24);
  counterGroup.add(odenRim, odenBroth, odenLantern, odenPost);

  // Self-Serve Coffee Machine (咖啡机) on right wing (X: 1.44, Z: -1.10, facing -X & visible from +X window)
  const coffeeBody = createCelMesh(new THREE.BoxGeometry(0.42, 0.56, 0.46), darkMetalMat, {
    outline: true,
    outlineThickness: 1.2,
    crease: true,
  });
  coffeeBody.position.set(1.44, 1.20, -1.12);
  const coffeeHopper = createCelMesh(
    new THREE.CylinderGeometry(0.09, 0.07, 0.16, 12),
    { color: 0x4b2f21, emissive: 0x160c07, wetness: 0.4 },
    { outline: true, outlineThickness: 1.0 }
  );
  coffeeHopper.position.set(1.44, 1.56, -1.18);
  const coffeeRecess = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.20, 0.30),
    new THREE.MeshBasicMaterial({ color: 0xffdeb0 })
  );
  coffeeRecess.position.set(1.29, 1.08, -1.12);
  const coffeePanel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.12),
    new THREE.MeshBasicMaterial({ color: 0x6ce5ff })
  );
  coffeePanel.rotation.y = -Math.PI / 2;
  coffeePanel.position.set(1.225, 1.36, -1.12);
  // Paper cup dispenser stack right beside coffee machine
  const cupStack = createCelMesh(
    new THREE.CylinderGeometry(0.045, 0.038, 0.24, 12),
    { color: 0xfff8ed, emissive: 0x262018 },
    { outline: true, outlineThickness: 1.0 }
  );
  cupStack.position.set(1.40, 1.04, -1.48);
  counterGroup.add(coffeeBody, coffeeHopper, coffeeRecess, coffeePanel, cupStack);

  group.add(counterGroup);

  // --- 8. Ice Cream Chest Freezer (冰柜) ---
  const freezerGroup = new THREE.Group();
  freezerGroup.position.set(-4.05, floorY, -0.32);
  const freezerBody = createCelMesh(
    new THREE.BoxGeometry(1.48, 0.78, 0.72),
    { color: 0xf1f6ff, rimColor: 0xa6dcff, rimStrength: 0.25 },
    { outline: true, outlineThickness: 1.35, crease: true }
  );
  freezerBody.position.y = 0.39;
  const freezerGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.34, 0.56),
    new THREE.MeshBasicMaterial({ color: 0xc4ecff })
  );
  freezerGlow.rotation.x = -Math.PI / 2;
  freezerGlow.position.y = 0.785;
  const freezerGlass = new THREE.Mesh(
    new THREE.BoxGeometry(1.38, 0.025, 0.60),
    new THREE.MeshBasicMaterial({ color: 0xdff5ff, transparent: true, opacity: 0.35 })
  );
  freezerGlass.position.y = 0.80;
  freezerGroup.add(freezerBody, freezerGlow, freezerGlass);
  group.add(freezerGroup);

  // --- 9. Front Window Magazine Rack (杂志架) ---
  const magRack = new THREE.Group();
  magRack.position.set(-3.45, floorY, 0.56);

  const rackBase = createCelMesh(new THREE.BoxGeometry(2.75, 0.50, 0.36), shelfSteelMat, {
    outline: true,
    outlineThickness: 1.25,
    crease: true,
  });
  rackBase.position.y = 0.25;
  const rackRail = createCelMesh(new THREE.BoxGeometry(2.75, 0.04, 0.04), shelfAccentMat, {
    outline: false,
  });
  rackRail.position.set(0, 0.94, 0.12);
  magRack.add(rackBase, rackRail);

  // 2 slanted rows of colorful anime/manga magazines facing inward (-Z) & visible edges from outside
  for (let row = 0; row < 2; row++) {
    const my = row === 0 ? 0.44 : 0.78;
    const mz = row === 0 ? -0.15 : -0.05;
    for (let c = 0; c < 11; c++) {
      const mx = -1.20 + c * 0.24;
      const magMat = new THREE.MeshBasicMaterial({
        map: tex.magTextures[(row * 3 + c) % tex.magTextures.length],
      });
      const magMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 0.025), magMat);
      magMesh.position.set(mx, my, mz);
      magMesh.rotation.x = 0.28;
      magRack.add(magMesh);
    }
  }
  group.add(magRack);

  return { group };
}
