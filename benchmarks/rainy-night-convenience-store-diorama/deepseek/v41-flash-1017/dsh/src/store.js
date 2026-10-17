import * as THREE from 'three';
import { STORE, SIDEWALK_Y, PALETTE } from './config.js';
import {
  addBox,
  addCylinder,
  addPlane,
  addGroundPlane,
  addRodBetween,
  addGlowSprite,
  addGroundGlow,
  toon,
  basic,
  physical,
  planeMaterial,
  canvasTexture,
  brandSignTexture,
  promoPosterTexture,
  windowDecalTexture,
  floorTileTexture,
  JP_FONT,
  LATIN_FONT,
  drawStar,
  easyInOut,
} from './lib.js';
import { buildInterior, buildInteriorLighting } from './store-interior.js';

const floorY = STORE.floorY + 0.008;
const innerBack = -4.46;

/* ------------------------------------------------------------------ */
/* Building shell                                                     */
/* ------------------------------------------------------------------ */

function buildShell(parent, ctx) {
  const cream = toon(PALETTE.storeWall);
  const trim = toon(PALETTE.storeTrim);
  const trimDeep = toon(PALETTE.storeTrimDeep);
  const mint = toon(PALETTE.mint);
  const orange = toon(PALETTE.orange);

  const W = STORE.right - STORE.left;
  const D = STORE.front - STORE.back;
  const cx = (STORE.left + STORE.right) / 2;
  const cz = (STORE.back + STORE.front) / 2;

  // A wafer-thin foundation; the warm interior floor sits just above it.
  addBox(parent, W, 0.035, D, trimDeep, cx, 0.155, cz, { cast: false, receive: true });
  addBox(parent, W - 0.22, 0.025, D - 0.25, toon(0xb8ad97), cx, 0.15, cz, { cast: false, receive: true });
  const tileMat = physical(0xb09a80, {
    map: floorTileTexture(),
    roughness: 0.3,
    metalness: 0.04,
    clearcoat: 0.7,
    clearcoatRoughness: 0.16,
    envMapIntensity: 0.55,
    outline: false,
  });
  addGroundPlane(parent, W - 0.25, D - 0.28, tileMat, cx, floorY, cz);

  // Cream shell: back, left and a solid piece before the corner window.
  addBox(parent, W, 4.72, 0.16, cream, cx, 2.5, STORE.back + 0.08, { cast: true, receive: true });
  addBox(parent, 0.16, 4.72, D, cream, STORE.left + 0.08, 2.5, cz, { cast: true, receive: true });
  addBox(parent, 0.16, 4.72, 1.62, cream, STORE.right - 0.08, 2.5, STORE.back + 0.81, { cast: true, receive: true });
  // The top is deliberately open beneath a glass skylight, so the miniature
  // reads like a cutaway dollhouse from above.

  // Deep teal wainscot and a slim warm rail along the back wall.
  addBox(parent, W - 0.2, 0.5, 0.045, toon(0x376560), cx, 0.44, innerBack + 0.022, { cast: false });
  addBox(parent, W - 0.2, 0.035, 0.06, toon(0x9c8257), cx, 0.72, innerBack + 0.04, { cast: false });

  // Front glazing: low plinth, head beam and mullions.
  addBox(parent, W, 0.25, 0.2, trim, cx, 0.28, STORE.front - 0.03, { cast: true });
  addBox(parent, W, 0.14, 0.25, trimDeep, cx, 2.97, STORE.front - 0.03, { cast: true });
  addBox(parent, W, 0.045, 0.22, mint, 1.18, 2.942, STORE.front + 0.007, { cast: false });
  addBox(parent, 0.2, 0.25, D - 0.2, trim, STORE.right - 0.03, 0.28, cz, { cast: true });
  addBox(parent, 0.22, 0.14, D - 0.2, trimDeep, STORE.right - 0.03, 2.97, cz, { cast: true });

  const frontMullions = [-4.01, -2.35, -0.05, 0.54, 1.91, 2.06];
  for (const x of frontMullions) {
    addBox(parent, 0.075, 3.47, 0.1, trim, x, 2.045, STORE.front + 0.005, { cast: true });
  }
  const sideMullions = [-2.88, -1.35, 0.2, 1.75];
  for (const z of sideMullions) {
    addBox(parent, 0.1, 3.47, 0.075, trim, STORE.right - 0.005, 2.045, z, { cast: true });
  }
  addBox(parent, 0.1, 3.47, 0.09, trim, STORE.right - 0.005, 2.045, -2.9, { cast: true });
  addBox(parent, W, 0.075, 0.09, trim, cx, 3.76, STORE.front + 0.01, { cast: true });
  addBox(parent, 0.09, 0.075, D - 0.2, trim, STORE.right - 0.005, 3.76, cz, { cast: true });

  // Shop glazing. The door bay is deliberately left open in the fixed panes.
  const glassMat = physical(0xa8dcd8, {
    transparent: true,
    opacity: 0.105,
    roughness: 0.08,
    metalness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.25,
    side: THREE.DoubleSide,
    depthWrite: false,
    outline: false,
  });
  const frontLeft = addPlane(parent, 4.49, 3.45, glassMat, -1.735, 2.03, STORE.front + 0.012);
  frontLeft.renderOrder = 5;
  const frontRight = addPlane(parent, 0.14, 3.45, glassMat, 1.985, 2.03, STORE.front + 0.012);
  frontRight.renderOrder = 5;
  const doorTransom = addPlane(parent, 1.36, 0.84, glassMat, 1.225, 3.37, STORE.front + 0.012);
  doorTransom.renderOrder = 5;
  const sideGlass = addPlane(parent, 4.6, 3.45, glassMat, STORE.right + 0.012, 2.03, -0.57, { ry: Math.PI / 2 });
  sideGlass.renderOrder = 5;

  // A faint diagonal sheen makes the glazing read while keeping the interior legible.
  const sheenTex = canvasTexture(512, 512, (ctx2, w, h) => {
    ctx2.clearRect(0, 0, w, h);
    ctx2.globalAlpha = 0.18;
    ctx2.fillStyle = '#d8f8f4';
    ctx2.beginPath();
    ctx2.moveTo(70, 512);
    ctx2.lineTo(114, 512);
    ctx2.lineTo(330, 0);
    ctx2.lineTo(286, 0);
    ctx2.closePath();
    ctx2.fill();
    ctx2.globalAlpha = 0.1;
    ctx2.beginPath();
    ctx2.moveTo(350, 512);
    ctx2.lineTo(368, 512);
    ctx2.lineTo(474, 0);
    ctx2.lineTo(456, 0);
    ctx2.closePath();
    ctx2.fill();
    ctx2.globalAlpha = 0.08;
    ctx2.fillStyle = '#ffd8a2';
    ctx2.fillRect(0, 160, w, 35);
  });
  addPlane(parent, 4.47, 3.4, basic(0xffffff, { map: sheenTex, transparent: true, opacity: 0.42, depthWrite: false }), -1.735, 2.03, STORE.front + 0.035, {
    renderOrder: 6,
  });
  addPlane(parent, 4.58, 3.4, basic(0xffffff, { map: sheenTex, transparent: true, opacity: 0.28, depthWrite: false }), STORE.right + 0.035, 2.03, -0.57, {
    ry: Math.PI / 2,
    renderOrder: 6,
  });

  // Glass decals and shop posters.
  addPlane(parent, 0.49, 0.245, planeMaterial(windowDecalTexture('open')), -3.53, 2.5, STORE.front + 0.055, { renderOrder: 7 });
  addPlane(parent, 0.82, 0.41, planeMaterial(windowDecalTexture('payment'), { transparent: true }), -0.8, 0.54, STORE.front + 0.055, { renderOrder: 7 });
  addPlane(parent, 0.7, 0.35, planeMaterial(windowDecalTexture('auto'), { transparent: true }), STORE.right + 0.055, 0.57, 0.4, {
    ry: Math.PI / 2,
    renderOrder: 7,
  });
  addPlane(parent, 0.48, 0.67, planeMaterial(promoPosterTexture('milk')), -2.38, 1.18, STORE.front + 0.058, { renderOrder: 7 });
  addPlane(parent, 0.45, 0.63, planeMaterial(promoPosterTexture('onigiri')), 0.12, 1.19, STORE.front + 0.058, { renderOrder: 7 });
  addPlane(parent, 0.44, 0.62, planeMaterial(promoPosterTexture('coffee')), STORE.right + 0.058, 1.33, 0.64, { ry: Math.PI / 2, renderOrder: 7 });

  // A tiny warm OPEN sign, visible through the corner glazing.
  const openLight = canvasTexture(320, 180, (ctx2, w, h) => {
    ctx2.fillStyle = '#173c3c';
    ctx2.fillRect(0, 0, w, h);
    ctx2.strokeStyle = '#ffd28b';
    ctx2.lineWidth = 4;
    ctx2.strokeRect(8, 8, w - 16, h - 16);
    ctx2.fillStyle = '#ffd89a';
    ctx2.font = `800 74px ${LATIN_FONT}`;
    ctx2.textAlign = 'center';
    ctx2.fillText('OPEN', w / 2, 106);
    ctx2.fillStyle = '#8ee1cd';
    ctx2.font = `600 25px ${JP_FONT}`;
    ctx2.fillText('24時間 営業中', w / 2, 149);
  });
  addPlane(parent, 0.46, 0.26, planeMaterial(openLight), 2.076, 2.54, 0.62, { ry: Math.PI / 2, renderOrder: 8 });
  addGlowSprite(parent, 0xffc983, 0.8, 2.12, 2.53, 0.62, 0.12);

  // High fascia band. The full-height glass below stays unobstructed, so the
  // warm interior reads from the street and from the diorama viewpoint.
  addBox(parent, W + 0.16, 0.08, 0.16, cream, cx, 3.83, STORE.front + 0.05, { cast: true });
  addBox(parent, W + 0.16, 0.08, 0.16, cream, cx, 3.83, STORE.back - 0.05, { cast: true });
  addBox(parent, 0.16, 0.08, D + 0.16, cream, STORE.left - 0.05, 3.83, cz, { cast: true });
  addBox(parent, 0.16, 0.08, D + 0.16, cream, STORE.right + 0.05, 3.83, cz, { cast: true });

  addBox(parent, W + 0.2, 1.04, 0.18, trim, cx, 4.4, STORE.front + 0.1, { cast: true });
  addBox(parent, W + 0.2, 1.04, 0.18, trim, cx, 4.4, STORE.back - 0.1, { cast: true });
  addBox(parent, 0.18, 1.04, D, trim, STORE.left - 0.1, 4.4, cz, { cast: true });
  addBox(parent, 0.18, 1.04, D, trim, STORE.right + 0.1, 4.4, cz, { cast: true });

  addBox(parent, W + 0.22, 0.08, 0.2, cream, cx, 4.94, STORE.front + 0.07, { cast: true });
  addBox(parent, W + 0.22, 0.08, 0.2, cream, cx, 4.94, STORE.back - 0.07, { cast: true });
  addBox(parent, 0.2, 0.08, D + 0.22, cream, STORE.left - 0.07, 4.94, cz, { cast: true });
  addBox(parent, 0.2, 0.08, D + 0.22, cream, STORE.right + 0.07, 4.94, cz, { cast: true });

  addBox(parent, W + 0.25, 0.12, 0.22, trimDeep, cx, 5.01, STORE.front + 0.08, { cast: true });
  addBox(parent, W + 0.25, 0.12, 0.22, trimDeep, cx, 5.01, STORE.back - 0.08, { cast: true });
  addBox(parent, 0.22, 0.12, D + 0.25, trimDeep, STORE.left - 0.08, 5.01, cz, { cast: true });
  addBox(parent, 0.22, 0.12, D + 0.25, trimDeep, STORE.right + 0.08, 5.01, cz, { cast: true });
  for (let x = -3.7; x < 2.1; x += 0.54) {
    addBox(parent, 0.018, 0.85, 0.03, toon(0x1f5052), x, 4.4, STORE.front + 0.048, { cast: false });
  }

  // Main illuminated sign and matching side sign.
  addBox(parent, 5.74, 1.08, 0.18, toon(0x0b242b), -1.08, 4.41, STORE.front + 0.13, { cast: true });
  addBox(parent, 5.86, 0.045, 0.22, mint, -1.08, 4.955, STORE.front + 0.14, { cast: false });
  addBox(parent, 5.86, 0.035, 0.22, orange, -1.08, 3.87, STORE.front + 0.14, { cast: false });
  const frontSignMap = brandSignTexture('front');
  const signMat = planeMaterial(frontSignMap);
  addPlane(parent, 5.6, 1.12, signMat, -1.08, 4.41, STORE.front + 0.226, { renderOrder: 8 });
  addPlane(parent, 5.6, 1.12, basic(0xffffff, { map: frontSignMap, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false }), -1.08, 4.41, STORE.front + 0.232, { renderOrder: 9 });

  addBox(parent, 0.18, 1.03, 4.44, toon(0x0b242b), STORE.right + 0.13, 4.4, -1.13, { cast: true });
  const sideSignMap = brandSignTexture('side');
  const sideSignMat = planeMaterial(sideSignMap);
  addPlane(parent, 4.3, 1.05, sideSignMat, STORE.right + 0.228, 4.4, -1.13, { ry: Math.PI / 2, renderOrder: 8 });
  addPlane(parent, 4.3, 1.05, basic(0xffffff, { map: sideSignMap, transparent: true, opacity: 0.17, blending: THREE.AdditiveBlending, depthWrite: false }), STORE.right + 0.234, 4.4, -1.13, { ry: Math.PI / 2, renderOrder: 9 });
  addBox(parent, 0.22, 0.04, 4.44, mint, STORE.right + 0.14, 4.955, -1.13, { cast: false });
  addBox(parent, 0.22, 0.035, 4.44, orange, STORE.right + 0.14, 3.87, -1.13, { cast: false });

  const signGlowFront = addGlowSprite(parent, 0xffd8a0, 5.2, -0.7, 4.35, 2.55, 0.1);
  const signGlowSide = addGlowSprite(parent, 0x9cf4dd, 4.0, 3.08, 4.35, -1.1, 0.07);

  // A light, rain-beaded canopy along the corner. The glazed awning lets the
  // warm shop read from above instead of forming a solid white lid.
  const canopyGlass = physical(0x96c6c2, {
    transparent: true,
    opacity: 0.085,
    roughness: 0.16,
    metalness: 0.02,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    envMapIntensity: 0.45,
    side: THREE.DoubleSide,
    depthWrite: false,
    outline: false,
  });
  const frontCanopy = addPlane(parent, W + 0.18, 0.67, canopyGlass, cx, 3.005, STORE.front + 0.39);
  frontCanopy.rotation.x = -Math.PI / 2;
  frontCanopy.renderOrder = 5;
  addBox(parent, W + 0.3, 0.13, 0.11, trimDeep, cx, 2.98, STORE.front + 0.73, { cast: true, receive: true });
  addBox(parent, W + 0.28, 0.035, 0.12, cream, cx, 3.05, STORE.front + 0.72, { cast: false });
  // Slim rafters supporting the glass eave.
  for (let x = -3.72; x < 2.05; x += 0.6) {
    addBox(parent, 0.035, 0.035, 0.62, toon(0x43615d), x, 2.985, STORE.front + 0.38, { cast: false });
  }
  addBox(parent, W + 0.12, 0.035, 0.035, toon(0x43615d), cx, 2.985, STORE.front + 0.08, { cast: false });

  const sideCanopy = addPlane(parent, 4.38, 0.58, canopyGlass, STORE.right + 0.3, 3.005, -0.68, { ry: Math.PI / 2 });
  sideCanopy.renderOrder = 5;
  addBox(parent, 0.11, 0.13, 4.45, trimDeep, STORE.right + 0.59, 2.98, -0.68, { cast: true, receive: true });
  addBox(parent, 0.12, 0.035, 4.47, cream, STORE.right + 0.58, 3.05, -0.68, { cast: false });
  for (let z = -2.65; z < 1.4; z += 0.62) {
    addBox(parent, 0.56, 0.035, 0.035, toon(0x43615d), STORE.right + 0.3, 2.985, z, { cast: false });
  }
  addBox(parent, 0.035, 0.035, 4.36, toon(0x43615d), STORE.right + 0.08, 2.985, -0.68, { cast: false });

  // Under-canopy detail: a few slats and the warm light fittings still hang below.
  for (let x = -3.45; x < 1.9; x += 1.1) {
    addBox(parent, 0.045, 0.014, 0.5, toon(0x9c8f77), x, 2.94, STORE.front + 0.4, { cast: false });
  }
  for (let z = -2.3; z < 1.3; z += 1.1) {
    addBox(parent, 0.46, 0.014, 0.045, toon(0x9c8f77), STORE.right + 0.3, 2.94, z, { cast: false });
  }
  const canopyLights = [];
  for (const x of [-3.35, -1.55, 0.2, 1.55]) {
    addCylinder(parent, 0.07, 0.08, 0.035, toon(0x273d40), x, 2.878, STORE.front + 0.43, { segments: 12, cast: false });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.055, 14), basic(0xffe4b0));
    disc.rotation.x = Math.PI / 2;
    disc.position.set(x, 2.858, STORE.front + 0.43);
    parent.add(disc);
    canopyLights.push(disc);
    addGlowSprite(parent, 0xffdfac, 0.64, x, 2.83, STORE.front + 0.43, 0.11);
  }
  for (const z of [-1.8, 0.1]) {
    addCylinder(parent, 0.065, 0.075, 0.035, toon(0x273d40), STORE.right + 0.24, 2.878, z, { segments: 12, cast: false });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.05, 14), basic(0xffe4b0));
    disc.rotation.x = Math.PI / 2;
    disc.position.set(STORE.right + 0.24, 2.858, z);
    parent.add(disc);
    canopyLights.push(disc);
    addGlowSprite(parent, 0xffdfac, 0.58, STORE.right + 0.24, 2.83, z, 0.1);
  }

  // Cutaway glass roof; the interior stays readable from above.
  const roofGlass = physical(0xaedde3, {
    transparent: true,
    opacity: 0.018,
    roughness: 0.25,
    metalness: 0.0,
    clearcoat: 0.7,
    clearcoatRoughness: 0.08,
    side: THREE.DoubleSide,
    depthWrite: false,
    outline: false,
  });
  const roof = addPlane(parent, W - 0.45, D - 0.45, roofGlass, cx, 4.98, cz - 0.02);
  roof.name = 'store-skylight';
  roof.rotation.x = -Math.PI / 2;
  roof.renderOrder = 4;
  const roofFrame = toon(0x314d4d);
  for (const x of [-1.85, 0.5]) {
    addBox(parent, 0.025, 0.045, D - 0.5, roofFrame, x, 5.02, cz - 0.01, { cast: false });
  }
  for (const z of [-2.45, 0.15]) {
    addBox(parent, W - 0.45, 0.045, 0.025, roofFrame, cx, 5.02, z, { cast: false });
  }
  addBox(parent, W - 0.2, 0.12, 0.07, roofFrame, cx, 5.06, STORE.back + 0.13, { cast: false });
  addBox(parent, W + 0.1, 0.14, 0.12, roofFrame, cx, 5.02, STORE.front + 0.005, { cast: false });
  addBox(parent, 0.12, 0.14, D - 0.1, roofFrame, STORE.left + 0.06, 5.02, cz, { cast: false });
  addBox(parent, 0.12, 0.14, D - 0.1, roofFrame, STORE.right - 0.06, 5.02, cz, { cast: false });

  // Roofside services, visible above the parapet.
  addBox(parent, 0.65, 0.44, 0.5, toon(0xb7b7a6), 1.45, 5.2, -3.55, { cast: true });
  addCylinder(parent, 0.19, 0.19, 0.035, toon(0x4f5b58), 1.27, 5.21, -3.29, { rx: Math.PI / 2, segments: 12, cast: false });
  for (let i = 0; i < 4; i++) {
    addBox(parent, 0.42, 0.018, 0.012, toon(0x68726b), 1.38, 5.08 + i * 0.055, -3.285, { cast: false });
  }
  addCylinder(parent, 0.06, 0.08, 1.05, toon(0x768078), -0.25, 5.35, -3.2, { segments: 8, cast: true });
  addCylinder(parent, 0.13, 0.06, 0.15, toon(0x5d6660), -0.25, 5.86, -3.2, { segments: 9, cast: true });
  addBox(parent, 0.45, 0.3, 0.34, toon(0xa9ab9d), -3.0, 5.18, -3.7, { cast: true });

  // Exterior back and alley-side skins.
  addPlane(parent, W, 4.72, toon(0x6f7975), cx, 2.5, STORE.back - 0.012, { ry: Math.PI });
  addPlane(parent, D, 4.72, toon(0x616c69), STORE.left - 0.012, 2.5, cz, { ry: -Math.PI / 2 });
  addBox(parent, W, 0.22, 0.08, toon(0x3f4f4f), cx, 0.14, STORE.back - 0.06, { cast: true });
  addBox(parent, 0.08, 0.22, D, toon(0x3f4f4f), STORE.left - 0.06, 0.14, cz, { cast: true });
  addBox(parent, 1.25, 0.75, 0.04, toon(0x263b3e), 0.0, 3.25, STORE.back - 0.03, { cast: false });
  for (let i = 0; i < 8; i++) {
    addBox(parent, 1.12, 0.018, 0.02, toon(0x4e6362), 0.0, 3.0 + i * 0.07, STORE.back - 0.058, { cast: false });
  }
  addBox(parent, 2.3, 0.55, 0.08, toon(0x344b4b), 2.55, 3.3, -2.94, { ry: Math.PI / 2, cast: true });

  // ------------------------------------------------------------------
  // Side and rear facades, so every orbit of the diorama stays lived-in.
  // ------------------------------------------------------------------
  const sideMural = canvasTexture(1100, 760, (ctx2, w, h) => {
    const g = ctx2.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#194347');
    g.addColorStop(1, '#102f34');
    ctx2.fillStyle = g;
    ctx2.fillRect(0, 0, w, h);
    ctx2.strokeStyle = '#d5b27b';
    ctx2.lineWidth = 11;
    ctx2.strokeRect(26, 26, w - 52, h - 52);
    // Retro rising sun and rain lines.
    ctx2.fillStyle = '#dd7d57';
    ctx2.beginPath();
    ctx2.arc(w * 0.22, h * 0.34, 105, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = '#f1d8a9';
    ctx2.beginPath();
    ctx2.arc(w * 0.22, h * 0.34, 77, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.strokeStyle = 'rgba(146,213,193,0.28)';
    ctx2.lineWidth = 3;
    for (let i = 0; i < 28; i++) {
      ctx2.beginPath();
      ctx2.moveTo(w * 0.44 + i * 21, 62);
      ctx2.lineTo(w * 0.52 + i * 21, h - 100);
      ctx2.stroke();
    }
    ctx2.fillStyle = '#f0dfbb';
    ctx2.font = `700 72px ${JP_FONT}`;
    ctx2.textAlign = 'left';
    ctx2.fillText('星見町で、', 420, 220);
    ctx2.fillText('ひとやすみ。', 420, 305);
    ctx2.fillStyle = '#90d7c4';
    ctx2.font = `700 27px ${LATIN_FONT}`;
    ctx2.letterSpacing = '5px';
    ctx2.fillText('HOSHIZORA MART  /  SINCE 1998', 426, 360);
    ctx2.letterSpacing = '0px';
    // Wave band.
    ctx2.fillStyle = '#5ba899';
    ctx2.beginPath();
    ctx2.moveTo(0, h * 0.76);
    ctx2.quadraticCurveTo(w * 0.22, h * 0.55, w * 0.48, h * 0.76);
    ctx2.quadraticCurveTo(w * 0.72, h * 0.96, w, h * 0.68);
    ctx2.lineTo(w, h);
    ctx2.lineTo(0, h);
    ctx2.closePath();
    ctx2.fill();
    ctx2.fillStyle = '#e3b073';
    ctx2.beginPath();
    ctx2.moveTo(0, h * 0.84);
    ctx2.quadraticCurveTo(w * 0.26, h * 0.68, w * 0.53, h * 0.87);
    ctx2.quadraticCurveTo(w * 0.8, h * 1.02, w, h * 0.8);
    ctx2.lineTo(w, h);
    ctx2.lineTo(0, h);
    ctx2.closePath();
    ctx2.fill();
    drawStar(ctx2, w - 120, 120, 48, 13, '#e8bb7a', 4);
    ctx2.fillStyle = 'rgba(255,246,221,0.65)';
    ctx2.font = `600 18px ${JP_FONT}`;
    ctx2.fillText('営業時間 24時間  /  駐車場あり', 426, 418);
  });
  addBox(parent, 0.02, 2.28, 3.38, toon(0x102c30), STORE.left - 0.012, 2.66, -1.4, { cast: false });
  addPlane(parent, 3.3, 2.2, planeMaterial(sideMural), STORE.left - 0.026, 2.66, -1.4, { ry: -Math.PI / 2, renderOrder: 2 });
  addBox(parent, 0.03, 0.035, 3.4, toon(0x99815e), STORE.left - 0.035, 3.77, -1.4, { cast: false });
  addCylinder(parent, 0.042, 0.042, 3.2, toon(0x4d5c59), STORE.left - 0.07, 1.72, -3.7, { segments: 7, cast: true });
  addBox(parent, 0.13, 0.5, 0.43, toon(0x6b7773), STORE.left - 0.1, 1.55, 0.55, { cast: true });
  addBox(parent, 0.17, 0.065, 0.6, toon(0x2b3d3e), STORE.left - 0.075, 1.84, 0.55, { cast: true });
  addGlowSprite(parent, 0x8bd9c7, 1.7, STORE.left - 0.15, 2.2, -0.9, 0.028);
  ctx.lights.push({ type: 'point', color: 0xf2bd7f, intensity: 4.0, distance: 3.6, pos: [STORE.left - 0.6, 2.65, -3.8] });

  // A little back-of-house yard: steel delivery shutter, lamp, crates and vents.
  const shutter = canvasTexture(900, 620, (ctx2, w, h) => {
    ctx2.fillStyle = '#3f4d4a';
    ctx2.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) {
      ctx2.fillStyle = y % 64 === 0 ? '#50605a' : '#43534f';
      ctx2.fillRect(0, y, w, 22);
      ctx2.fillStyle = 'rgba(220,232,211,0.12)';
      ctx2.fillRect(0, y + 2, w, 2);
    }
    ctx2.strokeStyle = 'rgba(22,32,30,0.7)';
    ctx2.lineWidth = 5;
    for (let x = 0; x < w; x += 52) {
      ctx2.beginPath();
      ctx2.moveTo(x, 0);
      ctx2.lineTo(x, h);
      ctx2.stroke();
    }
    ctx2.fillStyle = 'rgba(152,99,65,0.2)';
    for (let i = 0; i < 40; i++) {
      ctx2.fillRect(90 + Math.random() * (w - 180), Math.random() * h, 8 + Math.random() * 32, 3 + Math.random() * 70);
    }
    ctx2.fillStyle = 'rgba(244,231,207,0.75)';
    ctx2.textAlign = 'center';
    ctx2.font = `700 38px ${JP_FONT}`;
    ctx2.fillText('納品口  /  DELIVERY', w / 2, 72);
    ctx2.strokeStyle = 'rgba(244,231,207,0.4)';
    ctx2.lineWidth = 3;
    ctx2.strokeRect(250, 34, w - 500, 58);
  });
  addBox(parent, 1.45, 2.22, 0.06, toon(0x263b3b), 0.5, 1.29, STORE.back - 0.043, { cast: true });
  addPlane(parent, 1.3, 2.06, planeMaterial(shutter), 0.5, 1.27, STORE.back - 0.076, { ry: Math.PI, renderOrder: 2 });
  addBox(parent, 1.62, 0.075, 0.2, toon(0x5c6862), 0.5, 2.43, STORE.back - 0.11, { cast: true });
  addBox(parent, 0.08, 2.28, 0.18, toon(0x9d8d70), -0.34, 1.3, STORE.back - 0.08, { cast: true });
  addBox(parent, 0.08, 2.28, 0.18, toon(0x9d8d70), 1.34, 1.3, STORE.back - 0.08, { cast: true });
  const delivSign = canvasTexture(640, 140, (ctx2, w, h) => {
    ctx2.fillStyle = '#193b39';
    ctx2.fillRect(0, 0, w, h);
    ctx2.fillStyle = '#f4e2c1';
    ctx2.font = `700 47px ${JP_FONT}`;
    ctx2.textAlign = 'center';
    ctx2.fillText('納品口 ・ DELIVERY', w / 2, 64);
    ctx2.fillStyle = '#82d8c2';
    ctx2.font = `600 18px ${LATIN_FONT}`;
    ctx2.fillText('STAFF & DELIVERIES ONLY', w / 2, 102);
  });
  addBox(parent, 0.83, 0.2, 0.06, toon(0x142c2d), 1.85, 2.61, STORE.back - 0.06, { cast: true });
  addPlane(parent, 0.78, 0.17, planeMaterial(delivSign), 1.85, 2.61, STORE.back - 0.095, { ry: Math.PI, renderOrder: 3 });
  addBox(parent, 0.26, 0.09, 0.25, toon(0x202c2e), 1.72, 2.2, STORE.back - 0.15, { cast: true });
  addBox(parent, 0.2, 0.028, 0.19, basic(0xffd69b), 1.72, 2.16, STORE.back - 0.15, { rx: Math.PI / 2 });
  addGlowSprite(parent, 0xffce8d, 1.3, 1.72, 2.12, STORE.back - 0.2, 0.1);
  ctx.lights.push({ type: 'point', color: 0xffbd7a, intensity: 4.8, distance: 3.7, pos: [1.55, 2.0, STORE.back - 0.4] });
  addCylinder(parent, 0.06, 0.075, 1.35, toon(0x4d5c59), -1.2, 3.6, STORE.back - 0.09, { segments: 7, cast: true });
  addBox(parent, 0.34, 0.26, 0.13, toon(0x53625e), -1.2, 4.3, STORE.back - 0.1, { cast: true });
  addBox(parent, 0.87, 0.56, 0.04, toon(0x2e4240), 2.1, 3.46, STORE.back - 0.035, { cast: false });
  for (let i = 0; i < 5; i++) {
    addBox(parent, 0.76, 0.018, 0.02, toon(0x4e6460), 2.1, 3.26 + i * 0.07, STORE.back - 0.06, { cast: false });
  }

  // A service door and notice panel on the side-street wall.
  addBox(parent, 0.06, 2.03, 0.94, toon(0x244342), STORE.right + 0.03, 1.18, -3.75, { cast: true });
  addBox(parent, 0.028, 1.83, 0.78, toon(0x345b56), STORE.right + 0.07, 1.17, -3.75, { cast: false });
  addBox(parent, 0.03, 0.03, 0.13, basic(0xb0dfce, { transparent: true, opacity: 0.8 }), STORE.right + 0.09, 1.2, -3.38, { cast: false });
  const sidePoster = canvasTexture(560, 720, (ctx2, w, h) => {
    ctx2.fillStyle = '#e9dfc8';
    ctx2.fillRect(0, 0, w, h);
    ctx2.strokeStyle = '#54736a';
    ctx2.lineWidth = 8;
    ctx2.strokeRect(18, 18, w - 36, h - 36);
    ctx2.fillStyle = '#335a52';
    ctx2.font = `700 54px ${JP_FONT}`;
    ctx2.textAlign = 'center';
    ctx2.fillText('資源ごみ', w / 2, 100);
    ctx2.fillText('分別のお願い', w / 2, 165);
    ctx2.fillStyle = '#d38256';
    ctx2.font = `700 26px ${JP_FONT}`;
    ctx2.fillText('ペットボトル ・ かん ・ びん', w / 2, 225);
    for (let i = 0; i < 4; i++) {
      ctx2.fillStyle = ['#4d8875', '#ce7953', '#7898a2', '#c3aa64'][i];
      ctx2.beginPath();
      ctx2.arc(120 + i * 105, 320, 34, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.fillStyle = '#4a6158';
      ctx2.font = `600 18px ${JP_FONT}`;
      ctx2.fillText(['ペット', 'かん', 'びん', '紙'][i], 120 + i * 105, 382);
    }
    ctx2.fillStyle = '#3f6259';
    ctx2.font = `600 19px ${JP_FONT}`;
    ctx2.fillText('星見町二丁目 クリーンキャンペーン', w / 2, 470);
    ctx2.strokeStyle = '#9a805b';
    ctx2.lineWidth = 2;
    ctx2.beginPath();
    ctx2.moveTo(80, 505);
    ctx2.lineTo(w - 80, 505);
    ctx2.stroke();
    ctx2.fillStyle = 'rgba(68,86,78,0.65)';
    for (let i = 0; i < 5; i++) ctx2.fillRect(100, 535 + i * 18, w - 200 - i * 12, 3);
    drawStar(ctx2, w - 80, h - 72, 24, 6, '#d49a5c', 4);
  });
  addBox(parent, 0.04, 1.12, 0.88, toon(0x233b3a), STORE.right + 0.025, 2.43, -3.7, { cast: true });
  addPlane(parent, 0.8, 1.04, planeMaterial(sidePoster), STORE.right + 0.052, 2.43, -3.7, { ry: Math.PI / 2, renderOrder: 3 });

  // Security camera.
  const cam = new THREE.Group();
  cam.position.set(2.18, 2.82, 1.42);
  parent.add(cam);
  addCylinder(cam, 0.09, 0.11, 0.12, toon(0x313d3e), 0, 0, 0, { rz: Math.PI / 2, segments: 10, cast: true });
  addBox(cam, 0.1, 0.1, 0.2, toon(0x263233), -0.1, 0, 0.05, { cast: true });
  addCylinder(cam, 0.06, 0.06, 0.05, basic(0x0d1c20), -0.11, 0, 0.17, { rx: Math.PI / 2, segments: 10, cast: false });
  addCylinder(cam, 0.013, 0.013, 0.025, basic(0xff6459), -0.07, 0.065, 0.15, { segments: 6, cast: false });
  const camRed = addGlowSprite(cam, 0xff6c5e, 0.15, -0.07, 0.07, 0.16, 0.18);

  const addressTex = canvasTexture(512, 160, (ctx2, w, h) => {
    ctx2.fillStyle = '#e9dfc9';
    ctx2.fillRect(0, 0, w, h);
    ctx2.strokeStyle = '#526c68';
    ctx2.lineWidth = 5;
    ctx2.strokeRect(10, 10, w - 20, h - 20);
    ctx2.fillStyle = '#394f4c';
    ctx2.font = `700 44px ${JP_FONT}`;
    ctx2.textAlign = 'center';
    ctx2.fillText('星見町二丁目 24-7', w / 2, 72);
    ctx2.font = `600 22px ${LATIN_FONT}`;
    ctx2.fillText('HOSHIZORA MART  /  EST. 1998', w / 2, 116);
  });
  addPlane(parent, 0.9, 0.28, planeMaterial(addressTex), 1.0, 0.23, STORE.front + 0.075);

  const signHaloFront = addGlowSprite(parent, 0xffbf86, 6.4, -1.0, 4.4, 2.35, 0.055);
  const signHaloSide = addGlowSprite(parent, 0x8cf1d7, 4.9, 3.0, 4.4, -1.1, 0.045);
  return {
    signMats: [signMat, sideSignMat],
    flicker: {
      matFront: signMat,
      matSide: sideSignMat,
      glows: [signGlowFront, signGlowSide, signHaloFront, signHaloSide],
      canopyLights,
      camRed,
    },
    glass: { frontLeft, frontRight, sideGlass, glassMat },
  };
}

/* ------------------------------------------------------------------ */
/* Sliding entrance                                                   */
/* ------------------------------------------------------------------ */

function entranceDoor(parent, ctx) {
  const frameMat = toon(0x1b3b40);
  const handleMat = toon(0x9aa7a1);
  const glass = physical(0xbfe7e2, {
    transparent: true,
    opacity: 0.16,
    roughness: 0.05,
    metalness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 1.0,
    side: THREE.DoubleSide,
    depthWrite: false,
    outline: false,
  });
  addBox(parent, 1.48, 0.09, 0.16, frameMat, 1.225, 2.93, STORE.front + 0.12, { cast: true });
  addBox(parent, 0.52, 0.05, 0.1, toon(0x1a262b), 1.225, 2.85, STORE.front + 0.14, { cast: false });
  const sensorLed = addBox(parent, 0.025, 0.016, 0.012, basic(0x71f2ba), 1.225, 2.852, STORE.front + 0.198, { cast: false });
  addBox(parent, 1.46, 0.035, 0.16, toon(0x4f5f5d), 1.225, 0.305, STORE.front + 0.14, { cast: false });

  const doorGroupL = new THREE.Group();
  const doorGroupR = new THREE.Group();
  parent.add(doorGroupL, doorGroupR);
  const panelW = 0.64;
  const panelH = 2.55;
  const py = 0.33 + panelH / 2;
  const decalAuto = windowDecalTexture('auto');
  const decalWelcome = windowDecalTexture('welcome');

  function panel(group, side) {
    addBox(group, 0.035, panelH, 0.06, frameMat, -panelW / 2, py, 0, { cast: true });
    addBox(group, 0.035, panelH, 0.06, frameMat, panelW / 2, py, 0, { cast: true });
    addBox(group, 0.035, panelH, 0.06, frameMat, 0, py, 0, { cast: true });
    addBox(group, panelW, 0.055, 0.06, frameMat, 0, 2.88, 0, { cast: true });
    addBox(group, panelW, 0.08, 0.06, frameMat, 0, 0.35, 0, { cast: true });
    const pane = addPlane(group, panelW - 0.07, panelH - 0.1, glass, 0, py, 0.012);
    pane.renderOrder = 6;
    addCylinder(group, 0.014, 0.014, 0.62, handleMat, side * (panelW / 2 - 0.09), 1.45, 0.06, { segments: 6, cast: false });
    addRodBetween(group, [side * (panelW / 2 - 0.12), 1.68, 0.035], [side * (panelW / 2 - 0.02), 1.68, 0.09], 0.012, handleMat, { cast: false });
    addRodBetween(group, [side * (panelW / 2 - 0.12), 1.22, 0.035], [side * (panelW / 2 - 0.02), 1.22, 0.09], 0.012, handleMat, { cast: false });
    const tex = side < 0 ? decalAuto : decalWelcome;
    addPlane(group, side < 0 ? 0.3 : 0.42, side < 0 ? 0.15 : 0.21, planeMaterial(tex, { transparent: true, opacity: 0.74 }), 0, side < 0 ? 1.65 : 1.5, 0.05, {
      renderOrder: 8,
    });
    addGlowSprite(group, 0x8ee7d2, 0.2, side * (panelW / 2 - 0.02), 1.55, 0.08, 0.07);
  }
  panel(doorGroupL, -1);
  panel(doorGroupR, 1);
  doorGroupL.position.set(0.885, 0, STORE.front + 0.055);
  doorGroupR.position.set(1.565, 0, STORE.front + 0.055);
  addBox(parent, 1.42, 0.012, 0.1, basic(0x8ed6c6, { transparent: true, opacity: 0.65 }), 1.225, 0.31, STORE.front + 0.24, {
    cast: false,
  });

  const state = { open: 0 };
  ctx.updaters.push({
    update(t) {
      const cycle = (t + 3.3) % 15.5;
      let target = 0;
      if (cycle > 2.0 && cycle < 3.6) target = easyInOut((cycle - 2.0) / 1.6);
      else if (cycle >= 3.6 && cycle < 7.0) target = 1;
      else if (cycle >= 7.0 && cycle < 8.6) target = 1 - easyInOut((cycle - 7.0) / 1.6);
      state.open = target;
      doorGroupL.position.x = 0.885 - target * 0.57;
      doorGroupR.position.x = 1.565 + target * 0.57;
      sensorLed.material.color.setHex(target > 0.5 ? 0x7df4c0 : 0x61b492);
    },
  });
  return { doorGroupL, doorGroupR, state };
}

/* ------------------------------------------------------------------ */
/* Assembly                                                           */
/* ------------------------------------------------------------------ */

export function buildStore(ctx) {
  const group = new THREE.Group();
  group.name = 'hoshizora-mart';
  ctx.scene.add(group);
  const shellInfo = buildShell(group, ctx);
  buildInteriorLighting(group, ctx);
  const doorInfo = entranceDoor(group, ctx);
  buildInterior(group, ctx, floorY, innerBack);

  // Warm pool of light at the doorway.
  addGroundGlow(group, 0xffb977, 5.0, 2.1, 1.0, 2.35, 0.27, SIDEWALK_Y + 0.03);
  addGroundGlow(group, 0xffdbab, 1.8, 1.2, 1.22, 1.98, 0.3, SIDEWALK_Y + 0.032);
  addGroundGlow(group, 0x8fe3d2, 3.2, 1.0, -2.4, 2.33, 0.1, SIDEWALK_Y + 0.03);
  addGroundGlow(group, 0xffdca3, 2.2, 0.85, 1.25, 1.49, 0.2, floorY + 0.006);

  addGlowSprite(group, 0xffc481, 4.1, -2.2, 1.65, 1.94, 0.032);
  addGlowSprite(group, 0xffd8a5, 3.5, 0.8, 1.75, 1.94, 0.025);
  addGlowSprite(group, 0xffe0b0, 2.0, 1.4, 2.2, 2.02, 0.025);
  const signHalo = addGlowSprite(group, 0xffc88d, 8.0, -0.2, 3.0, 1.85, 0.045);
  const signHalo2 = addGlowSprite(group, 0x92efdd, 5.0, 1.2, 3.0, 1.95, 0.035);
  addPlane(group, 5.5, 0.07, basic(0xffd49e, { transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending }), -0.5, 2.63, STORE.front + 0.06, {
    renderOrder: 9,
  });
  addPlane(group, 4.6, 0.045, basic(0x8fe8d8, { transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending }), 0.0, 2.74, STORE.front + 0.062, {
    renderOrder: 9,
  });

  const flick = shellInfo.flicker;
  ctx.updaters.push({
    update(t) {
      const cycle = (t + 7.4) % 23;
      let k = 0.985 + Math.sin(t * 0.9) * 0.008 + Math.sin(t * 7.7) * 0.004;
      if (cycle > 17.15 && cycle < 17.48) k = 0.72 + 0.26 * Math.abs(Math.sin(t * 83));
      else if (cycle > 17.48 && cycle < 17.75) k = 0.51 + 0.08 * Math.sin(t * 47);
      flick.matFront.color.setRGB(k, k, k);
      flick.matSide.color.setRGB(k, k, k);
      for (let i = 0; i < flick.glows.length; i++) {
        const base = i < 2 ? (i === 0 ? 0.1 : 0.07) : (i === 2 ? 0.055 : 0.045);
        flick.glows[i].material.opacity = base * k;
      }
      flick.camRed.material.opacity = 0.11 + 0.11 * (Math.sin(t * 2.7) > 0.72 ? 1 : 0.12);
      for (let i = 0; i < flick.canopyLights.length; i++) {
        const b = 0.93 + 0.07 * Math.sin(t * 1.2 + i * 1.6);
        flick.canopyLights[i].material.color.setRGB(b, b * 0.9, b * 0.72);
      }
    },
  });
  ctx.updaters.push({
    update(t) {
      signHalo.material.opacity = 0.043 + Math.sin(t * 0.6) * 0.009;
      signHalo2.material.opacity = 0.033 + Math.cos(t * 0.5) * 0.007;
    },
  });

  return { group, door: doorInfo, shellInfo };
}
