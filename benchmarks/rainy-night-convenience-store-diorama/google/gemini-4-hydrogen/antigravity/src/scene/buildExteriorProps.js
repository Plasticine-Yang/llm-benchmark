import * as THREE from 'three';
import {
  createCelMaterial,
  createCelMesh,
  createCanvasTexture,
  addOutline,
} from '../utils/toonFactory.js';

function createPropTextures() {
  // 1. Ribbed dark entrance door mat
  const matTex = createCanvasTexture(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#202638';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2b4744';
    ctx.fillRect(14, 14, w - 28, h - 28);
    ctx.fillStyle = '#1f3533';
    for (let y = 18; y < h - 18; y += 8) {
      ctx.fillRect(16, y, w - 32, 3);
    }
  });

  // 2. Vending machine showcase graphic (packed colorful cans/bottles rows)
  const makeVendDisplay = (theme) =>
    createCanvasTexture(256, 320, (ctx, w, h) => {
      ctx.fillStyle = '#edf7ff';
      ctx.fillRect(0, 0, w, h);

      const colors =
        theme === 'blue'
          ? ['#32a8ff', '#27b878', '#f5f7fa', '#4d6bff', '#ff8248', '#ffd24a']
          : ['#e84a42', '#704328', '#ff9947', '#2cb573', '#f5edd6', '#d65282'];

      for (let r = 0; r < 3; r++) {
        const shelfY = 26 + r * 92;
        // Shelf backing
        ctx.fillStyle = '#c8d6ea';
        ctx.fillRect(10, shelfY + 62, w - 20, 10);
        // Tiny cans
        for (let c = 0; c < 8; c++) {
          const cx = 18 + c * 28;
          ctx.fillStyle = colors[(r * 3 + c) % colors.length];
          ctx.fillRect(cx, shelfY + 10, 20, 46);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(cx + 3, shelfY + 18, 14, 12);
          ctx.strokeStyle = '#1c243b';
          ctx.lineWidth = 2;
          ctx.strokeRect(cx, shelfY + 10, 20, 46);
        }
        // Glowing blue/red selection buttons strip
        ctx.fillStyle = '#2d3752';
        ctx.fillRect(10, shelfY + 72, w - 20, 12);
        for (let c = 0; c < 8; c++) {
          ctx.fillStyle = r === 2 && theme === 'red' ? '#ff9d6e' : '#7ae3ff';
          ctx.fillRect(20 + c * 28, shelfY + 75, 16, 6);
        }
      }
    });

  // 3. Tall pole konbini sign texture
  const poleSignTex = createCanvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#fff9ec';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff8438';
    ctx.fillRect(0, 22, w, 28);
    ctx.fillStyle = '#22b573';
    ctx.fillRect(0, 58, w, 32);
    ctx.fillStyle = '#38a3ff';
    ctx.fillRect(0, 98, w, 24);

    // "24" circle
    ctx.fillStyle = '#22b573';
    ctx.beginPath();
    ctx.arc(w * 0.5, 215, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#182036';
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 58px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('24', w * 0.5, 218);

    ctx.fillStyle = '#19223b';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('SORA', w * 0.5, 325);
    ctx.fillText('MART', w * 0.5, 368);

    ctx.fillStyle = '#2a6cb8';
    ctx.fillRect(26, 415, w - 52, 62);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('酒・たばこ・ATM', w * 0.5, 446);

    ctx.strokeStyle = '#182036';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, w - 10, h - 10);
  });

  // 4. Japanese "止まれ" Stop Sign & Pedestrian Crossing Sign
  const stopSignTex = createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(20, 26);
    ctx.lineTo(w - 20, 26);
    ctx.lineTo(w * 0.5, h - 22);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#df3d3a';
    ctx.beginPath();
    ctx.moveTo(34, 38);
    ctx.lineTo(w - 34, 38);
    ctx.lineTo(w * 0.5, h - 42);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('止まれ', w * 0.5, 98);
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('STOP', w * 0.5, 134);
  });

  const crossSignTex = createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1f64b5';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    // Clean iconic blue triangle crosswalk symbol
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(w * 0.5, 42);
    ctx.lineTo(w - 42, h - 46);
    ctx.lineTo(42, h - 46);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1f64b5';
    for (let i = -1; i <= 1; i++) {
      ctx.fillRect(w * 0.5 + i * 32 - 8, h - 74, 16, 20);
    }
    ctx.beginPath();
    ctx.arc(w * 0.5, 118, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(w * 0.5 - 9, 134, 18, 36);
  });

  // 5. Community Notice Board Flyers & A-Frame Chalkboard
  const noticeBoardTex = createCanvasTexture(384, 256, (ctx, w, h) => {
    ctx.fillStyle = '#d4c9b2';
    ctx.fillRect(0, 0, w, h);
    const flyers = [
      { x: 20, y: 20, bw: 98, bh: 112, col: '#fff9e6', top: '#e8684a' },
      { x: 136, y: 24, bw: 108, bh: 96, col: '#eef8ff', top: '#3c90e6' },
      { x: 262, y: 18, bw: 100, bh: 120, col: '#fff2f6', top: '#e26a9c' },
      { x: 32, y: 148, bw: 124, bh: 86, col: '#f2fff5', top: '#2ca870' },
      { x: 176, y: 138, bw: 175, bh: 94, col: '#fffce8', top: '#f0a63a' },
    ];
    flyers.forEach((f) => {
      ctx.fillStyle = f.col;
      ctx.fillRect(f.x, f.y, f.bw, f.bh);
      ctx.fillStyle = f.top;
      ctx.fillRect(f.x, f.y, f.bw, 22);
      ctx.fillStyle = 'rgba(30, 38, 62, 0.45)';
      ctx.fillRect(f.x + 10, f.y + 34, f.bw - 20, 8);
      ctx.fillRect(f.x + 10, f.y + 50, f.bw - 32, 8);
      ctx.fillRect(f.x + 10, f.y + 66, f.bw - 24, 8);
      ctx.strokeStyle = '#2a3045';
      ctx.lineWidth = 2;
      ctx.strokeRect(f.x, f.y, f.bw, f.bh);
    });
  });

  const aFrameTex = createCanvasTexture(256, 360, (ctx, w, h) => {
    ctx.fillStyle = '#25313c';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d49e6a';
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, w - 14, h - 14);
    ctx.fillStyle = '#ffe1a8';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('あつあつ', w * 0.5, 84);
    ctx.fillStyle = '#ff926b';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText('おでん', w * 0.5, 148);
    ctx.fillStyle = '#a8e6ff';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('淹れたて珈琲', w * 0.5, 228);
    ctx.fillStyle = '#fff5e4';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('¥120〜', w * 0.5, 282);
  });

  return {
    matTex,
    vendBlue: makeVendDisplay('blue'),
    vendRed: makeVendDisplay('red'),
    poleSignTex,
    stopSignTex,
    crossSignTex,
    noticeBoardTex,
    aFrameTex,
  };
}

export function buildExteriorProps() {
  const group = new THREE.Group();
  group.name = 'ExteriorProps';
  const tex = createPropTextures();
  const sidewalkY = 0.14;

  const darkSteelMat = createCelMaterial({
    color: 0x2a334a,
    rimColor: 0x8dc2ff,
    rimStrength: 0.25,
    wetness: 0.35,
  });
  const whitePaintMat = createCelMaterial({
    color: 0xeaf0fb,
    rimColor: 0x99ccff,
    rimStrength: 0.28,
    wetness: 0.35,
  });
  const concreteMat = createCelMaterial({
    color: 0x6f7b96,
    rimColor: 0x8cbaff,
    rimStrength: 0.18,
    wetness: 0.2,
  });
  const woodMat = createCelMaterial({
    color: 0x8f6246,
    rimColor: 0xffd5a6,
    rimStrength: 0.16,
    wetness: 0.2,
  });

  // --- 1. Entrance Door Mat (门口地垫) ---
  const doorMatMesh = createCelMesh(
    new THREE.BoxGeometry(1.92, 0.022, 0.72),
    { color: 0xffffff, map: tex.matTex, rimStrength: 0.1, wetness: 0.35 },
    { outline: true, outlineThickness: 1.1, castShadow: false }
  );
  doorMatMesh.position.set(0.19, sidewalkY + 0.011, 1.38);
  group.add(doorMatMesh);

  // --- 2. Umbrella Stand & Vinyl Umbrellas (雨伞架) ---
  const umbStand = new THREE.Group();
  umbStand.position.set(-1.18, sidewalkY, 1.34);

  const tray = createCelMesh(new THREE.BoxGeometry(0.58, 0.05, 0.26), darkSteelMat, {
    outline: true,
    outlineThickness: 1.1,
  });
  tray.position.y = 0.025;
  const topRim = createCelMesh(new THREE.BoxGeometry(0.58, 0.04, 0.26), whitePaintMat, {
    outline: true,
    outlineThickness: 1.1,
  });
  topRim.position.y = 0.52;
  umbStand.add(tray, topRim);

  [
    [-0.26, -0.10],
    [0.26, -0.10],
    [-0.26, 0.10],
    [0.26, 0.10],
  ].forEach(([px, pz]) => {
    const leg = createCelMesh(new THREE.CylinderGeometry(0.014, 0.014, 0.52, 8), whitePaintMat, {
      outline: false,
    });
    leg.position.set(px, 0.26, pz);
    umbStand.add(leg);
  });

  // 4 Japanese clear/tinted vinyl umbrellas resting inside
  const umbConfigs = [
    { x: -0.18, col: 0xdff5ff, tiltZ: 0.10, handleCol: 0xf4f4f4 },
    { x: -0.05, col: 0x87d1ff, tiltZ: -0.08, handleCol: 0x3b86e6 },
    { x: 0.08, col: 0xffa8c2, tiltZ: 0.06, handleCol: 0xe6658d },
    { x: 0.20, col: 0xffe48c, tiltZ: -0.11, handleCol: 0xe8a832 },
  ];
  umbConfigs.forEach((u) => {
    const uGrp = new THREE.Group();
    uGrp.position.set(u.x, 0.05, 0);
    uGrp.rotation.z = u.tiltZ;

    const vinyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.014, 0.54, 10),
      new THREE.MeshBasicMaterial({ color: u.col, transparent: true, opacity: 0.72 })
    );
    vinyl.position.y = 0.30;
    const shaft = createCelMesh(new THREE.CylinderGeometry(0.008, 0.008, 0.68, 6), darkSteelMat, {
      outline: false,
    });
    shaft.position.y = 0.34;
    const handle = createCelMesh(
      new THREE.TorusGeometry(0.036, 0.012, 8, 12, Math.PI),
      { color: u.handleCol, rimStrength: 0.2 },
      { outline: false }
    );
    handle.position.set(0.036, 0.68, 0);
    uGrp.add(vinyl, shaft, handle);
    umbStand.add(uGrp);
  });
  group.add(umbStand);

  // --- 3. Konbini Sorting Trash & Recycling Bins (垃圾桶) ---
  const binsGroup = new THREE.Group();
  binsGroup.position.set(1.56, sidewalkY, 1.38);

  const binBody = createCelMesh(new THREE.BoxGeometry(0.84, 0.78, 0.38), whitePaintMat, {
    outline: true,
    outlineThickness: 1.3,
    crease: true,
  });
  binBody.position.y = 0.39;
  const binRoof = createCelMesh(new THREE.BoxGeometry(0.88, 0.08, 0.42), darkSteelMat, {
    outline: true,
    outlineThickness: 1.2,
  });
  binRoof.position.y = 0.81;
  binsGroup.add(binBody, binRoof);

  // 3 sorting decals/ports (Burnables orange, PET bottles blue, Cans green)
  [
    { x: -0.25, col: 0xff7b47 },
    { x: 0.0, col: 0x3aa3ff },
    { x: 0.25, col: 0x26b573 },
  ].forEach((b) => {
    const label = createCelMesh(
      new THREE.BoxGeometry(0.20, 0.16, 0.02),
      { color: b.col, emissive: 0x101010 },
      { outline: false }
    );
    label.position.set(b.x, 0.56, 0.195);
    const hole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.048, 0.025, 12),
      new THREE.MeshBasicMaterial({ color: 0x151929 })
    );
    hole.rotation.x = Math.PI / 2;
    hole.position.set(b.x, 0.67, 0.192);
    binsGroup.add(label, hole);
  });
  group.add(binsGroup);

  // --- 4. Two Glowing Drink Vending Machines (自动贩卖机) ---
  const buildVendingMachine = (zPos, primaryColor, displayTex) => {
    const vm = new THREE.Group();
    vm.position.set(2.34, sidewalkY, zPos);

    const body = createCelMesh(
      new THREE.BoxGeometry(0.68, 1.82, 1.06),
      { color: primaryColor, rimColor: 0x99dcff, rimStrength: 0.3, wetness: 0.35 },
      { outline: true, outlineThickness: 1.45, crease: true }
    );
    body.position.y = 0.91;
    vm.add(body);

    // Bright glowing showcase window on +X face
    const showcase = new THREE.Mesh(
      new THREE.PlaneGeometry(0.88, 0.96),
      new THREE.MeshBasicMaterial({ map: displayTex })
    );
    showcase.rotation.y = Math.PI / 2;
    showcase.position.set(0.346, 1.24, 0);
    vm.add(showcase);

    // Illuminated lower brand panel
    const brandPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.56, 0.26),
      new THREE.MeshBasicMaterial({ color: primaryColor === 0x2a7de1 ? 0xd9f4ff : 0xffe4d8 })
    );
    brandPanel.rotation.y = Math.PI / 2;
    brandPanel.position.set(0.345, 0.56, -0.14);
    vm.add(brandPanel);

    // Pickup flap + coin mechanism
    const flap = createCelMesh(new THREE.BoxGeometry(0.04, 0.22, 0.66), darkSteelMat, {
      outline: true,
      outlineThickness: 1.0,
    });
    flap.position.set(0.35, 0.26, 0);
    const coinPad = createCelMesh(new THREE.BoxGeometry(0.05, 0.34, 0.22), darkSteelMat, {
      outline: true,
      outlineThickness: 1.0,
    });
    coinPad.position.set(0.35, 0.62, 0.30);
    vm.add(flap, coinPad);

    group.add(vm);
  };

  buildVendingMachine(-4.35, 0x2a7de1, tex.vendBlue);
  buildVendingMachine(-3.12, 0xd94848, tex.vendRed);

  // --- 5. Parked Japanese Commuter Bicycle (自行车 / Mamachari) ---
  const bike = new THREE.Group();
  bike.position.set(2.88, sidewalkY, -1.42);
  bike.rotation.y = -0.32;
  bike.rotation.z = 0.08; // resting subtly on kickstand

  const bikePaintMat = createCelMaterial({
    color: 0x62b8a8,
    rimColor: 0xc2f5ff,
    rimStrength: 0.32,
    wetness: 0.45,
  });
  const tireMat = createCelMaterial({ color: 0x1d2130, rimStrength: 0.2, wetness: 0.4 });
  const chromeMat = createCelMaterial({
    color: 0xcbd6eb,
    rimColor: 0xffffff,
    rimStrength: 0.4,
    wetness: 0.55,
  });

  const buildWheel = (wz) => {
    const wg = new THREE.Group();
    wg.position.set(0, 0.30, wz);
    const tire = createCelMesh(new THREE.TorusGeometry(0.28, 0.032, 10, 24), tireMat, {
      outline: true,
      outlineThickness: 1.25,
    });
    tire.rotation.y = Math.PI / 2;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.012, 6, 20), chromeMat);
    rim.rotation.y = Math.PI / 2;
    wg.add(tire, rim);
    // 6 thin spokes
    for (let s = 0; s < 6; s++) {
      const spoke = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, 0.48, 4),
        chromeMat
      );
      spoke.rotation.x = (s / 6) * Math.PI;
      wg.add(spoke);
    }
    return wg;
  };
  bike.add(buildWheel(0.46), buildWheel(-0.46));

  // Step-through frame tubes
  const addTube = (p1, p2, r, mat) => {
    const v1 = new THREE.Vector3(...p1);
    const v2 = new THREE.Vector3(...p2);
    const len = v1.distanceTo(v2);
    const cyl = createCelMesh(new THREE.CylinderGeometry(r, r, len, 8), mat, {
      outline: true,
      outlineThickness: 1.0,
    });
    cyl.position.copy(v1).add(v2).multiplyScalar(0.5);
    cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v2.clone().sub(v1).normalize());
    bike.add(cyl);
  };
  addTube([0, 0.30, 0.46], [0, 0.84, 0.28], 0.018, bikePaintMat); // front fork/head tube
  addTube([0, 0.42, 0.36], [0, 0.28, -0.05], 0.018, bikePaintMat); // down curved step-through
  addTube([0, 0.28, -0.05], [0, 0.78, -0.14], 0.018, bikePaintMat); // seat tube
  addTube([0, 0.28, -0.05], [0, 0.30, -0.46], 0.014, bikePaintMat); // chainstay
  addTube([0, 0.68, -0.12], [0, 0.30, -0.46], 0.012, bikePaintMat); // seatstay

  // Handlebars, saddle, front wire basket, rear carrier, kickstand
  const saddle = createCelMesh(new THREE.BoxGeometry(0.14, 0.06, 0.22), darkSteelMat, {
    outline: true,
    outlineThickness: 1.0,
  });
  saddle.position.set(0, 0.82, -0.16);
  const handlebar = createCelMesh(new THREE.BoxGeometry(0.46, 0.025, 0.025), chromeMat, {
    outline: false,
  });
  handlebar.position.set(0, 0.88, 0.28);
  const basket = createCelMesh(new THREE.BoxGeometry(0.28, 0.20, 0.22), darkSteelMat, {
    outline: true,
    outlineThickness: 1.1,
    crease: true,
  });
  basket.position.set(0, 0.73, 0.45);
  const rearRack = createCelMesh(new THREE.BoxGeometry(0.16, 0.03, 0.36), chromeMat, {
    outline: true,
    outlineThickness: 1.0,
  });
  rearRack.position.set(0, 0.64, -0.42);
  addTube([0, 0.28, -0.06], [-0.14, 0.0, -0.12], 0.01, darkSteelMat); // kickstand
  bike.add(saddle, handlebar, basket, rearRack);
  group.add(bike);

  // --- 6. Street Corner Guardrails (街角护栏) ---
  const addGuardrail = (x1, z1, x2, z2) => {
    const gr = new THREE.Group();
    const v1 = new THREE.Vector3(x1, sidewalkY, z1);
    const v2 = new THREE.Vector3(x2, sidewalkY, z2);
    const len = v1.distanceTo(v2);
    const mid = v1.clone().add(v2).multiplyScalar(0.5);
    const angle = Math.atan2(x2 - x1, z2 - z1);

    gr.position.copy(mid);
    gr.rotation.y = angle;

    const postCount = Math.max(2, Math.round(len / 1.1) + 1);
    for (let i = 0; i < postCount; i++) {
      const pz = -len * 0.5 + (i / (postCount - 1)) * len;
      const post = createCelMesh(new THREE.CylinderGeometry(0.036, 0.036, 0.76, 10), whitePaintMat, {
        outline: true,
        outlineThickness: 1.15,
      });
      post.position.set(0, 0.38, pz);
      gr.add(post);
    }

    [0.42, 0.72].forEach((hy) => {
      const rail = createCelMesh(new THREE.CylinderGeometry(0.026, 0.026, len, 10), whitePaintMat, {
        outline: true,
        outlineThickness: 1.1,
      });
      rail.rotation.x = Math.PI / 2;
      rail.position.y = hy;
      gr.add(rail);
    });
    group.add(gr);
  };

  addGuardrail(-2.05, 4.02, 0.55, 4.02);
  addGuardrail(4.02, -1.35, 4.02, 0.55);

  // --- 7. Community Notice Board & Konbini A-Frame Stand (小型公告栏、海报栏) ---
  const noticeBoard = new THREE.Group();
  noticeBoard.position.set(-6.05, sidewalkY, 1.88);
  noticeBoard.rotation.y = 0.28;

  [-0.56, 0.56].forEach((px) => {
    const leg = createCelMesh(new THREE.BoxGeometry(0.08, 1.68, 0.08), woodMat, {
      outline: true,
      outlineThickness: 1.2,
    });
    leg.position.set(px, 0.84, 0);
    noticeBoard.add(leg);
  });
  const boardBack = createCelMesh(new THREE.BoxGeometry(1.24, 0.86, 0.08), woodMat, {
    outline: true,
    outlineThickness: 1.3,
    crease: true,
  });
  boardBack.position.y = 1.26;
  const boardRoof = createCelMesh(new THREE.BoxGeometry(1.42, 0.08, 0.30), darkSteelMat, {
    outline: true,
    outlineThickness: 1.2,
  });
  boardRoof.position.set(0, 1.73, 0.02);
  boardRoof.rotation.x = 0.14;
  const flyersPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.12, 0.74),
    new THREE.MeshBasicMaterial({ map: tex.noticeBoardTex })
  );
  flyersPlane.position.set(0, 1.26, 0.045);
  noticeBoard.add(boardBack, boardRoof, flyersPlane);
  group.add(noticeBoard);

  // Store A-frame sidewalk poster stand near left window
  const aFrame = new THREE.Group();
  aFrame.position.set(-2.22, sidewalkY, 1.66);
  aFrame.rotation.y = 0.36;
  const boardF = createCelMesh(new THREE.BoxGeometry(0.50, 0.72, 0.03), woodMat, {
    outline: true,
    outlineThickness: 1.1,
  });
  boardF.position.set(0, 0.36, 0.11);
  boardF.rotation.x = -0.18;
  const boardB = boardF.clone();
  boardB.position.z = -0.11;
  boardB.rotation.x = 0.18;
  const aFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.44, 0.64),
    new THREE.MeshBasicMaterial({ map: tex.aFrameTex })
  );
  aFace.position.set(0, 0.36, 0.128);
  aFace.rotation.x = -0.18;
  aFrame.add(boardF, boardB, aFace);
  group.add(aFrame);

  // --- 8. Tall Illuminated Konbini Pole Sign (便利店灯箱招牌) ---
  const poleSign = new THREE.Group();
  poleSign.position.set(-5.25, sidewalkY, 3.68);
  const signMast = createCelMesh(new THREE.CylinderGeometry(0.08, 0.10, 5.2, 12), darkSteelMat, {
    outline: true,
    outlineThickness: 1.35,
  });
  signMast.position.y = 2.6;
  const signBox = createCelMesh(new THREE.BoxGeometry(0.92, 1.88, 0.22), darkSteelMat, {
    outline: true,
    outlineThickness: 1.4,
  });
  signBox.position.y = 4.55;
  const poleSignMat = new THREE.MeshBasicMaterial({ map: tex.poleSignTex, color: 0xffffff });
  const signFaceF = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 1.78), poleSignMat);
  signFaceF.position.set(0, 4.55, 0.115);
  const signFaceB = signFaceF.clone();
  signFaceB.rotation.y = Math.PI;
  signFaceB.position.z = -0.115;
  poleSign.add(signMast, signBox, signFaceF, signFaceB);
  group.add(poleSign);

  // --- 9. Curved Corner Streetlight (路灯) ---
  const streetLight = new THREE.Group();
  streetLight.position.set(3.85, sidewalkY, -2.05);
  const lampPole = createCelMesh(new THREE.CylinderGeometry(0.055, 0.085, 5.05, 12), darkSteelMat, {
    outline: true,
    outlineThickness: 1.3,
  });
  lampPole.position.y = 2.525;
  // Curved cantilevered arm extending over +X side road
  const armCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 4.95, 0),
    new THREE.Vector3(0.45, 5.38, 0),
    new THREE.Vector3(1.25, 5.22, 0)
  );
  const armMesh = createCelMesh(new THREE.TubeGeometry(armCurve, 12, 0.04, 8, false), darkSteelMat, {
    outline: true,
    outlineThickness: 1.15,
  });
  const lampHead = createCelMesh(new THREE.BoxGeometry(0.44, 0.10, 0.22), darkSteelMat, {
    outline: true,
    outlineThickness: 1.1,
  });
  lampHead.position.set(1.36, 5.20, 0);
  lampHead.rotation.z = -0.12;
  const lampBulb = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.16),
    new THREE.MeshBasicMaterial({ color: 0xbceeff })
  );
  lampBulb.rotation.x = Math.PI / 2;
  lampBulb.position.set(1.36, 5.145, 0);
  streetLight.add(lampPole, armMesh, lampHead, lampBulb);
  group.add(streetLight);

  // --- 10. Japanese Road Signs (路牌) ---
  // Stop sign "止まれ" at side-street corner
  const stopGroup = new THREE.Group();
  stopGroup.position.set(3.85, sidewalkY, 0.62);
  const stopPole = createCelMesh(new THREE.CylinderGeometry(0.03, 0.035, 2.55, 10), whitePaintMat, {
    outline: true,
    outlineThickness: 1.1,
  });
  stopPole.position.y = 1.275;
  const stopFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.62),
    new THREE.MeshBasicMaterial({ map: tex.stopSignTex, transparent: true, side: THREE.DoubleSide })
  );
  stopFace.position.set(0, 2.38, 0);
  stopFace.rotation.y = Math.PI / 4;
  stopGroup.add(stopPole, stopFace);
  group.add(stopGroup);

  // Blue Pedestrian Crossing Sign at front crosswalk
  const crossGroup = new THREE.Group();
  crossGroup.position.set(0.76, sidewalkY, 3.88);
  const crossPole = createCelMesh(new THREE.CylinderGeometry(0.03, 0.035, 2.68, 10), whitePaintMat, {
    outline: true,
    outlineThickness: 1.1,
  });
  crossPole.position.y = 1.34;
  const crossPlate = createCelMesh(new THREE.BoxGeometry(0.54, 0.54, 0.03), darkSteelMat, {
    outline: true,
    outlineThickness: 1.0,
  });
  crossPlate.position.set(0, 2.48, 0);
  const crossFaceF = new THREE.Mesh(
    new THREE.PlaneGeometry(0.50, 0.50),
    new THREE.MeshBasicMaterial({ map: tex.crossSignTex })
  );
  crossFaceF.position.set(0, 2.48, 0.018);
  const crossFaceB = crossFaceF.clone();
  crossFaceB.rotation.y = Math.PI;
  crossFaceB.position.z = -0.018;
  crossGroup.add(crossPole, crossPlate, crossFaceF, crossFaceB);
  group.add(crossGroup);

  // --- 11. Concrete Utility Poles & Catenary Overhead Wires (电线杆、电线) ---
  const poleMat = createCelMaterial({ color: 0x7b859e, rimColor: 0x9ec6ff, rimStrength: 0.2, wetness: 0.25 });
  const hazardMat = createCelMaterial({ color: 0xf4c438, emissive: 0x261d00 });
  const insulatorMat = createCelMaterial({ color: 0xdff0ff, rimStrength: 0.2 });

  const buildUtilityPole = (px, pz, crossArmRotY = 0, hasTransformer = false) => {
    const up = new THREE.Group();
    up.position.set(px, sidewalkY, pz);

    const mast = createCelMesh(new THREE.CylinderGeometry(0.095, 0.145, 6.75, 12), poleMat, {
      outline: true,
      outlineThickness: 1.4,
    });
    mast.position.y = 3.375;
    up.add(mast);

    // Classic yellow/black warning sleeve near pedestrian height
    const hazard = createCelMesh(new THREE.CylinderGeometry(0.14, 0.146, 0.85, 12), hazardMat, {
      outline: false,
    });
    hazard.position.y = 1.35;
    up.add(hazard);

    // Crossarm & ceramic insulators
    const armGrp = new THREE.Group();
    armGrp.rotation.y = crossArmRotY;
    [5.85, 6.45].forEach((ay) => {
      const arm = createCelMesh(new THREE.BoxGeometry(1.38, 0.07, 0.07), darkSteelMat, {
        outline: true,
        outlineThickness: 1.1,
      });
      arm.position.y = ay;
      armGrp.add(arm);

      [-0.56, 0.0, 0.56].forEach((ix) => {
        const ins = createCelMesh(new THREE.CylinderGeometry(0.032, 0.04, 0.10, 8), insulatorMat, {
          outline: false,
        });
        ins.position.set(ix, ay + 0.07, 0);
        armGrp.add(ins);
      });
    });

    if (hasTransformer) {
      const xfmr = createCelMesh(new THREE.CylinderGeometry(0.22, 0.22, 0.62, 12), poleMat, {
        outline: true,
        outlineThickness: 1.25,
      });
      xfmr.position.set(0.28, 4.95, 0);
      armGrp.add(xfmr);
    }

    up.add(armGrp);
    group.add(up);
  };

  // Three utility poles along outer perimeter creating L-shaped overhead grid
  buildUtilityPole(-7.62, 3.72, 0, true);
  buildUtilityPole(-7.62, -7.42, Math.PI / 4, false);
  buildUtilityPole(3.75, -7.42, Math.PI / 2, true);

  // Catenary sagging overhead power wires
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x161a2e });
  const addWireSpan = (pA, pB, sag = 0.42) => {
    const mid = pA.clone().add(pB).multiplyScalar(0.5);
    mid.y -= sag;
    const curve = new THREE.QuadraticBezierCurve3(pA, mid, pB);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.014, 5, false), wireMat);
    group.add(tube);
  };

  // Span 1: Front-left pole (-7.62, 3.72) -> Back-left pole (-7.62, -7.42)
  [-0.56, 0, 0.56].forEach((off, idx) => {
    addWireSpan(
      new THREE.Vector3(-7.62 + off, 6.66, 3.72),
      new THREE.Vector3(-7.62 + off * 0.7, 6.66, -7.42 - off * 0.7),
      0.48 + idx * 0.06
    );
    addWireSpan(
      new THREE.Vector3(-7.62 + off, 6.06, 3.72),
      new THREE.Vector3(-7.62 + off * 0.7, 6.06, -7.42 - off * 0.7),
      0.38
    );
  });
  // Span 2: Back-left pole (-7.62, -7.42) -> Back-right pole (3.75, -7.42)
  [-0.56, 0, 0.56].forEach((off, idx) => {
    addWireSpan(
      new THREE.Vector3(-7.62 + off * 0.7, 6.66, -7.42 - off * 0.7),
      new THREE.Vector3(3.75, 6.66, -7.42 + off),
      0.46 + idx * 0.06
    );
    addWireSpan(
      new THREE.Vector3(-7.62 + off * 0.7, 6.06, -7.42 - off * 0.7),
      new THREE.Vector3(3.75, 6.06, -7.42 + off),
      0.35
    );
  });
  // Service drop cables running from Pole 1 into Konbini roof & Neighbor building
  addWireSpan(new THREE.Vector3(-7.45, 5.95, 3.72), new THREE.Vector3(-5.55, 3.95, 0.4), 0.25);
  addWireSpan(new THREE.Vector3(-7.45, 5.95, 3.72), new THREE.Vector3(-7.32, 3.85, -1.2), 0.20);

  // --- 12. Narrow Side Alley, Neighbor Building Wall & AC Outdoor Units (小巷入口、空调外机) ---
  const neighborWallMat = createCelMaterial({
    color: 0x3b435c,
    rimColor: 0x7cb4ff,
    rimStrength: 0.18,
    shadowTint: 0x1a2038,
    wetness: 0.22,
  });
  const neighborBlock = createCelMesh(new THREE.BoxGeometry(1.62, 4.95, 7.65), neighborWallMat, {
    outline: true,
    outlineThickness: 1.55,
    crease: true,
  });
  neighborBlock.position.set(-8.08, sidewalkY + 2.475, -4.52);
  group.add(neighborBlock);

  // Neighbor concrete parapet cap, upper shuttered window, downspout pipe, warm alley porch lantern
  const neighborCap = createCelMesh(new THREE.BoxGeometry(1.70, 0.14, 7.72), concreteMat, {
    outline: true,
    outlineThickness: 1.3,
  });
  neighborCap.position.set(-8.08, sidewalkY + 5.02, -4.52);
  const alleyWindow = createCelMesh(new THREE.BoxGeometry(0.06, 0.96, 1.35), darkSteelMat, {
    outline: true,
    outlineThickness: 1.1,
  });
  alleyWindow.position.set(-7.26, 3.45, -3.2);
  const shutterSlit = new THREE.Mesh(
    new THREE.PlaneGeometry(1.18, 0.16),
    new THREE.MeshBasicMaterial({ color: 0xffd08a })
  );
  shutterSlit.rotation.y = Math.PI / 2;
  shutterSlit.position.set(-7.22, 3.12, -3.2);

  const downspout = createCelMesh(new THREE.CylinderGeometry(0.04, 0.04, 4.9, 8), darkSteelMat, {
    outline: true,
    outlineThickness: 1.0,
  });
  downspout.position.set(-7.24, sidewalkY + 2.45, -0.82);

  // Warm alley porch lantern casting golden light down the wet alley
  const porchArm = createCelMesh(new THREE.BoxGeometry(0.24, 0.05, 0.05), darkSteelMat, {
    outline: false,
  });
  porchArm.position.set(-7.16, 2.76, -1.95);
  const porchLamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffcf7d })
  );
  porchLamp.position.set(-7.06, 2.66, -1.95);
  group.add(neighborCap, alleyWindow, shutterSlit, downspout, porchArm, porchLamp);

  // 3 Detailed Wall-Mounted AC Outdoor Units (空调外机) on Konbini's -X alley wall
  const acBodyMat = createCelMaterial({
    color: 0xdce2ed,
    rimColor: 0xffcfa0,
    rimStrength: 0.22,
    wetness: 0.25,
  });
  const acSpinners = [];
  [
    { y: 1.05, z: -2.05 },
    { y: 2.05, z: -2.05 },
    { y: 1.05, z: -3.45 },
  ].forEach((ac) => {
    const unit = new THREE.Group();
    unit.position.set(-5.82, ac.y, ac.z);

    const box = createCelMesh(new THREE.BoxGeometry(0.36, 0.56, 0.78), acBodyMat, {
      outline: true,
      outlineThickness: 1.25,
      crease: true,
    });
    const grille = createCelMesh(new THREE.CylinderGeometry(0.21, 0.21, 0.04, 16), darkSteelMat, {
      outline: false,
    });
    grille.rotation.z = Math.PI / 2;
    grille.position.set(-0.18, 0, -0.10);

    const fanHub = new THREE.Group();
    fanHub.position.set(-0.195, 0, -0.10);
    for (let b = 0; b < 3; b++) {
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.16, 0.055),
        new THREE.MeshBasicMaterial({ color: 0x62708f })
      );
      blade.rotation.x = (b * Math.PI * 2) / 3;
      blade.position.y = Math.cos(blade.rotation.x) * 0.08;
      blade.position.z = Math.sin(blade.rotation.x) * 0.08;
      fanHub.add(blade);
    }
    acSpinners.push(fanHub);

    // Wall steel L-brackets
    [-0.28, 0.28].forEach((bz) => {
      const brk = createCelMesh(new THREE.BoxGeometry(0.40, 0.04, 0.04), darkSteelMat, {
        outline: false,
      });
      brk.position.set(0.04, -0.30, bz);
      unit.add(brk);
    });

    unit.add(box, grille, fanHub);
    group.add(unit);
  });

  // Stacked delivery crates & gas/electric meters in alley
  const crateBlueMat = createCelMaterial({ color: 0x3574c4, rimStrength: 0.2, wetness: 0.3 });
  const crateYellowMat = createCelMaterial({ color: 0xe6b235, rimStrength: 0.2, wetness: 0.3 });
  [
    { y: sidewalkY + 0.14, m: crateBlueMat, ry: 0.04 },
    { y: sidewalkY + 0.42, m: crateBlueMat, ry: -0.05 },
    { y: sidewalkY + 0.70, m: crateYellowMat, ry: 0.08 },
  ].forEach((c) => {
    const crate = createCelMesh(new THREE.BoxGeometry(0.44, 0.26, 0.58), c.m, {
      outline: true,
      outlineThickness: 1.15,
      crease: true,
    });
    crate.position.set(-5.86, c.y, -4.65);
    crate.rotation.y = c.ry;
    group.add(crate);
  });

  // --- 13. Back Concrete Block Wall & Rain-Wet Potted Shrubs (-Z Rear Strip) ---
  const backFence = createCelMesh(new THREE.BoxGeometry(7.2, 1.35, 0.22), concreteMat, {
    outline: true,
    outlineThickness: 1.4,
    crease: true,
  });
  backFence.position.set(-1.8, sidewalkY + 0.675, -8.55);
  group.add(backFence);

  // Cute rain-wet sidewalk planter boxes with rounded anime foliage shrubs
  const foliageMat = createCelMaterial({
    color: 0x265b4a,
    rimColor: 0x7be0be,
    rimStrength: 0.28,
    wetness: 0.45,
  });
  [
    { x: 2.85, z: -6.25 },
    { x: -6.95, z: 0.45 },
  ].forEach((pl) => {
    const pot = createCelMesh(new THREE.BoxGeometry(0.68, 0.36, 0.68), concreteMat, {
      outline: true,
      outlineThickness: 1.2,
      crease: true,
    });
    pot.position.set(pl.x, sidewalkY + 0.18, pl.z);
    group.add(pot);

    [
      [0, 0.56, 0, 0.28],
      [-0.16, 0.48, 0.12, 0.20],
      [0.16, 0.50, -0.10, 0.21],
    ].forEach(([ox, oy, oz, r]) => {
      const bush = createCelMesh(new THREE.IcosahedronGeometry(r, 1), foliageMat, {
        outline: true,
        outlineThickness: 1.15,
      });
      bush.position.set(pl.x + ox, sidewalkY + oy, pl.z + oz);
      group.add(bush);
    });
  });

  // --- 14. Distant Corner Traffic Signal (远处交通信号灯微弱变化) ---
  const signalGroup = new THREE.Group();
  signalGroup.position.set(8.35, sidewalkY, -6.45);

  const sigMast = createCelMesh(new THREE.CylinderGeometry(0.08, 0.11, 4.75, 12), darkSteelMat, {
    outline: true,
    outlineThickness: 1.35,
  });
  sigMast.position.y = 2.375;
  const sigArm = createCelMesh(new THREE.BoxGeometry(1.55, 0.10, 0.10), darkSteelMat, {
    outline: true,
    outlineThickness: 1.15,
  });
  sigArm.position.set(-0.72, 4.45, 0);
  const sigHousing = createCelMesh(new THREE.BoxGeometry(1.06, 0.34, 0.22), darkSteelMat, {
    outline: true,
    outlineThickness: 1.2,
    crease: true,
  });
  sigHousing.position.set(-0.98, 4.45, 0.12);

  // 3 Signal Aspects (Green, Yellow, Red) facing +Z down the side road
  const sigGreenMat = new THREE.MeshBasicMaterial({ color: 0x38f29e });
  const sigYellowMat = new THREE.MeshBasicMaterial({ color: 0x2c2414 });
  const sigRedMat = new THREE.MeshBasicMaterial({ color: 0x2c1418 });

  const makeLens = (lx, mat) => {
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.105, 16), mat);
    lens.position.set(lx, 4.45, 0.236);
    const visor = createCelMesh(
      new THREE.CylinderGeometry(0.118, 0.118, 0.16, 12, 1, true, Math.PI / 2, Math.PI),
      darkSteelMat,
      { outline: false }
    );
    visor.rotation.x = Math.PI / 2;
    visor.position.set(lx, 4.46, 0.28);
    signalGroup.add(lens, visor);
  };
  makeLens(-1.30, sigGreenMat);
  makeLens(-0.98, sigYellowMat);
  makeLens(-0.66, sigRedMat);

  signalGroup.add(sigMast, sigArm, sigHousing);
  group.add(signalGroup);

  const activeSignalColor = new THREE.Color(0x38f29e);

  return {
    group,
    update(time, signalPointLight) {
      // Spin outdoor AC fan blades smoothly
      acSpinners.forEach((fan, i) => {
        fan.rotation.x = time * (9.5 + i * 1.4);
      });

      // Subtle distant traffic signal cycling (14s loop: 6.5s Green, 2.0s Yellow, 5.5s Red)
      const phase = time % 14.0;
      if (phase < 6.5) {
        sigGreenMat.color.setHex(0x38f29e);
        sigYellowMat.color.setHex(0x282112);
        sigRedMat.color.setHex(0x281316);
        activeSignalColor.setHex(0x38f29e);
      } else if (phase < 8.5) {
        sigGreenMat.color.setHex(0x132820);
        sigYellowMat.color.setHex(0xffbf42);
        sigRedMat.color.setHex(0x281316);
        activeSignalColor.setHex(0xffbf42);
      } else {
        sigGreenMat.color.setHex(0x132820);
        sigYellowMat.color.setHex(0x282112);
        sigRedMat.color.setHex(0xff5263);
        activeSignalColor.setHex(0xff5263);
      }

      if (signalPointLight) {
        signalPointLight.color.copy(activeSignalColor);
      }

      return activeSignalColor;
    },
  };
}
