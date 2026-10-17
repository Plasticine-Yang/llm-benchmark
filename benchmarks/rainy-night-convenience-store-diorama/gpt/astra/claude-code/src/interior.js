import * as THREE from 'three';
import {
  C, group, box, cylinder, sphere, torus, rod, tube, polygon,
  label, material, light, rng, batchStatic,
} from './kit.js';

/** A warm, open-topped konbini. Local coordinates match the building footprint. */
export function buildInterior(parent) {
  // Batch before attaching: kit.batchStatic bakes world matrices, so an identity
  // root also makes this builder safe to use under a transformed parent.
  const root = new THREE.Group();
  root.name = 'Konbini — stocked interior';
  const random = rng(70419);
  const wood = '#bd956b';
  const woodLight = '#d9b789';
  const grout = '#c9c7b7';
  const tiles = ['#eee7d5', '#f1ead9', '#eae4d2'];
  const colors = [C.teal, C.coral, C.yellow, C.ink, C.blue];
  const litCream = material(C.paper, { emissive: '#ffe5b2', intensity: 0.72 });
  const coldGlow = material('#e4efdf', { emissive: '#e4f5d7', intensity: 0.42 });
  const metal = material('#a8b5b0', { standard: true, roughness: 0.42, metalness: 0.45 });
  const steamMaterial = material(C.paper, { opacity: 0.19, emissive: '#fff2d7', intensity: 0.35 });
  const labelTemplates = new Map();
  const products = new Map();
  const steamWisps = [];

  // Identical paper labels share a texture and are instanced after construction.
  // Even the smallest lettering lives on a shelf rail, wrapper, or actual sign.
  function tag(p, text, pos, size, opts = {}) {
    const { rotation = [0, 0, 0], ...style } = opts;
    const key = JSON.stringify([text, size, style]);
    if (!labelTemplates.has(key)) {
      const holder = new THREE.Group();
      const source = label(holder, text, [0, 0, 0], size, style);
      source.removeFromParent();
      source.userData.interiorLabel = true;
      labelTemplates.set(key, source);
    }
    const copy = labelTemplates.get(key).clone();
    copy.position.set(...pos);
    copy.rotation.set(...rotation);
    p.add(copy);
    return copy;
  }

  function stock(p, kind, variant, pos, yaw = 0, scale = 1) {
    const key = `${kind}:${variant}`;
    if (!products.has(key)) products.set(key, makeProduct(kind, variant));
    const item = products.get(key).clone(true);
    item.position.set(...pos);
    item.rotation.y = yaw;
    item.scale.setScalar(scale);
    p.add(item);
    return item;
  }

  // Product origins are on the shelf surface rather than at their centers.
  function makeProduct(kind, variant) {
    const p = new THREE.Group();
    p.name = `Stock / ${kind}`;
    const color = colors[variant % colors.length];
    const whiteInk = variant === 2 ? C.ink : C.paper;
    if (kind === 'bottle') {
      const fluid = [C.teal, C.coral, C.yellow, C.blue, C.white][variant % 5];
      cylinder(p, [0, 0.105, 0], 0.053, 0.057, 0.20, fluid);
      cylinder(p, [0, 0.225, 0], 0.023, 0.053, 0.055, fluid);
      cylinder(p, [0, 0.26, 0], 0.022, 0.022, 0.026, C.white);
      cylinder(p, [0, 0.28, 0], 0.027, 0.027, 0.022, variant === 2 ? C.coral : C.paper);
      cylinder(p, [0, 0.115, 0], 0.058, 0.058, 0.094, C.paper);
      cylinder(p, [0, 0.017, 0], 0.056, 0.056, 0.012, C.white);
      tag(p, ['緑茶', '桃水', '麦茶', '天然水', 'ラムネ'][variant % 5], [0, 0.117, 0.059], [0.086, 0.079], { bg: C.paper, color });
      box(p, [-0.026, 0.187, 0.046], [0.008, 0.038, 0.003], C.paper, { shadow: false });
    } else if (kind === 'can') {
      cylinder(p, [0, 0.112, 0], 0.057, 0.057, 0.21, color);
      cylinder(p, [0, 0.012, 0], 0.056, 0.056, 0.014, metal);
      cylinder(p, [0, 0.216, 0], 0.056, 0.056, 0.014, metal);
      cylinder(p, [0, 0.224, 0], 0.044, 0.044, 0.003, C.white, { shadow: false });
      const tab = torus(p, [0, 0.227, 0], 0.012, 0.003, C.ink, { rotation: [-Math.PI / 2, 0, 0], shadow: false });
      tab.scale.x = 0.65;
      tag(p, ['抹茶', 'いちご', 'レモン', '珈琲', 'ソーダ'][variant % 5], [0, 0.12, 0.058], [0.083, 0.102], { bg: color, color: whiteInk });
    } else if (kind === 'carton') {
      box(p, [0, 0.102, 0], [0.108, 0.204, 0.098], C.paper);
      polygon(p, [[-0.054, 0.20], [-0.054, 0.227], [0, 0.267], [0.054, 0.227], [0.054, 0.20]], 0.098, C.paper, [0, 0, -0.049]);
      box(p, [0, 0.266, 0], [0.006, 0.012, 0.098], color);
      box(p, [0, 0.04, 0.051], [0.108, 0.05, 0.003], color);
      tag(p, variant % 2 ? '豆乳' : '牛乳', [0, 0.142, 0.051], [0.091, 0.097], { bg: C.paper, color });
      box(p, [0, 0.216, 0.051], [0.085, 0.011, 0.003], color);
    } else if (kind === 'packet') {
      polygon(p, [[-0.069, 0], [0.067, 0], [0.059, 0.027], [0.074, 0.137], [0.062, 0.198], [-0.066, 0.198], [-0.072, 0.137], [-0.058, 0.026]], 0.058, color, [0, 0, -0.029]);
      box(p, [0, 0.192, 0.002], [0.132, 0.012, 0.068], C.paper);
      box(p, [0, 0.01, 0.002], [0.132, 0.009, 0.068], C.paper);
      tag(p, ['のり塩', 'ポテト', 'せんべい', 'チョコ', 'あめ'][variant % 5], [0, 0.124, 0.031], [0.118, 0.068], { bg: color, color: whiteInk });
      const crisp = sphere(p, [0, 0.057, 0.034], 0.028, C.yellow, { shadow: false });
      crisp.scale.set(1.05, 0.72, 0.16);
      box(p, [-0.045, 0.155, 0.032], [0.012, 0.021, 0.003], C.paper, { rotation: [0, 0, -0.35], shadow: false });
    } else if (kind === 'box') {
      box(p, [0, 0.111, 0], [0.137, 0.222, 0.072], color);
      box(p, [0, 0.214, 0], [0.137, 0.012, 0.076], C.paper);
      tag(p, ['抹茶\nクッキー', 'ビスケット', 'カレー', '珈琲\nチョコ', 'ミント'][variant % 5], [0, 0.132, 0.038], [0.119, 0.117], { bg: color, color: whiteInk });
      box(p, [0, 0.028, 0.038], [0.105, 0.025, 0.003], C.paper, { shadow: false });
      for (let i = 0; i < 5; i++) box(p, [-0.035 + i * 0.017, 0.028, 0.041], [0.006, 0.018, 0.002], C.ink, { shadow: false });
    } else if (kind === 'noodles') {
      cylinder(p, [0, 0.06, 0], 0.068, 0.049, 0.12, C.paper);
      cylinder(p, [0, 0.069, 0], 0.066, 0.058, 0.06, color);
      cylinder(p, [0, 0.126, 0], 0.071, 0.071, 0.012, C.paper);
      cylinder(p, [0, 0.134, 0], 0.063, 0.063, 0.004, color);
      tag(p, variant % 2 ? 'うどん' : '拉麺', [0, 0.072, 0.067], [0.087, 0.051], { bg: color, color: whiteInk });
      box(p, [0.04, 0.135, 0.047], [0.027, 0.005, 0.035], C.paper);
    } else if (kind === 'onigiri') {
      polygon(p, [[-0.081, 0], [0.081, 0], [0.071, 0.03], [0.017, 0.147], [0, 0.159], [-0.02, 0.145], [-0.072, 0.025]], 0.065, C.paper, [0, 0, -0.0325]);
      box(p, [0, 0.042, 0.034], [0.064, 0.083, 0.004], C.darkTeal);
      box(p, [0, 0.025, -0.034], [0.064, 0.05, 0.004], C.darkTeal);
      box(p, [0, 0.003, 0], [0.064, 0.006, 0.071], C.darkTeal);
      tag(p, ['鮭', '梅', '昆布'][variant % 3], [0, 0.113, 0.034], [0.052, 0.038], { bg: C.paper, color: variant === 1 ? C.coral : C.darkTeal });
      for (const [x, y] of [[-0.05, 0.035], [0.048, 0.038], [-0.034, 0.092]]) {
        const grain = sphere(p, [x, y, 0.033], 0.007, C.cream, { shadow: false });
        grain.scale.set(0.55, 1, 0.3);
      }
    } else if (kind === 'bento') {
      box(p, [0, 0.02, 0], [0.255, 0.039, 0.181], C.ink, { bevel: 0.013 });
      box(p, [-0.06, 0.043, 0], [0.115, 0.023, 0.146], C.paper, { bevel: 0.008 });
      box(p, [0.056, 0.043, 0], [0.096, 0.016, 0.147], woodLight);
      box(p, [0.004, 0.047, 0], [0.009, 0.036, 0.157], C.ink);
      box(p, [0.065, 0.061, -0.035], [0.077, 0.023, 0.049], C.coral, { bevel: 0.009, rotation: [0, -0.15, 0] });
      for (let i = 0; i < 3; i++) box(p, [0.041 + i * 0.021, 0.076, -0.035], [0.006, 0.003, 0.037], C.paper, { rotation: [0, -0.15, 0], shadow: false });
      box(p, [0.067, 0.059, 0.03], [0.056, 0.027, 0.044], C.yellow, { bevel: 0.006 });
      for (let i = 0; i < 3; i++) sphere(p, [0.028 + i * 0.018, 0.056, 0.06], 0.012, C.teal, { shadow: false });
      sphere(p, [-0.065, 0.062, -0.003], 0.016, C.coral, { shadow: false });
      for (let i = 0; i < 7; i++) {
        const grain = sphere(p, [-0.092 + (i % 3) * 0.027, 0.057, -0.048 + Math.floor(i / 3) * 0.041], 0.007, C.white, { shadow: false });
        grain.scale.set(0.6, 0.32, 1);
      }
      for (const z of [-0.088, 0.088]) box(p, [0, 0.05, z], [0.247, 0.009, 0.006], C.white, { shadow: false });
      for (const x of [-0.123, 0.123]) box(p, [x, 0.05, 0], [0.006, 0.009, 0.174], C.white, { shadow: false });
      tag(p, 'お弁当 ¥398', [0, 0.08, 0.062], [0.166, 0.038], { bg: C.paper, color: C.ink, rotation: [-Math.PI / 2, 0, 0] });
    } else if (kind === 'bread') {
      box(p, [0, 0.018, 0], [0.149, 0.032, 0.116], C.paper, { bevel: 0.01 });
      const bun = sphere(p, [0, 0.051, 0], 0.065, woodLight);
      bun.scale.set(1, 0.59, 0.74);
      for (let i = -1; i <= 1; i++) box(p, [i * 0.026, 0.084 - Math.abs(i) * 0.005, 0], [0.006, 0.003, 0.063], C.paper, { rotation: [0, 0.2, 0], shadow: false });
      tag(p, '焼きたて', [0, 0.037, 0.062], [0.104, 0.028], { bg: C.paper, color: C.coral });
    } else if (kind === 'ice') {
      box(p, [0, 0.02, 0], [0.136, 0.039, 0.087], color, { bevel: 0.01 });
      for (const x of [-0.061, 0.061]) box(p, [x, 0.021, 0], [0.012, 0.043, 0.088], C.paper);
      tag(p, 'アイス', [0, 0.041, 0], [0.078, 0.047], { bg: color, color: whiteInk, rotation: [-Math.PI / 2, 0, 0] });
    }
    return p;
  }

  // Cream ceramic floor: real narrow grout channels, not a checkerboard texture.
  const floor = group(root);
  floor.name = 'Cream tile floor / entrance and queue markings';
  box(floor, [-0.3, 0.447, -1.975], [6.8, 0.054, 5.05], grout);
  for (let ix = 0; ix < 12; ix++) {
    for (let iz = 0; iz < 9; iz++) {
      box(floor, [-3.7 + (ix + 0.5) * 6.8 / 12, 0.473, -4.5 + (iz + 0.5) * 5.05 / 9], [6.8 / 12 - 0.009, 0.014, 5.05 / 9 - 0.009], tiles[(ix * 7 + iz * 3) % 3], { shadow: false });
    }
  }
  const mat = group(floor, [-0.55, 0.486, 0.245]);
  box(mat, [0, 0, 0], [1.17, 0.012, 0.49], C.darkTeal, { bevel: 0.012, shadow: false });
  for (const z of [-0.205, 0.205]) box(mat, [0, 0.007, z], [1.08, 0.002, 0.008], C.cream, { shadow: false });
  tag(mat, 'いらっしゃいませ', [0, 0.008, 0], [0.97, 0.145], { bg: C.darkTeal, color: C.paper, rotation: [-Math.PI / 2, 0, 0] });
  for (const z of [-2.88, -1.47]) {
    for (const x of [-1.42, -0.07]) box(floor, [x, 0.482, z], [0.022, 0.003, 0.20], C.yellow, { shadow: false });
  }
  const arrow = group(floor, [0.53, 0.484, -0.28], [-Math.PI / 2, 0, -Math.PI / 2]);
  polygon(arrow, [[-0.045, -0.12], [0.045, -0.12], [0.045, 0.01], [0.11, 0.01], [0, 0.12], [-0.11, 0.01], [-0.045, 0.01]], 0.002, C.yellow);
  box(floor, [0.65, 0.483, -0.50], [0.45, 0.003, 0.034], C.teal, { shadow: false });

  // Only the requested rear interior wall. The building supplies the exterior.
  const back = group(root);
  back.name = 'Rear wall / oak wainscot / service door';
  box(back, [-0.3, 1.965, -4.46], [6.8, 2.97, 0.08], C.paper);
  box(back, [-0.3, 0.9, -4.407], [6.8, 0.84, 0.024], wood);
  box(back, [-0.3, 1.327, -4.389], [6.8, 0.035, 0.053], woodLight);
  box(back, [-0.3, 0.52, -4.384], [6.8, 0.075, 0.06], C.darkTeal);
  for (let i = 0; i < 31; i++) box(back, [-3.6 + i * 0.22, 0.92, -4.388], [0.013, 0.78, 0.012], woodLight, { shadow: false });
  box(back, [-3.19, 1.53, -4.354], [0.87, 2.10, 0.082], woodLight, { outline: true });
  box(back, [-3.19, 1.54, -4.306], [0.748, 1.99, 0.027], C.darkTeal, { outline: true });
  box(back, [-3.19, 0.712, -4.286], [0.665, 0.24, 0.014], metal);
  tag(back, '関係者以外\n立入禁止', [-3.19, 1.96, -4.287], [0.48, 0.22], { bg: C.cream, color: C.darkTeal });
  tag(back, 'STAFF ONLY', [-3.19, 1.70, -4.285], [0.38, 0.073], { bg: C.darkTeal, color: C.cream });
  rod(back, [-2.91, 1.41, -4.253], [-2.91, 1.24, -4.253], 0.015, metal);
  for (const y of [0.93, 2.21]) box(back, [-3.552, y, -4.28], [0.022, 0.076, 0.025], metal);
  box(back, [-3.19, 2.69, -4.334], [0.52, 0.155, 0.093], C.teal, { outline: true });
  tag(back, '非常口  →', [-3.19, 2.69, -4.285], [0.48, 0.118], { bg: C.teal, color: C.paper, emissive: 0.25 });
  // Quiet analog clock, set to 10:10; cylinder faces toward the storefront.
  const clock = group(back, [-3.18, 3.103, -4.318]);
  cylinder(clock, [0, 0, 0], 0.239, 0.239, 0.056, C.darkTeal, { rotation: [Math.PI / 2, 0, 0], outline: true, segments: 36 });
  cylinder(clock, [0, 0, 0.032], 0.21, 0.21, 0.01, C.paper, { rotation: [Math.PI / 2, 0, 0], segments: 36 });
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    box(clock, [Math.sin(a) * 0.176, Math.cos(a) * 0.176, 0.04], [i % 3 ? 0.008 : 0.015, i % 3 ? 0.023 : 0.034, 0.004], C.ink, { rotation: [0, 0, -a], shadow: false });
  }
  rod(clock, [0, 0, 0.049], [-0.092, 0.052, 0.049], 0.010, C.ink, { shadow: false });
  rod(clock, [0, 0, 0.051], [0.131, 0.075, 0.051], 0.007, C.ink, { shadow: false });
  sphere(clock, [0, 0, 0.057], 0.018, C.coral, { shadow: false });
  box(back, [0.22, 3.145, -4.364], [3.08, 0.235, 0.048], woodLight, { outline: true });
  tag(back, 'まちの台所  ·  24 HOURS', [0.22, 3.145, -4.337], [2.93, 0.18], { bg: C.paper, color: C.darkTeal });
  for (let i = 0; i < 7; i++) box(back, [2.53 + i * 0.041, 3.16, -4.389], [0.012, 0.134, 0.016], C.metal, { shadow: false });

  // Four softly illuminated open-glass refrigerator bays. No opaque glass pane
  // sits between the camera and the drinks: frames and a couple of glints suffice.
  const fridges = group(root);
  fridges.name = 'Four illuminated drinks cabinets';
  const centers = [-1.815, -0.465, 0.885, 2.235];
  box(fridges, [0.21, 0.568, -4.02], [5.49, 0.176, 0.76], C.darkTeal, { outline: true, bevel: 0.018 });
  box(fridges, [0.21, 1.758, -4.355], [5.46, 2.18, 0.07], coldGlow);
  box(fridges, [0.21, 2.88, -4.01], [5.51, 0.095, 0.79], C.cream, { outline: true });
  box(fridges, [0.21, 2.826, -3.628], [5.48, 0.025, 0.042], C.coral);
  for (let bay = 0; bay < 4; bay++) {
    const x = centers[bay];
    const f = group(fridges, [x, 0, 0]);
    box(f, [0, 1.724, -4.301], [1.26, 2.02, 0.036], coldGlow);
    for (const sx of [-0.657, 0.657]) {
      box(f, [sx, 1.727, -4.008], [0.043, 2.10, 0.69], C.cream);
      box(f, [sx, 1.735, -3.644], [0.048, 2.16, 0.048], C.darkTeal, { outline: true });
      box(f, [sx * 0.924, 1.70, -3.673], [0.016, 1.91, 0.017], litCream, { shadow: false });
    }
    box(f, [0, 2.69, -3.662], [1.263, 0.225, 0.075], litCream, { outline: true });
    tag(f, ['お茶・天然水', '炭酸・ジュース', '珈琲・ミルク', '冷たいドリンク'][bay], [0, 2.694, -3.621], [1.16, 0.15], { bg: C.paper, color: C.darkTeal, emissive: 0.28 });
    for (let shelf = 0; shelf < 4; shelf++) {
      const y = 0.726 + shelf * 0.461;
      box(f, [0, y, -3.996], [1.257, 0.037, 0.634], C.cream);
      box(f, [0, y + 0.023, -3.688], [1.26, 0.048, 0.032], C.white);
      for (let price = 0; price < 3; price++) tag(f, ['¥128', '¥158', '¥138'][bay % 3], [-0.401 + price * 0.401, y + 0.022, -3.669], [0.211, 0.049], { bg: C.paper, color: C.ink });
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 7; col++) {
          let kind = 'bottle';
          let variant = bay === 0 ? (col < 4 ? 0 : 2) : bay === 1 ? (col < 4 ? 1 : 4) : bay === 2 ? 3 : 4;
          if (shelf === 1 || shelf === 3) kind = 'can';
          if (bay === 2 && shelf < 2) { kind = 'carton'; variant = col < 4 ? 4 : 0; }
          if (bay === 3 && shelf === 2) { kind = 'can'; variant = 2; }
          stock(f, kind, variant, [-0.494 + col * 0.164 + (row ? 0.007 : 0), y + 0.021, -3.84 - row * 0.262]);
        }
      }
    }
    rod(f, [0.552, 1.39, -3.602], [0.552, 1.81, -3.602], 0.017, metal);
    for (const y of [1.39, 1.81]) rod(f, [0.552, y, -3.64], [0.552, y, -3.601], 0.012, metal);
    // Localized reflections, not a translucent sheet over the whole cabinet.
    rod(f, [-0.51, 2.42, -3.617], [-0.39, 2.54, -3.617], 0.008, C.paper, { opacity: 0.28, shadow: false });
    rod(f, [-0.46, 2.41, -3.616], [-0.35, 2.52, -3.616], 0.004, C.paper, { opacity: 0.18, shadow: false });
    for (let i = 0; i < 10; i++) box(f, [-0.51 + i * 0.113, 0.573, -3.631], [0.062, 0.034, 0.009], C.ink, { shadow: false });
  }

  function gondola(x, prepared) {
    const g = group(root, [x, 0, -2.10]);
    g.name = prepared ? '01 / bentos, onigiri and bakery gondola' : '02 / grocery gondola';
    const accent = prepared ? C.coral : C.teal;
    box(g, [0, 0.574, 0.035], [0.98, 0.15, 2.47], woodLight, { outline: true, bevel: 0.018 });
    box(g, [0, 0.512, 0.035], [0.87, 0.065, 2.30], C.darkTeal);
    box(g, [0, 1.057, -0.05], [0.055, 0.91, 1.83], C.cream);
    for (const z of [-0.923, 0.85]) {
      box(g, [0, 1.052, z], [0.078, 0.975, 0.05], C.darkTeal, { outline: true });
      for (let i = 0; i < 7; i++) box(g, [0.041, 0.70 + i * 0.116, z], [0.005, 0.015, 0.022], metal, { shadow: false });
    }
    for (let level = 0; level < 3; level++) {
      const y = 0.71 + level * 0.305;
      box(g, [0, y, -0.03], [0.96, 0.039, 1.86], C.cream, { outline: true });
      for (const side of [-1, 1]) {
        box(g, [side * 0.477, y + 0.004, -0.03], [0.025, 0.065, 1.87], accent);
        tag(g, prepared ? '毎日できたて  ¥138' : 'おいしい発見  ¥158', [side * 0.493, y + 0.006, -0.03], [1.54, 0.052], { bg: C.paper, color: C.ink, rotation: [0, side * Math.PI / 2, 0] });
        for (let col = 0; col < 8; col++) {
          const z = -0.785 + col * 0.215;
          for (let row = 0; row < 2; row++) {
            let kind = level === 0 ? 'noodles' : level === 1 ? 'box' : 'packet';
            if (prepared) kind = level === 0 ? 'bread' : level === 1 ? 'packet' : (col % 2 ? 'bread' : 'onigiri');
            stock(g, kind, (Math.floor(col / 2) + level) % 5, [side * (0.172 + row * 0.185), y + 0.021, z], side * Math.PI / 2);
          }
        }
      }
      // The endcap points directly at the front windows.
      box(g, [0, y, 1.095], [0.96, 0.036, 0.35], C.cream, { outline: true });
      box(g, [0, y + 0.003, 1.276], [0.98, 0.070, 0.025], accent);
      tag(g, prepared ? (level === 2 ? 'おにぎり  ¥138' : 'お弁当  ¥398') : '今週のおすすめ  ¥158', [0, y + 0.003, 1.291], [0.86, 0.058], { bg: C.paper, color: C.ink });
      if (prepared && level < 2) {
        for (let col = 0; col < 3; col++) stock(g, 'bento', col, [(col - 1) * 0.30, y + 0.02, 1.12]);
        box(g, [0, y + 0.275, 1.06], [0.84, 0.013, 0.021], litCream, { shadow: false });
      } else {
        for (let col = 0; col < 5; col++) stock(g, prepared ? 'onigiri' : level === 0 ? 'noodles' : 'packet', col % 3, [(col - 2) * 0.177, y + 0.022, 1.14], (col - 2) * -0.035);
      }
    }
    box(g, [0, 1.56, 0.91], [0.95, 0.077, 0.029], accent);
    tag(g, prepared ? 'お弁当・おにぎり' : 'お菓子・カップ麺', [0, 1.56, 0.927], [0.89, 0.064], { bg: accent, color: C.paper });
    return g;
  }
  gondola(-2.2, true);
  gondola(0.7, false);

  // Low chest freezer: a divided, stocked basket is visible through almost-clear lids.
  const freezer = group(root, [-2.49, 0, -0.19]);
  freezer.name = 'Ice-cream chest freezer';
  box(freezer, [0, 0.534, 0], [1.08, 0.104, 0.73], C.darkTeal, { bevel: 0.016 });
  box(freezer, [0, 0.792, 0], [1.17, 0.47, 0.79], C.cream, { bevel: 0.026, outline: true });
  box(freezer, [0, 1.025, 0], [1.08, 0.032, 0.70], C.darkTeal);
  box(freezer, [0, 1.045, 0], [0.99, 0.025, 0.61], C.white);
  for (const x of [-0.568, 0.568]) box(freezer, [x, 1.08, 0], [0.055, 0.105, 0.79], C.paper, { outline: true });
  for (const z of [-0.372, 0.372]) box(freezer, [0, 1.08, z], [1.09, 0.105, 0.055], C.paper, { outline: true });
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 6; col++) stock(freezer, 'ice', (col + row) % 5, [-0.429 + col * 0.172, 1.06, -0.233 + row * 0.23], (random() - 0.5) * 0.15);
  }
  for (const x of [-0.17, 0.17]) box(freezer, [x, 1.074, 0], [0.009, 0.075, 0.635], C.cream);
  for (const x of [-0.277, 0.277]) {
    box(freezer, [x, 1.133, 0], [0.529, 0.006, 0.668], C.white, { opacity: 0.035, shadow: false });
    box(freezer, [x, 1.153, 0.236], [0.15, 0.021, 0.025], metal);
  }
  box(freezer, [0, 1.139, 0], [0.023, 0.02, 0.719], metal);
  box(freezer, [0, 0.999, 0.402], [1.09, 0.031, 0.01], C.coral);
  tag(freezer, 'アイスクリーム', [0, 0.823, 0.399], [0.93, 0.16], { bg: C.cream, color: C.darkTeal });
  tag(freezer, '¥150', [0.405, 1.082, 0.403], [0.18, 0.067], { bg: C.coral, color: C.paper });
  for (let i = 0; i < 6; i++) box(freezer, [0.36 + i * 0.025, 0.65, 0.399], [0.01, 0.064, 0.006], C.metal, { shadow: false });

  // A narrow, stepped magazine stand leaves the doorway's entire width free.
  const magazines = group(root, [-3.415, 0, 0.02]);
  magazines.name = 'Front-left illustrated magazine rack';
  box(magazines, [0, 0.514, 0], [0.49, 0.067, 0.48], C.darkTeal, { outline: true });
  box(magazines, [0, 1.01, -0.139], [0.46, 0.95, 0.043], woodLight, { rotation: [-0.11, 0, 0], outline: true });
  for (let tier = 0; tier < 3; tier++) {
    const y = 0.648 + tier * 0.276;
    const z = 0.134 - tier * 0.053;
    box(magazines, [0, y, z - 0.06], [0.48, 0.035, 0.19], C.cream);
    rod(magazines, [-0.235, y + 0.074, z + 0.032], [0.235, y + 0.074, z + 0.032], 0.009, C.darkTeal);
    for (let col = 0; col < 2; col++) {
      const book = group(magazines, [-0.114 + col * 0.228, y + 0.15, z], [-0.11, 0, 0]);
      const cover = [C.teal, C.coral, C.yellow][(tier + col) % 3];
      box(book, [0, 0, 0], [0.207, 0.279, 0.025], C.paper, { outline: true });
      box(book, [0, 0, 0.015], [0.199, 0.271, 0.005], cover);
      tag(book, ['旅日和', '暮らし', '東京散歩'][(tier + col) % 3], [0, 0.083, 0.019], [0.184, 0.063], { bg: cover, color: cover === C.yellow ? C.ink : C.paper });
      // Tiny procedural cover illustration: hills, a sun, and a town silhouette.
      const sun = cylinder(book, [0.046, 0.007, 0.021], 0.029, 0.029, 0.002, C.paper, { rotation: [Math.PI / 2, 0, 0], shadow: false });
      sun.renderOrder = 1;
      polygon(book, [[-0.095, -0.08], [-0.035, 0.031], [0.041, -0.08]], 0.002, C.darkTeal, [0, 0, 0.023], { shadow: false });
      polygon(book, [[-0.041, -0.08], [0.055, 0.003], [0.098, -0.08]], 0.002, woodLight, [0, 0, 0.026], { shadow: false });
      for (let i = 0; i < 3; i++) box(book, [-0.052 + i * 0.044, -0.056, 0.032], [0.027, 0.04 + i * 0.009, 0.003], C.paper, { shadow: false });
      box(book, [0, -0.105, 0.02], [0.166, 0.013, 0.003], C.paper, { shadow: false });
    }
  }
  box(magazines, [0, 1.575, -0.12], [0.49, 0.13, 0.035], C.darkTeal, { outline: true });
  tag(magazines, '雑誌・BOOKS', [0, 1.575, -0.1], [0.452, 0.087], { bg: C.darkTeal, color: C.paper });

  // Low wood-and-teal checkout, with small appliances kept toward the right.
  const checkout = group(root, [2.10, 0, -0.26]);
  checkout.name = 'Checkout / register / coffee / steaming oden';
  box(checkout, [0, 0.532, 0], [1.70, 0.102, 0.88], C.darkTeal);
  box(checkout, [0, 0.805, 0], [1.75, 0.47, 0.89], C.cream, { outline: true, bevel: 0.016 });
  box(checkout, [0, 0.80, 0.454], [1.70, 0.425, 0.025], C.teal);
  for (let i = 0; i < 19; i++) box(checkout, [-0.806 + i * 0.0895, 0.794, 0.475], [0.035, 0.394, 0.015], woodLight);
  box(checkout, [0, 1.083, 0], [1.84, 0.068, 0.98], woodLight, { bevel: 0.018, outline: true });
  box(checkout, [0, 1.121, 0], [1.79, 0.011, 0.926], C.paper);
  box(checkout, [0, 0.572, 0.471], [1.64, 0.015, 0.014], litCream, { shadow: false });
  box(checkout, [-0.45, 0.84, 0.49], [0.64, 0.224, 0.032], C.darkTeal, { bevel: 0.011 });
  tag(checkout, 'お会計', [-0.45, 0.84, 0.51], [0.57, 0.16], { bg: C.darkTeal, color: C.paper });
  tag(checkout, '24H', [0.70, 0.979, 0.489], [0.175, 0.073], { bg: woodLight, color: C.darkTeal });
  // Cash drawer, monitor, keypad, customer card reader, scanner and coin tray.
  const register = group(checkout, [-0.56, 1.128, -0.045]);
  box(register, [0, 0.045, 0], [0.40, 0.09, 0.30], C.darkTeal, { bevel: 0.016, outline: true });
  box(register, [0, 0.045, 0.153], [0.29, 0.008, 0.006], C.ink);
  box(register, [0, 0.147, -0.044], [0.05, 0.16, 0.055], metal);
  const screen = group(register, [0, 0.275, -0.076], [-0.15, 0, 0]);
  box(screen, [0, 0, 0], [0.378, 0.241, 0.037], C.ink, { bevel: 0.014, outline: true });
  tag(screen, '¥ 560\nありがとうございます', [0, 0, 0.022], [0.328, 0.191], { bg: '#bad7bd', color: C.darkTeal, emissive: 0.2 });
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) box(register, [-0.096 + col * 0.042, 0.097, 0.04 + row * 0.03], [0.03, 0.01, 0.021], col === 4 ? C.coral : C.cream, { shadow: false });
  }
  box(checkout, [-0.206, 1.172, 0.26], [0.13, 0.082, 0.177], C.darkTeal, { bevel: 0.012, rotation: [-0.17, 0, 0] });
  tag(checkout, 'IC', [-0.206, 1.217, 0.246], [0.081, 0.073], { bg: C.teal, color: C.paper, rotation: [-Math.PI / 2 - 0.17, 0, 0] });
  box(checkout, [-0.737, 1.173, 0.266], [0.07, 0.085, 0.12], C.ink, { bevel: 0.012 });
  box(checkout, [-0.737, 1.221, 0.278], [0.049, 0.009, 0.065], C.coral);
  box(checkout, [-0.427, 1.144, 0.331], [0.205, 0.034, 0.128], C.coral, { bevel: 0.012 });
  box(checkout, [-0.427, 1.163, 0.331], [0.17, 0.006, 0.097], C.darkTeal, { bevel: 0.007 });
  for (let i = 0; i < 2; i++) cylinder(checkout, [-0.465 + i * 0.057, 1.169, 0.33], 0.019, 0.019, 0.003, metal, { shadow: false });
  box(checkout, [-0.551, 1.235, 0.105], [0.071, 0.137, 0.004], C.paper, { rotation: [-0.29, 0, 0] });
  for (let i = 0; i < 4; i++) box(checkout, [-0.551, 1.21 + i * 0.024, 0.108 - i * 0.007], [0.048, 0.004, 0.003], C.ink, { shadow: false });

  const coffee = group(checkout, [0.60, 1.129, -0.20]);
  coffee.name = 'Bean-to-cup coffee machine';
  box(coffee, [0, 0.279, 0], [0.385, 0.558, 0.30], C.ink, { bevel: 0.02, outline: true });
  box(coffee, [0, 0.413, 0.158], [0.329, 0.239, 0.021], metal);
  tag(coffee, '挽きたて珈琲', [0, 0.465, 0.173], [0.287, 0.072], { bg: C.cream, color: C.darkTeal });
  for (const x of [-0.084, 0.084]) {
    cylinder(coffee, [x, 0.362, 0.177], 0.022, 0.022, 0.008, x < 0 ? C.coral : C.teal, { rotation: [Math.PI / 2, 0, 0] });
    box(coffee, [x, 0.265, 0.16], [0.035, 0.085, 0.067], metal);
    cylinder(coffee, [x, 0.098, 0.175], 0.049, 0.035, 0.111, C.paper);
    cylinder(coffee, [x, 0.094, 0.175], 0.044, 0.041, 0.04, C.coral);
    cylinder(coffee, [x, 0.155, 0.175], 0.044, 0.044, 0.005, '#695345');
    torus(coffee, [x, 0.158, 0.175], 0.046, 0.004, C.paper, { rotation: [Math.PI / 2, 0, 0] });
  }
  box(coffee, [0, 0.026, 0.133], [0.36, 0.04, 0.235], metal, { outline: true });
  for (let i = 0; i < 6; i++) box(coffee, [-0.128 + i * 0.05, 0.049, 0.17], [0.013, 0.006, 0.117], C.ink, { shadow: false });
  cylinder(coffee, [0, 0.629, -0.019], 0.10, 0.075, 0.137, C.paper, { opacity: 0.11, segments: 16 });
  for (let i = 0; i < 11; i++) {
    const bean = sphere(coffee, [(random() - 0.5) * 0.13, 0.586 + random() * 0.054, -0.019 + (random() - 0.5) * 0.10], 0.024, '#695345');
    bean.scale.set(1, 0.62, 0.72);
  }
  cylinder(coffee, [0, 0.702, -0.019], 0.107, 0.107, 0.018, C.ink);
  const coffeeSign = group(checkout, [0.229, 1.271, -0.275]);
  box(coffeeSign, [0, 0, 0], [0.247, 0.225, 0.024], woodLight, { outline: true });
  tag(coffeeSign, 'HOT\n珈琲 ¥120', [0, 0, 0.014], [0.216, 0.19], { bg: C.coral, color: C.paper });
  rod(coffeeSign, [0, -0.111, 0], [0, -0.14, -0.07], 0.012, wood);
  // Chopstick and napkin holders beside the warmer.
  box(checkout, [-0.053, 1.19, -0.288], [0.12, 0.12, 0.13], C.teal);
  for (let i = 0; i < 6; i++) rod(checkout, [-0.095 + i * 0.015, 1.15, -0.29], [-0.10 + i * 0.019, 1.398 + (i % 2) * 0.013, -0.278], 0.005, woodLight);
  box(checkout, [0.103, 1.158, -0.066], [0.16, 0.058, 0.13], C.paper);
  for (let i = 0; i < 3; i++) box(checkout, [0.103, 1.191 + i * 0.002, -0.062], [0.151, 0.001, 0.109], C.cream, { shadow: false });

  const oden = group(checkout, [0.365, 1.128, 0.26]);
  oden.name = 'Six-compartment oden warmer';
  box(oden, [0, 0.072, 0], [0.574, 0.143, 0.319], metal, { bevel: 0.017, outline: true });
  box(oden, [0, 0.147, 0], [0.515, 0.014, 0.264], '#9f7950');
  for (const x of [-0.278, 0.278]) box(oden, [x, 0.164, 0], [0.02, 0.027, 0.30], metal);
  for (const z of [-0.149, 0.149]) box(oden, [0, 0.164, z], [0.552, 0.027, 0.02], metal);
  for (const x of [-0.089, 0.089]) box(oden, [x, 0.161, 0], [0.01, 0.039, 0.277], metal);
  box(oden, [0, 0.161, 0], [0.535, 0.039, 0.011], metal);
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 2; row++) {
      const x = -0.18 + col * 0.18;
      const z = -0.074 + row * 0.149;
      if (col === 0) {
        cylinder(oden, [x, 0.164, z], 0.049, 0.046, 0.029, C.paper);
        cylinder(oden, [x, 0.181, z], 0.039, 0.039, 0.002, C.cream, { shadow: false });
      } else if (col === 1) {
        const egg = sphere(oden, [x, 0.174, z], 0.035, C.paper);
        egg.scale.set(0.78, 0.85, 1.18);
        sphere(oden, [x + 0.047, 0.173, z], 0.022, C.yellow);
      } else {
        torus(oden, [x, 0.174, z], 0.035, 0.013, woodLight, { rotation: [Math.PI / 2, 0, 0] });
        cylinder(oden, [x - 0.04, 0.169, z + 0.036], 0.018, 0.016, 0.026, C.cream);
      }
    }
  }
  rod(oden, [0.198, 0.17, -0.058], [0.248, 0.335, -0.09], 0.005, woodLight);
  tag(oden, 'おでん  ¥100', [0, 0.074, 0.162], [0.40, 0.077], { bg: C.coral, color: C.paper });
  // Fine, translucent curling steam rather than opaque smoke puffs.
  for (let i = 0; i < 3; i++) {
    const wisp = group(oden, [-0.17 + i * 0.17, 0.194, -0.035 + i * 0.032]);
    wisp.userData.dynamic = true;
    tube(wisp, [[0, 0, 0], [-0.018, 0.069, 0.008], [0.026, 0.14, -0.009], [-0.012, 0.218, 0.004], [0.024, 0.291, -0.009]], 0.007, steamMaterial, { shadow: false });
    steamWisps.push(wisp);
  }

  // Small safety detail in the clear service aisle, mounted rather than floating.
  const extinguisher = group(root, [-3.60, 0.49, -4.20]);
  box(extinguisher, [0, 0.21, -0.115], [0.15, 0.39, 0.06], wood);
  cylinder(extinguisher, [0, 0.174, 0], 0.064, 0.064, 0.28, C.coral);
  cylinder(extinguisher, [0, 0.326, 0], 0.027, 0.05, 0.036, C.coral);
  box(extinguisher, [0, 0.36, 0], [0.085, 0.027, 0.03], C.ink);
  tube(extinguisher, [[0.033, 0.35, 0], [0.091, 0.32, 0], [0.092, 0.15, 0.01]], 0.01, C.ink);
  tag(extinguisher, '消火器', [0, 0.19, 0.065], [0.087, 0.067], { bg: C.paper, color: C.coral });

  // Suspended aisle boxes and sparse strip fixtures, but deliberately no ceiling.
  for (const [x, z, text, accent] of [[-2.2, -1.83, '01  お弁当', C.coral], [0.7, -2.02, '02  お菓子', C.teal]]) {
    const sign = group(root, [x, 2.72, z]);
    box(sign, [0, 0, 0], [0.96, 0.235, 0.118], C.paper, { outline: true, bevel: 0.009 });
    for (const sx of [-0.35, 0.35]) rod(sign, [sx, 0.119, 0], [sx, 0.60, 0], 0.007, metal);
    box(sign, [0, -0.108, 0.066], [0.94, 0.026, 0.02], accent);
    tag(sign, text, [0, 0.009, 0.062], [0.89, 0.165], { bg: C.paper, color: accent, emissive: 0.09 });
  }
  for (const [x, z, width] of [[-1.79, -2.86, 1.73], [1.32, -2.86, 1.73], [-1.82, -0.75, 1.64], [1.37, -0.75, 1.64]]) {
    const fixture = group(root, [x, 3.32, z]);
    box(fixture, [0, 0, 0], [width, 0.059, 0.135], C.cream, { outline: true, bevel: 0.009 });
    box(fixture, [0, -0.038, 0], [width - 0.10, 0.022, 0.084], litCream, { shadow: false });
    for (const end of [-1, 1]) {
      box(fixture, [end * (width / 2 - 0.025), 0, 0], [0.05, 0.062, 0.14], C.darkTeal);
      rod(fixture, [end * width * 0.36, 0.032, 0], [end * width * 0.36, 0.118, 0], 0.012, metal);
    }
  }
  const lights = [
    light(root, [-1.80, 2.97, -1.35], '#ffe4ba', 18, 6.8),
    light(root, [0.70, 2.94, -3.19], '#fff1d1', 20, 6.3),
    light(root, [2.02, 2.48, -0.16], '#ffdbab', 15, 4.8),
  ];

  batchStatic(root);
  // The kit batches untextured solids; combine repeated mapped label planes into
  // instanced meshes as well, keeping hundreds of products inexpensive to draw.
  root.updateMatrixWorld(true);
  const instances = new Map();
  root.traverse(object => {
    if (!object.isMesh || !object.userData.interiorLabel || !object.material.map) return;
    const key = `${object.geometry.uuid}:${object.material.uuid}`;
    if (!instances.has(key)) instances.set(key, []);
    instances.get(key).push(object);
  });
  for (const copies of instances.values()) {
    if (copies.length < 2) continue;
    const instanced = new THREE.InstancedMesh(copies[0].geometry, copies[0].material, copies.length);
    instanced.name = 'Shared printed product / shelf labels';
    instanced.receiveShadow = true;
    copies.forEach((copy, i) => {
      instanced.setMatrixAt(i, copy.matrixWorld);
      copy.removeFromParent();
    });
    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
    root.add(instanced);
  }
  parent.add(root);
  return {
    root,
    lights,
    // Optional: the scene can call this with elapsed seconds. Static rendering
    // already includes the complete steam silhouette if no animation is desired.
    update(time = 0) {
      const t = Number.isFinite(time) ? time : 0;
      steamWisps.forEach((wisp, i) => {
        wisp.rotation.y = Math.sin(t * 0.65 + i * 1.7) * 0.28;
        wisp.scale.y = 1 + Math.sin(t * 1.2 + i * 2) * 0.075;
      });
    },
  };
}
