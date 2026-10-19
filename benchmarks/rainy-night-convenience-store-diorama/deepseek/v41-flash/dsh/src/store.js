/**
 * 便利店主体：外壳（墙 / 大面积玻璃 / 自动门 / 雨棚 / 招牌）+ 充实温暖的店内。
 * 店内陈设：货架、饮料冷柜、冰柜、关东煮柜台、收银台、咖啡机、杂志架、
 *          海报栏、天花灯带、地面导视、后场门……
 * 所有室内构件都朝向玻璃，保证从街道透视进去依然清晰可读。
 */
import * as THREE from 'three';
import { STORE, BRAND, PAL } from './config.js';
import { toon, glow, glass, cube, panel, groundPlane, cyl, inkOutline, halo, M } from './toon.js';
import * as TX from './textures.js';

/* ------------------------------------------------- 商品实例化批处理 */
/**
 * 货架 / 冷柜里的商品数量很大，逐个 Mesh 会产生上千次 draw call。
 * 这里把它们按几何类型收集起来，最后一次性做成 InstancedMesh，
 * 既保留三渲二的纯色块观感，又把 draw call 压到个位数。
 */
class ProductBatcher {
  constructor(parent) {
    this.parent = parent;
    this.buckets = new Map();
  }
  add(kind, geo, mat, x, y, z, ry = 0, sx = 1, sy = 1, sz = 1) {
    const key = `${kind}`;
    if (!this.buckets.has(key)) this.buckets.set(key, { geo, mat, items: [] });
    this.buckets.get(key).items.push({ x, y, z, ry, sx, sy, sz });
  }
  flush() {
    const dummy = new THREE.Object3D();
    let count = 0;
    this.buckets.forEach((b, key) => {
      const inst = new THREE.InstancedMesh(b.geo, b.mat, b.items.length);
      inst.name = `batch_${key}`;
      b.items.forEach((it, i) => {
        dummy.position.set(it.x, it.y, it.z);
        dummy.rotation.set(0, it.ry, 0);
        dummy.scale.set(it.sx, it.sy, it.sz);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
      });
      inst.instanceMatrix.needsUpdate = true;
      inst.castShadow = false;
      inst.receiveShadow = false;
      this.parent.add(inst);
      count += b.items.length;
    });
    this.buckets.clear();
    return count;
  }
}

const FLOOR = STORE.floorY;
const CEIL = STORE.ceilingY;
const IN_X0 = STORE.x0 + STORE.wallT, IN_X1 = STORE.x1 - STORE.wallT;
const IN_Z0 = STORE.z0 + STORE.wallT, IN_Z1 = STORE.z1 - STORE.wallT;

export function buildStore(scene) {
  const g = new THREE.Group();
  g.name = 'store';

  buildShell(g);
  buildInterior(g);
  const door = buildAutoDoor(g);
  const signs = buildSignage(g);
  buildStoreLights(g);

  scene.add(g);
  return { group: g, door, signs };
}

/* ============================================================== 建筑外壳 */
function buildShell(g) {
  const { x0, x1, z0, z1, wallH, parapetY } = STORE;
  const wallMat = toon(PAL.storeWall, { steps: 5, emissive: 0x5a5a68, emissiveIntensity: 1 });
  const trimMat = toon(PAL.storeTrim, { steps: 5, emissive: 0x44444e, emissiveIntensity: 1 });

  // ---- 店内地面（浅色地砖，亮堂堂）
  const floorMat = toon(0xd9d2c2, { map: TX.storeFloorTexture(), steps: 5, emissive: 0x8a7752, emissiveIntensity: 1 });
  const floor = groundPlane({ w: IN_X1 - IN_X0, d: IN_Z1 - IN_Z0, x: (IN_X0 + IN_X1) / 2, y: FLOOR, z: (IN_Z0 + IN_Z1) / 2, mat: floorMat });
  floor.receiveShadow = true;
  g.add(floor);
  // 门外台阶过渡
  g.add(cube({ w: STORE.doorW + 1.0, h: 0.16, d: 0.34, x: STORE.doorX, y: 0, z: z1 + 0.17, mat: trimMat }));

  // ---- 北墙 / 东墙（实墙，带踢脚与檐口）
  g.add(cube({ w: x1 - x0, h: wallH, d: STORE.wallT, x: (x0 + x1) / 2, y: FLOOR, z: z0 + STORE.wallT / 2, mat: wallMat, outline: 1.0 }));
  g.add(cube({ w: STORE.wallT, h: wallH, d: z1 - z0, x: x1 - STORE.wallT / 2, y: FLOOR, z: (z0 + z1) / 2, mat: wallMat, outline: 1.0 }));

  // ---- 西墙：整面玻璃幕（店内透出暖光）
  buildGlazedWall(g, { axis: 'x', fixed: x0 + STORE.wallT / 2, a0: STORE.z0, a1: STORE.z1, rotY: Math.PI / 2 });

  // ---- 南墙：三段实墙 + 两段玻璃 + 自动门洞
  const doorL = STORE.doorX - STORE.doorW / 2, doorR = STORE.doorX + STORE.doorW / 2;
  buildSolidPier(g, x0, doorL - 1.5, z1 - STORE.wallT / 2, wallMat);
  buildSolidPier(g, doorR + 1.5, x1, z1 - STORE.wallT / 2, wallMat);
  buildGlazedWall(g, { axis: 'z', fixed: z1 - STORE.wallT / 2, a0: doorL - 1.5, a1: doorL, rotY: 0 });
  buildGlazedWall(g, { axis: 'z', fixed: z1 - STORE.wallT / 2, a0: doorR, a1: doorR + 1.5, rotY: 0 });

  // ---- 屋檐雨棚（出挑 + 收边）
  const awning = new THREE.Group();
  const aw = x1 - x0 + 1.6, ad = 1.5;
  const awnMat = toon(0xe9edf4, { steps: 5 });
  awning.add(cube({ w: aw, h: 0.22, d: ad, x: 0, y: STORE.awningY, z: z1 + ad / 2 - 0.1, mat: awnMat, outline: 0.7 }));
  // 雨棚侧裙
  awning.add(cube({ w: aw, h: 0.34, d: 0.12, x: 0, y: STORE.awningY - 0.34, z: z1 + ad - 0.16, mat: toon(0xcdd4e0, { steps: 5 }), outline: 0.5 }));
  awning.add(cube({ w: 0.12, h: 0.34, d: ad, x: -aw / 2, y: STORE.awningY - 0.34, z: z1 + ad / 2 - 0.1, mat: toon(0xcdd4e0, { steps: 5 }), outline: 0.5 }));
  awning.add(cube({ w: 0.12, h: 0.34, d: ad, x: aw / 2, y: STORE.awningY - 0.34, z: z1 + ad / 2 - 0.1, mat: toon(0xcdd4e0, { steps: 5 }), outline: 0.5 }));
  // 雨棚下的灯带
  const stripMat = glow(0xfff2d8, { transparent: true, opacity: 0.95, depthWrite: false });
  awning.add(groundPlane({ w: aw - 0.4, d: 0.22, x: 0, y: STORE.awningY - 0.11, z: z1 + ad - 0.34, mat: stripMat, renderOrder: 3 }));
  // 雨棚支撑柱（西南角）
  awning.add(cyl({ rTop: 0.09, h: STORE.awningY - 0.34, x: -aw / 2 + 0.4, y: 0, z: z1 + ad - 0.35, mat: toon(0xb9c1cf, { steps: 4 }), seg: 10, outline: 0.5 }));
  // 西侧同样出一段雨棚（街角两面都有檐）
  awning.add(cube({ w: 1.4, h: 0.2, d: z1 - z0 + 0.4, x: x0 - 0.7, y: STORE.awningY - 0.05, z: (z0 + z1) / 2, mat: awnMat, outline: 0.7 }));
  awning.add(cube({ w: 0.12, h: 0.3, d: z1 - z0 + 0.4, x: x0 - 1.35, y: STORE.awningY - 0.3, z: (z0 + z1) / 2, mat: toon(0xcdd4e0, { steps: 5 }), outline: 0.5 }));
  awning.name = 'awning';
  g.add(awning);

  // ---- 屋面板 + 女儿墙（日式便利店常见的平屋顶 + 四周矮墙）
  const pw = 0.26, ph = parapetY - wallH - FLOOR + 0.18;
  const roofTop = wallH + FLOOR;
  const roofMat = toon(0x6a7284, { steps: 4 });
  g.add(cube({ w: x1 - x0 + 0.24, h: 0.16, d: z1 - z0 + 0.24, x: (x0 + x1) / 2, y: roofTop - 0.16, z: (z0 + z1) / 2, mat: roofMat, outline: 0.7 }));
  // 屋面防水层压边
  g.add(cube({ w: x1 - x0 + 0.34, h: 0.06, d: z1 - z0 + 0.34, x: (x0 + x1) / 2, y: roofTop, z: (z0 + z1) / 2, mat: toon(0x565e70, { steps: 4 }), outline: 0.4 }));
  // 屋顶设备：空调外机 / 排风管 / 水箱 / 天窗
  g.add(cube({ w: 1.5, h: 0.85, d: 0.9, x: 3.2, y: roofTop, z: -6.4, mat: toon(0x9aa3b4, { steps: 4 }), outline: 0.6 }));
  g.add(cube({ w: 1.1, h: 0.7, d: 0.8, x: -3.4, y: roofTop, z: -6.6, mat: toon(0x8f98a9, { steps: 4 }), outline: 0.6 }));
  g.add(cyl({ rTop: 0.3, h: 0.75, x: 1.2, y: roofTop, z: -2.4, mat: toon(0x767f90, { steps: 4 }), seg: 12, outline: 0.5 }));
  g.add(cyl({ rTop: 0.22, h: 0.55, x: -1.6, y: roofTop, z: -1.0, mat: toon(0x8f98a9, { steps: 4 }), seg: 12, outline: 0.5 }));
  g.add(cyl({ rTop: 0.5, rBot: 0.5, h: 1.0, x: 4.6, y: roofTop, z: -8.0, mat: toon(0xb9c1cf, { steps: 4 }), seg: 14, outline: 0.6 }));
  // 天窗（店内灯光从屋顶透出一点点，夜景里很动人）
  const skyMat = glow(0xfff0d6, { transparent: true, opacity: 0.5 });
  g.add(groundPlane({ w: 1.2, d: 1.2, x: -3.8, y: roofTop + 0.08, z: -3.6, mat: skyMat, renderOrder: 4 }));
  g.add(cube({ w: x1 - x0 + 0.3, h: ph, d: pw, x: (x0 + x1) / 2, y: wallH + FLOOR, z: z1 + pw / 2 - 0.1, mat: trimMat, outline: 0.6 }));
  g.add(cube({ w: x1 - x0 + 0.3, h: ph, d: pw, x: (x0 + x1) / 2, y: wallH + FLOOR, z: z0 - pw / 2 + 0.1, mat: trimMat, outline: 0.6 }));
  g.add(cube({ w: pw, h: ph, d: z1 - z0 + 0.3, x: x0 - pw / 2 + 0.1, y: wallH + FLOOR, z: (z0 + z1) / 2, mat: trimMat, outline: 0.6 }));
  g.add(cube({ w: pw, h: ph, d: z1 - z0 + 0.3, x: x1 + pw / 2 - 0.1, y: wallH + FLOOR, z: (z0 + z1) / 2, mat: trimMat, outline: 0.6 }));

  // 店内天花
  const ceilMat = toon(0xf5f6fa, { steps: 5, emissive: 0xa89673, emissiveIntensity: 1 });
  g.add(groundPlane({ w: IN_X1 - IN_X0, d: IN_Z1 - IN_Z0, x: (IN_X0 + IN_X1) / 2, y: CEIL - 0.06, z: (IN_Z0 + IN_Z1) / 2, mat: ceilMat }));
}

function buildSolidPier(g, xa, xb, z, mat) {
  const w = xb - xa;
  if (w <= 0.001) return;
  g.add(cube({ w, h: STORE.wallH, d: STORE.wallT, x: (xa + xb) / 2, y: FLOOR, z, mat, outline: 1.0 }));
}

/**
 * 玻璃幕墙：下部矮墙 + 大面积玻璃 + 竖框 + 顶部横梁。
 * axis='z' 表示墙面法线沿 z（南墙），axis='x' 表示法线沿 x（西墙）。
 */
function buildGlazedWall(g, { axis, fixed, a0, a1, rotY }) {
  const len = a1 - a0, mid = (a0 + a1) / 2;
  const kick = 0.34, top = 2.92;
  const frameMat = toon(0xe4e8ef, { steps: 5 });
  const sillMat = toon(0xc7ccd6, { steps: 4 });
  const place = (obj) => {
    if (axis === 'z') obj.position.set(mid, obj.position.y, fixed);
    else obj.position.set(fixed, obj.position.y, mid);
    return obj;
  };
  const width = axis === 'z' ? 'w' : 'd';

  // 下部矮墙
  const kickObj = cube({ w: axis === 'z' ? len : STORE.wallT, h: kick, d: axis === 'z' ? STORE.wallT : len, x: 0, y: FLOOR, z: 0, mat: sillMat, outline: 0.7 });
  g.add(place(kickObj));

  // 玻璃
  const gh = top - kick - 0.06;
  const glassObj = panel({
    w: len, h: gh, x: 0, y: FLOOR + kick + gh / 2, z: 0,
    mat: glass({ opacity: 0.05 }),
    rotY,
  });
  place(glassObj);
  glassObj.name = 'storeGlass';
  glassObj.userData.glassScroll = true;
  g.add(glassObj);

  // 玻璃上的雨痕叠加层（轻微滚动，营造雨水沿玻璃滑落）
  const streakMat = new THREE.MeshBasicMaterial({
    map: TX.rainGlassTexture(), transparent: true, opacity: 0.075,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: true,
  });
  const streak = panel({ w: len, h: gh, x: 0, y: FLOOR + kick + gh / 2, z: 0, mat: streakMat, rotY });
  place(streak);
  const off = axis === 'z' ? 0.02 : -0.02;
  if (axis === 'z') streak.position.z += off; else streak.position.x += off;
  streak.userData.glassScroll = true;
  streak.name = 'glassRain';
  g.add(streak);

  // 竖框
  const n = Math.max(2, Math.round(len / 1.7));
  for (let i = 0; i <= n; i++) {
    const a = a0 + (len * i) / n;
    const mull = cube({
      w: axis === 'z' ? 0.1 : STORE.wallT + 0.04, h: top - kick, d: axis === 'z' ? STORE.wallT + 0.04 : 0.1,
      x: axis === 'z' ? a : fixed, y: FLOOR + kick, z: axis === 'z' ? fixed : a, mat: frameMat, outline: 0.45,
    });
    g.add(mull);
  }
  // 顶部横梁 + 底部横梁
  g.add(cube({
    w: axis === 'z' ? len : STORE.wallT + 0.06, h: 0.22, d: axis === 'z' ? STORE.wallT + 0.06 : len,
    x: axis === 'z' ? mid : fixed, y: FLOOR + top, z: axis === 'z' ? fixed : mid, mat: frameMat, outline: 0.6,
  }));
  g.add(cube({
    w: axis === 'z' ? len : STORE.wallT + 0.05, h: 0.1, d: axis === 'z' ? STORE.wallT + 0.05 : len,
    x: axis === 'z' ? mid : fixed, y: FLOOR + kick, z: axis === 'z' ? fixed : mid, mat: frameMat,
  }));

  // 门洞上方的门楣（仅南墙 doorR+1.5 ~ 墙端那段留白处不需要，此处用于整体压边）
  g.add(cube({
    w: axis === 'z' ? len : STORE.wallT, h: STORE.wallH - top - 0.22, d: axis === 'z' ? STORE.wallT : len,
    x: axis === 'z' ? mid : fixed, y: FLOOR + top + 0.22, z: axis === 'z' ? fixed : mid, mat: toon(PAL.storeWall, { steps: 5 }), outline: 0.7,
  }));
}

/* ================================================================ 自动门 */
function buildAutoDoor(g) {
  const { doorX, doorW, doorH, z1 } = STORE;
  const grp = new THREE.Group();
  grp.name = 'autoDoor';
  const zf = z1 - STORE.wallT / 2;
  const frameMat = toon(0xdfe3ea, { steps: 5 });
  const railMat = toon(0x9aa3b4, { steps: 4 });

  // 门框
  grp.add(cube({ w: 0.14, h: doorH, d: STORE.wallT + 0.08, x: doorX - doorW / 2 - 0.07, y: FLOOR, z: zf, mat: frameMat, outline: 0.5 }));
  grp.add(cube({ w: 0.14, h: doorH, d: STORE.wallT + 0.08, x: doorX + doorW / 2 + 0.07, y: FLOOR, z: zf, mat: frameMat, outline: 0.5 }));
  grp.add(cube({ w: doorW + 0.4, h: 0.26, d: STORE.wallT + 0.12, x: doorX, y: FLOOR + doorH, z: zf, mat: frameMat, outline: 0.6 }));
  grp.add(cube({ w: doorW + 0.4, h: 0.12, d: STORE.wallT + 0.14, x: doorX, y: FLOOR + doorH - 0.2, z: zf, mat: railMat }));

  // 两扇玻璃门
  const panelW = doorW / 2 - 0.02;
  const mkLeaf = (dir) => {
    const leaf = new THREE.Group();
    const doorGlassMat = glass({ opacity: 0.1 });
    leaf.add(panel({ w: panelW, h: doorH - 0.28, x: 0, y: FLOOR + (doorH - 0.28) / 2 + 0.14, z: zf, mat: doorGlassMat }));
    // 门框包边
    const fMat = toon(0xcfd5df, { steps: 4 });
    leaf.add(cube({ w: panelW, h: 0.12, d: STORE.wallT * 0.7, x: 0, y: FLOOR, z: zf, mat: fMat, outline: 0.4 }));
    leaf.add(cube({ w: panelW, h: 0.12, d: STORE.wallT * 0.7, x: 0, y: FLOOR + doorH - 0.34, z: zf, mat: fMat, outline: 0.4 }));
    leaf.add(cube({ w: 0.09, h: doorH - 0.28, d: STORE.wallT * 0.7, x: -dir * (panelW / 2 - 0.045), y: FLOOR + 0.12, z: zf, mat: fMat, outline: 0.4 }));
    leaf.add(cube({ w: 0.09, h: doorH - 0.28, d: STORE.wallT * 0.7, x: dir * (panelW / 2 - 0.045), y: FLOOR + 0.12, z: zf, mat: fMat, outline: 0.4 }));
    // 门贴（营业中）
    const stickerMat = glow(0xffffff, { map: TX.doorStickerTexture(), transparent: true, opacity: 0.96 });
    const sticker = panel({ w: 0.3, h: 0.6, x: -dir * (panelW / 2 - 0.24), y: FLOOR + 1.35, z: zf + 0.06, mat: stickerMat });
    leaf.add(sticker);
    // 门把手
    leaf.add(cyl({ rTop: 0.022, h: 1.0, x: dir * 0.02, y: FLOOR + 1.0, z: zf + 0.05, mat: toon(0xb6bdc9, { steps: 4 }), seg: 8 }));
    leaf.position.x = dir * (panelW / 2 + 0.01) + doorX;
    return leaf;
  };
  const left = mkLeaf(-1);
  const right = mkLeaf(1);
  grp.add(left, right);

  // 门口地垫
  const matTex = toon(0x3b4557, { steps: 4 });
  const mat = groundPlane({ w: 2.2, d: 0.95, x: doorX, y: FLOOR + 0.012, z: zf + 0.85, mat: matTex });
  grp.add(mat);
  const matTrim = groundPlane({ w: 2.36, d: 1.06, x: doorX, y: FLOOR + 0.008, z: zf + 0.85, mat: toon(0x2a3242, { steps: 3 }) });
  grp.add(matTrim);

  g.add(grp);
  return { group: grp, left, right, panelW, closedX: left.position.x };
}

/* ================================================================ 招牌灯箱 */
function buildSignage(g) {
  const { x0, x1, z1, signY } = STORE;
  const out = {};
  const cx = (x0 + x1) / 2;

  // ---- 主招牌（南向，白底灯箱）
  const boardMat = glow(0xeef3fb, { map: TX.signBoardTexture() });
  boardMat.userData.baseColor = new THREE.Color(0xffffff);
  const board = cube({ w: 10.6, h: 1.5, d: 0.26, x: cx, y: signY - 0.75, z: z1 + 0.36, mat: toon(0xe7ebf2, { steps: 5 }), outline: 0.8 });
  const face = panel({ w: 10.6, h: 1.5, x: cx, y: signY, z: z1 + 0.5, mat: boardMat, name: 'signFace' });
  g.add(board, face);
  out.boardFace = face;
  out.boardMat = boardMat;

  // 招牌背光
  const boardHalo = halo(0x9fd8ff, 9.0, 0.22);
  boardHalo.position.set(cx, signY, z1 + 0.9);
  g.add(boardHalo);

  // ---- 西向招牌（同样内容，朝横街）
  const faceW = panel({ w: 8.4, h: 1.4, x: x0 - 0.5, y: signY - 0.05, z: -3.4, mat: boardMat, rotY: -Math.PI / 2, name: 'signFaceW' });
  g.add(faceW);
  g.add(cube({ w: 0.26, h: 1.5, d: 8.6, x: x0 - 0.36, y: signY - 0.8, z: -3.4, mat: toon(0xe7ebf2, { steps: 5 }), outline: 0.8 }));

  // ---- 竖向侧招牌（街角 blade sign）
  const bladeTex = TX.bladeSignTexture();
  const bladeMat = glow(0xecf2fa, { map: bladeTex });
  const bladeGroup = new THREE.Group();
  bladeGroup.name = 'bladeSign';
  const bx = x1 + 0.55, bz = z1 - 0.9;
  const bladeBody = cube({ w: 0.2, h: 3.0, d: 0.9, x: bx, y: STORE.awningY + 0.1, z: bz, mat: toon(0xeef1f6, { steps: 5 }), outline: 0.7 });
  const bladeFront = panel({ w: 0.86, h: 2.9, x: bx + 0.11, y: STORE.awningY + 1.65, z: bz, mat: bladeMat, rotY: Math.PI / 2, name: 'bladeFace' });
  const bladeSide = panel({ w: 0.86, h: 2.9, x: bx, y: STORE.awningY + 1.65, z: bz + 0.46, mat: bladeMat, name: 'bladeFaceS' });
  bladeGroup.add(bladeBody, bladeFront, bladeSide);
  const bladeHalo = halo(0x8fd6ff, 5.4, 0.3);
  bladeHalo.position.set(bx + 0.5, STORE.awningY + 1.6, bz);
  bladeGroup.add(bladeHalo);
  // 招牌支架
  bladeGroup.add(cube({ w: 0.8, h: 0.1, d: 0.1, x: bx - 0.35, y: STORE.awningY + 2.95, z: bz, mat: toon(0x9aa3b4, { steps: 4 }) }));
  bladeGroup.add(cube({ w: 0.8, h: 0.1, d: 0.1, x: bx - 0.35, y: STORE.awningY + 0.45, z: bz, mat: toon(0x9aa3b4, { steps: 4 }) }));
  g.add(bladeGroup);
  out.blade = bladeGroup;
  out.bladeMats = [bladeMat, boardMat];

  // ---- 橱窗贴纸 / 促销海报（贴在玻璃内侧，透过玻璃可见）
  const posterMats = [0, 1, 2].map((i) => {
    const m = glow(0xffffff, { map: TX.posterTexture(i) });
    return m;
  });
  // 南侧橱窗内的海报
  g.add(panel({ w: 1.5, h: 1.9, x: STORE.doorX + 2.6, y: FLOOR + 1.5, z: z1 - STORE.wallT - 0.06, mat: posterMats[0] }));
  g.add(panel({ w: 1.35, h: 1.7, x: STORE.doorX + 4.5, y: FLOOR + 1.45, z: z1 - STORE.wallT - 0.06, mat: posterMats[1] }));
  g.add(panel({ w: 1.4, h: 1.8, x: x0 + STORE.wallT + 0.06, y: FLOOR + 1.5, z: 1.2, mat: posterMats[2], rotY: Math.PI / 2 }));

  // ---- 入口灯箱（店内天花下方，朝店外）
  const lbMat = glow(0xf0f4fa, { map: TX.lightboxTexture() });
  const lb = cube({ w: 3.2, h: 0.55, d: 0.14, x: STORE.doorX + 0.4, y: CEIL - 0.75, z: z1 - STORE.wallT - 0.2, mat: toon(0xf4f6fa, { steps: 5 }), outline: 0.5 });
  const lbFace = panel({ w: 3.1, h: 0.5, x: STORE.doorX + 0.4, y: CEIL - 0.48, z: z1 - STORE.wallT - 0.13, mat: lbMat, name: 'lightboxFace' });
  g.add(lb, lbFace);
  out.lightbox = lbFace;

  // 玻璃上的“24h”灯箱贴
  const badgeMat = glow(0xffffff, { map: TX.roadSignTexture('konbini'), transparent: true });
  g.add(panel({ w: 0.8, h: 0.8, x: x1 - 1.4, y: FLOOR + 2.3, z: z1 - STORE.wallT - 0.08, mat: badgeMat }));

  return out;
}

/* ============================================================== 店内灯光 */
function buildStoreLights(g) {
  const panelMat = glow(0xfff6e2, { transparent: true, opacity: 1.0 });
  const xs = [-3.2, 0.2, 3.6];
  const zs = [-6.6, -3.4, -0.2];
  xs.forEach((x) => zs.forEach((z) => {
    g.add(groundPlane({ w: 2.4, d: 0.42, x, y: CEIL - 0.085, z, mat: panelMat, renderOrder: 4 }));
    g.add(cube({ w: 2.5, h: 0.06, d: 0.52, x, y: CEIL - 0.14, z, mat: toon(0xdfe4ec, { steps: 4 }), anchor: 'center' }));
  }));

  // 天花主照明：6 个吊点 + 冷柜冷光 + 门头暖光，模拟便利店均匀亮堂的观感
  const grid = [
    [-3.0, -6.4], [1.2, -6.4], [-3.0, -3.2], [1.2, -3.2], [-3.0, 0.0], [1.2, 0.0],
  ];
  grid.forEach(([x, z]) => {
    const pl = new THREE.PointLight(0xfff1da, 18, 11, 2);
    pl.position.set(x, CEIL - 0.4, z);
    g.add(pl);
  });
  // 店内整体环境光（让陈设细节都能被看清，而不是只靠点光）
  const inAmb = new THREE.AmbientLight(0xffe9cf, 0.22);
  g.add(inAmb);
  // 冷柜的冷色光
  const coolLight = new THREE.PointLight(0xbfe8ff, 7, 6, 2);
  coolLight.position.set(4.9, 1.6, -1.0);
  g.add(coolLight);
  // 入口门头暖光
  const entryLight = new THREE.PointLight(0xffe2b0, 11, 7, 2);
  entryLight.position.set(STORE.doorX, CEIL - 0.5, STORE.z1 - 1.2);
  g.add(entryLight);

  // 店内地面导视（蓝色箭头 + 引导线）
  const decalMat = glow(0xffffff, { map: TX.floorDecalTexture(), transparent: true, opacity: 0.55, depthWrite: false });
  [[-2.0, 0.4], [0.6, 0.3], [-2.0, -2.0]].forEach(([x, z]) => {
    g.add(groundPlane({ w: 0.9, d: 0.9, x, y: FLOOR + 0.008, z, mat: decalMat, renderOrder: 5 }));
  });
  const guideMat = glow(0x6fb6e8, { transparent: true, opacity: 0.4, depthWrite: false });
  g.add(groundPlane({ w: 0.12, d: 2.6, x: STORE.doorX + 1.4, y: FLOOR + 0.006, z: -0.2, mat: guideMat, renderOrder: 5 }));
}

/* ================================================================ 店内陈设 */
function buildInterior(g) {
  const inGroup = new THREE.Group();
  inGroup.name = 'interior';
  g.add(inGroup);

  const shelfMat = toon(0xf2f5f9, { steps: 5, emissive: 0x6a6a76, emissiveIntensity: 1 });
  const shelfSideMat = toon(0xdde2ea, { steps: 5, emissive: 0x5a5a66, emissiveIntensity: 1 });
  const batcher = new ProductBatcher(inGroup);

  // ---- 三排中央货架（货架本体 + 商品实例化）
  STORE.shelfRows.forEach((zc, ri) => {
    inGroup.add(makeShelfRow(zc, shelfMat, shelfSideMat, ri));
    fillShelfProducts(batcher, STORE.shelfX0, STORE.shelfX1, zc, [0.34, 0.72, 1.10, 1.48], ri * 977 + 13);
  });

  // ---- 饮料冷柜（西墙，玻璃门朝店内）
  inGroup.add(makeDrinkCooler(batcher));

  // ---- 冰柜（东北角）
  inGroup.add(makeIceFreezer());

  // ---- 关东煮柜台（西墙玻璃边，从街上就能看见热气）
  inGroup.add(makeOdenCase());

  // ---- 收银台 + 咖啡机 + 收银设备
  inGroup.add(makeCounter());

  // ---- 杂志架（西南角橱窗前）
  inGroup.add(makeMagazineRack());

  // ---- 后场：货架、纸箱、门
  inGroup.add(makeBackArea());

  // ---- 天花吊旗 / 宣传条幅
  const flagCols = [0xff8fa8, 0xffd166, 0x8fd6ff, 0xa8e6a0];
  for (let i = 0; i < 8; i++) {
    const m = glow(flagCols[i % flagCols.length], { transparent: true, opacity: 0.95, side: THREE.DoubleSide });
    const f = panel({ w: 0.62, h: 0.5, x: -4.6 + i * 1.35, y: CEIL - 0.42, z: -2.2, mat: m, rotY: Math.PI / 2 });
    inGroup.add(f);
  }

  // ---- 店内墙面小海报栏
  const board = cube({ w: 1.6, h: 1.1, d: 0.06, x: -4.6, y: FLOOR + 1.5, z: STORE.z0 + STORE.wallT + 0.04, mat: toon(0x6b5a48, { steps: 4 }), outline: 0.5 });
  inGroup.add(board);
  const noticeMat = glow(0xffffff, { map: TX.noticeBoardTexture() });
  inGroup.add(panel({ w: 1.5, h: 1.0, x: -4.6, y: FLOOR + 2.05, z: STORE.z0 + STORE.wallT + 0.08, mat: noticeMat }));

  // 商品实例化落地
  batcher.flush();

  // ---- 垃圾箱 / 纸箱等生活感细节
  inGroup.add(cube({ w: 0.6, h: 0.85, d: 0.6, x: -5.2, y: FLOOR, z: -0.4, mat: toon(0x5d6675, { steps: 4 }), outline: 0.6 }));
  inGroup.add(cube({ w: 0.5, h: 0.4, d: 0.45, x: -5.0, y: FLOOR, z: -0.5, mat: toon(0xb08d64, { steps: 4 }), outline: 0.5 }));
}

/* ------------------------------------------------------------------ 货架 */
function makeShelfRow(zc, mat, sideMat, rowIndex) {
  const grp = new THREE.Group();
  grp.name = `shelfRow${rowIndex}`;
  const x0 = STORE.shelfX0, x1 = STORE.shelfX1;
  const w = x1 - x0, cx = (x0 + x1) / 2;
  const H = 1.62, D = 0.92;

  // 底座
  grp.add(cube({ w, h: 0.16, d: D, x: cx, y: FLOOR, z: zc, mat: sideMat, outline: 0.6 }));
  // 层板
  const decks = [0.34, 0.72, 1.10, 1.48];
  decks.forEach((y, i) => {
    grp.add(cube({ w, h: 0.06, d: D - 0.06, x: cx, y: FLOOR + y, z: zc, mat: mat, outline: 0.45 }));
    // 层板前挡边（价格条）
    const strip = glow(i === 0 ? 0xffe9a8 : 0xdff2ff, { transparent: true, opacity: 0.85 });
    grp.add(panel({ w, h: 0.075, d: 0.01, x: cx, y: FLOOR + y + 0.05, z: zc + D / 2 - 0.02, mat: strip }));
  });
  // 侧板
  [-w / 2, 0, w / 2].forEach((ox) => {
    grp.add(cube({ w: 0.05, h: H, d: D, x: cx + ox, y: FLOOR, z: zc, mat: sideMat, outline: 0.45 }));
  });
  // 顶部价签牌
  grp.add(cube({ w, h: 0.16, d: 0.03, x: cx, y: FLOOR + H - 0.16, z: zc + D / 2, mat: toon(0xf6f8fb, { steps: 5 }), outline: 0.4 }));

  return grp;
}

/** 货架商品（走批处理，减少 draw call） */
function fillShelfProducts(batcher, x0, x1, zc, decks, seedBase) {
  const productColors = [0xe8636f, 0x59a8e0, 0xf0c04a, 0x6fc48c, 0xb98fe0, 0xf2f2f0, 0xe89b4a];
  const capColors = [0x2f3542, 0xd8dde6];
  const bottleGeo = new THREE.CylinderGeometry(0.035, 0.035, 1, 8, 1);
  const canGeo = new THREE.CylinderGeometry(0.036, 0.036, 1, 10, 1);
  const capGeo = new THREE.CylinderGeometry(0.018, 0.018, 1, 6, 1);
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const mBottle = toon(0xffffff, { steps: 4 });
  const mCan = toon(0xffffff, { steps: 4 });
  const mCap = toon(0xffffff, { steps: 3 });
  const mBox = toon(0xffffff, { steps: 4 });
  let seed = seedBase;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const w = x1 - x0;

  decks.forEach((y, di) => {
    const slots = 9;
    for (let i = 0; i < slots; i++) {
      const px = x0 + 0.34 + (i * (w - 0.68)) / (slots - 1);
      if (rnd() < 0.1) continue;
      const kind = rnd();
      const zj = (rnd() - 0.5) * 0.18;
      const c = productColors[(i * 3 + di) % productColors.length];
      if (kind < 0.42) {
        const h = 0.24 + rnd() * 0.05;
        batcher.add(`bottle${c}`, bottleGeo, toon(c, { steps: 4 }), px, FLOOR + y + 0.03 + h / 2, zc + zj, 0, 1, h, 1);
        batcher.add(`cap${capColors[i % 2]}`, capGeo, toon(capColors[i % 2], { steps: 3 }), px, FLOOR + y + 0.03 + h + 0.025, zc + zj, 0, 1, 0.05, 1);
      } else if (kind < 0.75) {
        batcher.add(`can${c}`, canGeo, toon(c, { steps: 4 }), px, FLOOR + y + 0.03 + 0.065, zc + zj, 0, 1, 0.13, 1);
      } else {
        const h = 0.14 + rnd() * 0.06;
        batcher.add(`box${c}`, boxGeo, toon(c, { steps: 4 }), px, FLOOR + y + 0.03 + h / 2, zc + zj, (rnd() - 0.5) * 0.5, 0.11, h, 0.08);
      }
    }
  });
}

/* ---------------------------------------------------------------- 饮料柜 */
function makeDrinkCooler(batcher) {
  const { x0, x1, z0, z1, h } = STORE.cooler;
  const grp = new THREE.Group();
  grp.name = 'drinkCooler';
  const bodyMat = toon(0xeef2f8, { steps: 5, emissive: 0x66707e, emissiveIntensity: 1 });
  const frameMat = toon(0xd8dee8, { steps: 5, emissive: 0x5c6472, emissiveIntensity: 1 });

  // 柜体（背板 + 顶 + 底 + 侧板）
  grp.add(cube({ w: 0.14, h, d: z1 - z0, x: x0 + 0.07, y: FLOOR, z: (z0 + z1) / 2, mat: bodyMat, outline: 0.7 })); // 背板（贴西墙）
  grp.add(cube({ w: x1 - x0, h: 0.16, d: z1 - z0, x: (x0 + x1) / 2, y: FLOOR, z: (z0 + z1) / 2, mat: frameMat, outline: 0.6 }));
  grp.add(cube({ w: x1 - x0, h: 0.18, d: z1 - z0, x: (x0 + x1) / 2, y: FLOOR + h - 0.18, z: (z0 + z1) / 2, mat: frameMat, outline: 0.6 }));
  grp.add(cube({ w: x1 - x0, h, d: 0.12, x: (x0 + x1) / 2, y: FLOOR, z: z0 + 0.06, mat: frameMat, outline: 0.6 }));
  grp.add(cube({ w: x1 - x0, h, d: 0.12, x: (x0 + x1) / 2, y: FLOOR, z: z1 - 0.06, mat: frameMat, outline: 0.6 }));
  // 顶盖 / 侧封
  grp.add(cube({ w: x1 - x0, h: 0.12, d: z1 - z0, x: (x0 + x1) / 2, y: FLOOR + h - 0.12, z: (z0 + z1) / 2, mat: frameMat, outline: 0.5 }));

  // 内部照明背板（冷白光，贴西墙）
  const backMat = glow(0xe4f6ff, { transparent: true, opacity: 1.0, side: THREE.DoubleSide });
  grp.add(panel({ w: z1 - z0 - 0.24, h: h - 0.4, x: x0 + 0.15, y: FLOOR + h / 2, z: (z0 + z1) / 2, mat: backMat, rotY: Math.PI / 2 }));

  // 货架层 + 饮料（饮料走实例化批处理）
  const cols = [0x59a8e0, 0xe8636f, 0x6fc48c, 0xf0c04a, 0xf2f2f0, 0x9a7de0, 0xe89b4a, 0x63d2d2];
  const tallGeo = new THREE.CylinderGeometry(0.037, 0.037, 1, 8, 1);
  const shortGeo = new THREE.CylinderGeometry(0.032, 0.032, 1, 8, 1);
  const capGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.04, 6, 1);
  const capMat = toon(0x39404e, { steps: 3 });
  const shelfYs = [0.3, 0.72, 1.14, 1.56, 1.92];
  shelfYs.forEach((sy, si) => {
    grp.add(cube({ w: 0.62, h: 0.05, d: z1 - z0 - 0.3, x: (x0 + x1) / 2 + 0.2, y: FLOOR + sy, z: (z0 + z1) / 2, mat: frameMat }));
    const n = 9;
    for (let i = 0; i < n; i++) {
      const pz = z0 + 0.32 + (i * (z1 - z0 - 0.64)) / (n - 1);
      const tall = si < 3;
      const hh = tall ? 0.26 : 0.17;
      const c = cols[(si * 3 + i) % cols.length];
      const px = (x0 + x1) / 2 + 0.24;
      if (batcher) {
        batcher.add(`cool${c}`, tall ? tallGeo : shortGeo, toon(c, { steps: 4 }), px, FLOOR + sy + 0.02 + hh / 2, pz, 0, 1, hh, 1);
        batcher.add('coolcap', capGeo, capMat, px, FLOOR + sy + 0.02 + hh + 0.02, pz, 0, 1, 1, 1);
      } else {
        grp.add(cyl({ rTop: tall ? 0.037 : 0.032, h: hh, x: px, y: FLOOR + sy + 0.02, z: pz, mat: toon(c, { steps: 4 }), seg: 8 }));
        grp.add(cyl({ rTop: 0.02, h: 0.04, x: px, y: FLOOR + sy + 0.02 + hh, z: pz, mat: capMat, seg: 6 }));
      }
    }
  });

  // 玻璃门（朝店内，即 -x 方向）
  const doorMat = glass({ opacity: 0.16 });
  const gd = panel({ w: z1 - z0 - 0.16, h: h - 0.34, x: x1 - 0.04, y: FLOOR + h / 2, z: (z0 + z1) / 2, mat: doorMat, rotY: Math.PI / 2 });
  grp.add(gd);
  grp.add(cube({ w: 0.06, h: h - 0.2, d: 0.1, x: x1 - 0.02, y: FLOOR + 0.1, z: (z0 + z1) / 2, mat: frameMat }));
  // 门把
  grp.add(cyl({ rTop: 0.022, h: h - 0.7, x: x1 + 0.02, y: FLOOR + 0.35, z: (z0 + z1) / 2 - 0.3, mat: toon(0xc3cad6, { steps: 4 }), seg: 8 }));

  // 柜顶广告牌（冷柜上方灯箱）
  const topSign = glow(0xffffff, { transparent: true });
  topSign.map = TX.posterTexture(1);
  grp.add(panel({ w: z1 - z0 - 0.4, h: 0.34, x: x1 + 0.02, y: FLOOR + h + 0.06, z: (z0 + z1) / 2, mat: topSign, rotY: Math.PI / 2 }));
  return grp;
}

/* ------------------------------------------------------------------ 冰柜 */
function makeIceFreezer() {
  const { x0, x1, z0, z1, h } = STORE.iceFreezer;
  const grp = new THREE.Group();
  grp.name = 'iceFreezer';
  const bodyMat = toon(0xe6eaf1, { steps: 5 });
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  grp.add(cube({ w: x1 - x0, h, d: z1 - z0, x: cx, y: FLOOR, z: cz, mat: bodyMat, outline: 0.8 }));
  // 斜角玻璃盖
  const lidMat = glass({ opacity: 0.22 });
  grp.add(panel({ w: x1 - x0 - 0.2, h: z1 - z0 - 0.2, x: cx, y: FLOOR + h + 0.06, z: cz, mat: lidMat, rotX: -Math.PI / 2 + 0.16 }));
  // 内部商品
  const cols = [0xff8fa8, 0xffd166, 0x8fd6ff, 0xa8e6a0, 0xffffff];
  for (let i = 0; i < 12; i++) {
    const px = x0 + 0.35 + (i % 3) * 0.7;
    const pz = z0 + 0.45 + Math.floor(i / 3) * 0.75;
    grp.add(cyl({ rTop: 0.16, h: 0.14, x: px, y: FLOOR + h - 0.24, z: pz, mat: glow(cols[i % cols.length], { transparent: true, opacity: 0.95 }), seg: 12 }));
  }
  // 冰柜内部冷光
  const inLight = new THREE.PointLight(0xbfe8ff, 3.5, 3.0, 2);
  inLight.position.set(cx, FLOOR + h - 0.3, cz);
  grp.add(inLight);
  // 顶部价签
  const signMat = glow(0xffffff, { transparent: true });
  signMat.map = TX.posterTexture(2);
  grp.add(panel({ w: 1.1, h: 0.3, x: cx, y: FLOOR + h + 0.02, z: z0 - 0.02, mat: signMat }));
  return grp;
}

/* ------------------------------------------------------------ 关东煮柜台 */
function makeOdenCase() {
  const { x0, x1, z0, z1, h } = STORE.odenCase;
  const grp = new THREE.Group();
  grp.name = 'odenCase';
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const steelMat = toon(0xdfe4ec, { steps: 5 });
  const woodMat = toon(0x8a6a4e, { steps: 4 });

  // 台体（木纹立面 + 不锈钢台面）
  grp.add(cube({ w: x1 - x0, h: h - 0.06, d: z1 - z0, x: cx, y: FLOOR, z: cz, mat: woodMat, outline: 0.7 }));
  grp.add(cube({ w: x1 - x0 + 0.08, h: 0.06, d: z1 - z0 + 0.08, x: cx, y: FLOOR + h - 0.06, z: cz, mat: steelMat, outline: 0.5 }));

  // 关东煮锅（分隔格 + 汤色）
  const potMat = toon(0xc9ced8, { steps: 4 });
  const brothMat = glow(0xf0c07a, { transparent: true, opacity: 0.95 });
  grp.add(cube({ w: x1 - x0 - 0.1, h: 0.16, d: z1 - z0 - 0.2, x: cx, y: FLOOR + h, z: cz, mat: potMat, outline: 0.5 }));
  for (let i = 0; i < 3; i++) {
    const pz = z0 + 0.55 + i * 0.95;
    grp.add(groundPlane({ w: x1 - x0 - 0.22, d: 0.72, x: cx, y: FLOOR + h + 0.15, z: pz, mat: brothMat, renderOrder: 6 }));
    // 丸子 / 串
    for (let k = 0; k < 4; k++) {
      grp.add(cyl({
        rTop: 0.055, h: 0.12, x: cx - 0.14 + k * 0.09, y: FLOOR + h + 0.08,
        z: pz - 0.2 + k * 0.14, mat: toon(k % 2 ? 0xd8a26a : 0xe8d9b8, { steps: 4 }), seg: 8,
      }));
    }
  }
  // 玻璃防尘罩
  const shield = glass({ opacity: 0.14 });
  grp.add(panel({ w: x1 - x0 - 0.06, h: 0.55, x: cx, y: FLOOR + h + 0.28, z: z1 - 0.03, mat: shield }));
  grp.add(panel({ w: z1 - z0 - 0.1, h: 0.55, x: x1 - 0.03, y: FLOOR + h + 0.28, z: cz, mat: shield, rotY: -Math.PI / 2 }));
  // 顶灯（暖光，透出蒸汽感）
  grp.add(cube({ w: x1 - x0 - 0.1, h: 0.08, d: 0.1, x: cx, y: FLOOR + h + 0.56, z: cz, mat: glow(0xffd9a0, { transparent: true, opacity: 0.9 }) }));
  const odenLight = new THREE.PointLight(0xffc27a, 4.5, 3.0, 2);
  odenLight.position.set(cx + 0.5, FLOOR + h + 0.5, cz);
  grp.add(odenLight);

  // 价签
  const tagMat = glow(0xfff2cf, { transparent: true, opacity: 0.95 });
  grp.add(panel({ w: 0.24, h: 0.16, x: cx, y: FLOOR + h + 0.42, z: z1 + 0.02, mat: tagMat }));
  return grp;
}

/* ---------------------------------------------------------------- 收银台 */
function makeCounter() {
  const { x0, x1, z0, z1, h } = STORE.counter;
  const grp = new THREE.Group();
  grp.name = 'counter';
  const bodyMat = toon(0xdfe4ec, { steps: 5, emissive: 0x626a78, emissiveIntensity: 1 });
  const topMat = toon(0xf6f8fb, { steps: 5, emissive: 0x767680, emissiveIntensity: 1 });
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;

  // 台体
  grp.add(cube({ w: x1 - x0, h: h - 0.06, d: z1 - z0, x: cx, y: FLOOR, z: cz, mat: bodyMat, outline: 0.7 }));
  grp.add(cube({ w: x1 - x0 + 0.1, h: 0.06, d: z1 - z0 + 0.12, x: cx, y: FLOOR + h - 0.06, z: cz, mat: topMat, outline: 0.5 }));
  // 台前挡板
  grp.add(cube({ w: x1 - x0 + 0.04, h: 0.5, d: 0.05, x: cx, y: FLOOR + 0.1, z: z1 + 0.02, mat: toon(0xc8cfda, { steps: 4 }) }));

  // 收银机
  const regBody = cube({ w: 0.42, h: 0.16, d: 0.36, x: x0 + 0.5, y: FLOOR + h, z: cz - 0.1, mat: toon(0xd8dce4, { steps: 4 }), outline: 0.45 });
  grp.add(regBody);
  const screenMat = glow(0x8fe0ff, { transparent: true, opacity: 0.95 });
  grp.add(panel({ w: 0.34, h: 0.26, x: x0 + 0.5, y: FLOOR + h + 0.3, z: cz - 0.1, mat: screenMat, rotX: -0.28 }));
  grp.add(cube({ w: 0.36, h: 0.06, d: 0.1, x: x0 + 0.5, y: FLOOR + h + 0.16, z: cz - 0.24, mat: toon(0xb9c0cc, { steps: 4 }) }));
  // 客显
  grp.add(panel({ w: 0.26, h: 0.18, x: x0 + 0.5, y: FLOOR + h + 0.22, z: z1 + 0.06, mat: glow(0xffd9a0, { transparent: true, opacity: 0.9 }) }));
  // 扫码枪 / 读卡器
  grp.add(cube({ w: 0.14, h: 0.1, d: 0.12, x: x0 + 1.0, y: FLOOR + h, z: cz - 0.14, mat: toon(0x4b5262, { steps: 4 }), outline: 0.35 }));
  grp.add(cube({ w: 0.16, h: 0.12, d: 0.1, x: x1 - 0.24, y: FLOOR + h, z: cz + 0.16, mat: toon(0x5b6478, { steps: 4 }), outline: 0.35 }));

  // 咖啡机（柜台西端）
  grp.add(makeCoffeeMachine(STORE.coffee.x, FLOOR + h, STORE.coffee.z));

  // 小物：纸杯塔、抹布、托盘
  for (let i = 0; i < 3; i++) {
    grp.add(cyl({ rTop: 0.04, h: 0.1, x: x0 + 1.5, y: FLOOR + h + i * 0.02, z: cz + 0.12, mat: toon(0xf4f6f9, { steps: 4 }), seg: 10 }));
  }
  grp.add(cube({ w: 0.3, h: 0.04, d: 0.22, x: x0 + 1.2, y: FLOOR + h, z: cz - 0.28, mat: toon(0xc9d2de, { steps: 4 }) }));

  // 收银员凳
  grp.add(cyl({ rTop: 0.17, h: 0.06, x: cx + 0.1, y: FLOOR + 0.42, z: z0 - 0.4, mat: toon(0x4a5262, { steps: 4 }), seg: 12 }));
  grp.add(cyl({ rTop: 0.04, h: 0.42, x: cx + 0.1, y: FLOOR, z: z0 - 0.4, mat: toon(0x3b4250, { steps: 4 }), seg: 8 }));
  // 柜台后纸箱
  grp.add(cube({ w: 0.52, h: 0.4, d: 0.4, x: x1 - 0.2, y: FLOOR, z: z0 - 0.7, mat: toon(0xc0a077, { steps: 4 }), outline: 0.5 }));
  grp.add(cube({ w: 0.46, h: 0.34, d: 0.36, x: x1 - 0.26, y: FLOOR + 0.4, z: z0 - 0.66, mat: toon(0xb59a72, { steps: 4 }), outline: 0.5 }));

  return grp;
}

function makeCoffeeMachine(x, y, z) {
  const grp = new THREE.Group();
  grp.name = 'coffeeMachine';
  const bodyMat = toon(0x3d4452, { steps: 4 });
  const steel = toon(0xd6dae2, { steps: 4 });
  grp.add(cube({ w: 0.44, h: 0.62, d: 0.42, x, y, z, mat: bodyMat, outline: 0.6 }));
  grp.add(cube({ w: 0.4, h: 0.08, d: 0.38, x, y: y + 0.62, z, mat: steel, outline: 0.4 }));
  // 前面板 + 按钮
  grp.add(panel({ w: 0.34, h: 0.2, x, y: y + 0.42, z: z + 0.215, mat: glow(0xffe9c0, { transparent: true, opacity: 0.95 }) }));
  for (let i = 0; i < 3; i++) {
    grp.add(cube({ w: 0.06, h: 0.05, d: 0.02, x: x - 0.12 + i * 0.12, y: y + 0.24, z: z + 0.22, mat: glow([0x8fe0ff, 0xffd166, 0xff8fa8][i], { transparent: true }), anchor: 'center' }));
  }
  // 出水口 + 杯托
  grp.add(cube({ w: 0.1, h: 0.12, d: 0.08, x, y: y + 0.16, z: z + 0.12, mat: steel }));
  grp.add(cyl({ rTop: 0.055, h: 0.1, x, y: y + 0.04, z: z + 0.14, mat: toon(0xf4f6f9, { steps: 4 }), seg: 10 }));
  return grp;
}

/* ---------------------------------------------------------------- 杂志架 */
function makeMagazineRack() {
  const grp = new THREE.Group();
  grp.name = 'magazineRack';
  const x = STORE.magazine.x, z = STORE.magazine.z;
  const frameMat = toon(0xd0d5de, { steps: 4 });
  grp.add(cube({ w: 1.15, h: 1.3, d: 0.5, x, y: FLOOR, z, mat: frameMat, outline: 0.7 }));
  // 三层斜放杂志
  [0.3, 0.66, 1.02].forEach((y, li) => {
    for (let i = 0; i < 4; i++) {
      const m = glow(0xffffff, { map: TX.magazineTexture((li * 4 + i) % 4) });
      const mx = x - 0.4 + i * 0.27;
      grp.add(panel({ w: 0.22, h: 0.3, x: mx, y: FLOOR + y + 0.12, z: z + 0.2, mat: m, rotX: -0.22 }));
    }
    grp.add(cube({ w: 1.05, h: 0.04, d: 0.34, x, y: FLOOR + y, z: z + 0.12, mat: toon(0xe4e8ef, { steps: 4 }) }));
  });
  // 顶部小灯箱
  grp.add(cube({ w: 1.1, h: 0.22, d: 0.1, x, y: FLOOR + 1.32, z: z + 0.14, mat: glow(0xfff0cf, { transparent: true, opacity: 0.95 }), anchor: 'center' }));
  return grp;
}

/* ------------------------------------------------------------------ 后场 */
function makeBackArea() {
  const grp = new THREE.Group();
  grp.name = 'backArea';
  const { x0, x1, z0, z1, h } = STORE.backShelves;
  const steel = toon(0xb9c0cc, { steps: 4 });
  const boxMat = toon(0xc0a077, { steps: 4 });
  const blueMat = toon(0x4f7fc0, { steps: 4 });

  // 后场货架
  for (let lv = 0; lv < 3; lv++) {
    grp.add(cube({ w: x1 - x0, h: 0.05, d: z1 - z0, x: (x0 + x1) / 2, y: FLOOR + 0.35 + lv * 0.6, z: (z0 + z1) / 2, mat: steel }));
  }
  [x0, x1].forEach((px) => {
    grp.add(cube({ w: 0.06, h, d: z1 - z0, x: px, y: FLOOR, z: (z0 + z1) / 2, mat: steel, outline: 0.4 }));
  });
  // 堆放的纸箱与周转筐
  for (let i = 0; i < 7; i++) {
    const px = x0 + 0.35 + (i % 3) * 1.5;
    const pz = z0 + 0.35 + Math.floor(i / 3) * 0.75;
    const lv = i % 3;
    grp.add(cube({ w: 0.62, h: 0.42, d: 0.5, x: px, y: FLOOR + lv * 0.62 + 0.05, z: pz, mat: i % 2 ? blueMat : boxMat, rotY: (i % 4) * 0.12, outline: 0.5 }));
  }
  // 后场门（北墙）
  const { x: bx, z: bz } = STORE.backDoor;
  grp.add(cube({ w: 1.05, h: 2.1, d: 0.08, x: bx, y: FLOOR, z: bz + STORE.wallT / 2 + 0.02, mat: toon(0x9aa3b4, { steps: 4 }), outline: 0.6 }));
  grp.add(cyl({ rTop: 0.03, h: 0.16, x: bx + 0.4, y: FLOOR + 1.0, z: bz + STORE.wallT / 2 + 0.09, mat: toon(0x6b7484, { steps: 3 }), seg: 8 }));
  // 门上方 “STAFF ONLY” 灯牌
  const staffMat = glow(0xffd9a0, { transparent: true, opacity: 0.9 });
  grp.add(panel({ w: 0.62, h: 0.2, x: bx, y: FLOOR + 2.28, z: bz + STORE.wallT / 2 + 0.06, mat: staffMat }));
  // 后场顶灯
  grp.add(groundPlane({ w: 2.0, d: 0.36, x: (x0 + x1) / 2, y: CEIL - 0.09, z: -7.4, mat: glow(0xffe6bd, { transparent: true, opacity: 0.9 }), renderOrder: 4 }));
  return grp;
}
