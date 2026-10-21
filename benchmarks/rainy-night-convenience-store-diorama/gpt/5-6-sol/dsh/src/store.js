import * as THREE from 'three';
import { C, PRODUCT_COLORS } from './palette.js';
import {
  box, cylinder, frameWindow, glow, group, makeTextPlane, outline, plane, standard, toon, glass,
} from './modeling.js';
import { labelTexture, posterTexture } from './textures.js';

function addProducts(parent, origin, count, spacing, scale = [0.16, 0.24, 0.12], seed = 0) {
  const mats = PRODUCT_COLORS.map((color) => toon(color));
  for (let i = 0; i < count; i++) {
    const x = origin[0] + i * spacing[0];
    const y = origin[1] + i * spacing[1];
    const z = origin[2] + i * spacing[2];
    const mat = mats[(i + seed) % mats.length];
    const item = box('product', scale, [x, y, z], mat, parent, { outlineOpacity: .45, castShadow: false });
    item.rotation.y = ((i + seed) % 3 - 1) * .035;
    const label = box('product-label', [scale[0] * .62, scale[1] * .2, .006], [0, 0, scale[2] / 2 + .004], toon(C.warmWhite), item, { outline: false, castShadow: false });
    label.material = toon(PRODUCT_COLORS[(i + seed + 3) % PRODUCT_COLORS.length]);
  }
}

function buildShelf(parent, position, width = 2.8, rotation = 0, levels = 4, seed = 0) {
  const g = group('stocked-shelf', parent, position);
  g.rotation.y = rotation;
  const frame = toon(0x566875);
  const shelfMat = toon(0xe5dfcf);
  box('shelf-backing', [width, 2.35, .09], [0, 1.18, -.23], toon(0xb7c5c1), g);
  box('shelf-left', [.09, 2.45, .48], [-width / 2, 1.2, 0], frame, g);
  box('shelf-right', [.09, 2.45, .48], [width / 2, 1.2, 0], frame, g);
  for (let l = 0; l < levels; l++) {
    const y = .25 + l * .58;
    box('shelf-board', [width, .08, .56], [0, y, 0], shelfMat, g);
    const count = Math.floor((width - .18) / .25);
    addProducts(g, [-width / 2 + .19, y + .18, .14], count, [.25, 0, 0], [.16, .27 + (l % 2) * .07, .13], seed + l * 2);
    box('price-strip', [width - .12, .07, .03], [0, y - .02, .3], toon(l % 2 ? C.teal : C.coral), g, { outline: false });
  }
  box('aisle-sign', [width * .55, .22, .05], [0, 2.58, -.02], glow(seed % 2 ? C.teal : C.coral, .7), g);
  return g;
}

function buildDrinkFridges(parent) {
  const g = group('drink-fridge-wall', parent, [-2.35, .82, -4.82]);
  for (let n = 0; n < 4; n++) {
    const x = n * 1.32;
    box('fridge-cabinet', [1.22, 2.85, .52], [x, 1.43, 0], toon(0xe5ece5), g);
    const inside = box('fridge-dark-interior', [1.02, 2.5, .04], [x, 1.38, .275], glow(0xbcecff, .45), g, { outline: false });
    for (let l = 0; l < 5; l++) {
      const y = .36 + l * .47;
      box('fridge-shelf', [1.02, .035, .04], [x, y, .305], toon(0xd9f4f3), g, { outline: false });
      for (let p = 0; p < 5; p++) {
        const color = PRODUCT_COLORS[(n * 3 + l + p) % PRODUCT_COLORS.length];
        cylinder('bottle', .055, .065, .2, [x - .4 + p * .2, y + .12, .34], toon(color), g, { segments: 7, outline: false, castShadow: false });
      }
    }
    box('fridge-handle', [.035, 1.8, .04], [x + .46, 1.4, .34], toon(C.steel), g, { outline: false });
  }
  return g;
}

function buildCheckout(parent) {
  const g = group('checkout-zone', parent, [1.1, .83, -.55]);
  box('checkout-counter', [2.65, .86, .82], [0, .44, 0], toon(0xe9e4d3), g);
  box('checkout-color-band', [2.66, .22, .84], [0, .7, 0], toon(C.teal), g, { outline: false });
  box('register-base', [.56, .14, .4], [.45, .98, -.06], toon(C.inkSoft), g);
  const screen = box('register-screen', [.48, .43, .08], [.45, 1.25, -.02], toon(C.ink), g, { rotation: [-.18, 0, 0] });
  box('screen-glow', [.38, .3, .008], [0, 0, .046], glow(C.blue, .8), screen, { outline: false });
  box('receipt-printer', [.38, .28, .38], [-.25, 1.02, -.04], toon(0x566573), g);
  box('counter-tray', [.55, .04, .34], [-.82, .91, .02], toon(C.red), g);

  const oden = group('oden-warmer', g, [-.83, .95, -.1]);
  box('oden-case', [.68, .46, .48], [0, .25, 0], glass(C.warmWhite, .42), oden);
  box('oden-tray', [.62, .08, .42], [0, .06, 0], toon(C.steel), oden);
  for (let i = 0; i < 5; i++) cylinder('oden', .055, .06, .1, [-.22 + i * .11, .13, .03], toon(i % 2 ? C.yellow : 0xc58b54), oden, { segments: 8, outline: false });
  box('oden-header', [.72, .16, .08], [0, .56, 0], glow(C.coral, .85), oden);

  const coffee = group('coffee-machine', g, [1.02, .9, -.12]);
  box('coffee-body', [.52, .82, .44], [0, .42, 0], toon(0x4d3e46), coffee);
  box('coffee-screen', [.33, .18, .02], [0, .61, .23], glow(C.teal, .8), coffee, { outline: false });
  box('coffee-bay', [.28, .3, .03], [0, .28, .23], toon(C.ink), coffee);
  cylinder('paper-cup', .07, .055, .16, [0, .18, .27], toon(C.warmWhite), coffee, { segments: 10, outline: false });
  return g;
}

function buildMagazineRack(parent) {
  const g = group('magazine-rack', parent, [-4.75, .84, -.18]);
  box('rack-body', [1.85, 1.22, .45], [0, .62, 0], toon(0xd8d6c7), g);
  for (let i = 0; i < 6; i++) {
    const color = PRODUCT_COLORS[i % PRODUCT_COLORS.length];
    const magazine = box('magazine', [.25, .4, .035], [-.68 + i * .27, .89 + (i % 2) * .05, .25], toon(color), g, { rotation: [-.18, 0, 0], outlineOpacity: .45 });
    box('magazine-title', [.18, .035, .006], [0, .1, .021], toon(C.warmWhite), magazine, { outline: false });
  }
  box('rack-label', [1.5, .14, .04], [0, 1.32, .23], glow(C.yellow, .55), g);
}

function buildFreezer(parent) {
  const g = group('island-freezer', parent, [-3.6, .82, -3.4]);
  box('freezer-base', [2.25, .72, .85], [0, .36, 0], toon(0xe6e9df), g);
  box('freezer-window', [2.02, .04, .65], [0, .74, 0], glass(0xc7f2ff, .45), g, { rotation: [0, 0, 0] });
  box('freezer-band', [2.27, .18, .87], [0, .12, 0], toon(C.blue), g, { outline: false });
  for (let i = 0; i < 8; i++) {
    box('frozen-pack', [.2, .06, .34], [-.82 + (i % 4) * .48, .71, -.2 + Math.floor(i / 4) * .4], toon(PRODUCT_COLORS[i % PRODUCT_COLORS.length]), g, { outline: false });
  }
}

function buildInterior(parent) {
  const interior = group('warm-lit-interior', parent);
  plane('store-floor', [9.15, 6.45], [-1.15, .82, -2.05], standard(0xe8dfca, { roughness: .63 }), interior, { outline: false });

  // Floor guidance markings.
  for (let i = 0; i < 4; i++) {
    plane('floor-guide', [.12, .48], [1.65, .829, .15 - i * .62], toon(C.teal), interior, { outline: false });
  }
  plane('queue-line', [2.4, .08], [.85, .831, -1.5], toon(C.coral), interior, { outline: false });

  buildDrinkFridges(interior);
  buildShelf(interior, [-3.7, .83, -2.05], 2.35, 0, 4, 1);
  buildShelf(interior, [-.6, .83, -2.35], 2.65, 0, 4, 3);
  buildShelf(interior, [-.3, .83, -3.75], 2.35, Math.PI, 3, 4);
  buildCheckout(interior);
  buildMagazineRack(interior);
  buildFreezer(interior);

  // Bento and onigiri warmer along side wall.
  const bento = group('bento-zone', interior, [2.82, .83, -3.75]);
  box('bento-case', [1.05, 2.2, .62], [0, 1.1, 0], toon(0xdce5df), bento);
  for (let l = 0; l < 4; l++) {
    box('bento-shelf', [.88, .04, .55], [0, .3 + l * .48, .03], toon(C.steel), bento, { outline: false });
    for (let p = 0; p < 3; p++) {
      box('bento-pack', [.24, .09, .34], [-.28 + p * .28, .36 + l * .48, .1], toon(l % 2 ? C.yellow : C.green), bento, { outlineOpacity: .4 });
    }
  }
  box('bento-sign', [.9, .22, .06], [0, 2.3, .32], glow(C.coral, .8), bento);

  // Warm ceiling lamps.
  for (let x = -4.3; x < 3.1; x += 1.85) {
    for (let z = -4.2; z < .4; z += 1.7) {
      box('ceiling-light', [1.15, .07, .22], [x, 4.72, z], glow(C.warmWhite, 1.7), interior, { outline: false, castShadow: false });
    }
  }

  const backDoor = box('backroom-door', [1.05, 2.15, .1], [3.05, 1.9, -5.22], toon(0x96a9a8), interior);
  box('backroom-window', [.45, .35, .02], [0, .35, .06], glow(C.blue, .25), backDoor, { outline: false });
  box('backroom-sign', [.5, .16, .02], [0, .78, .06], toon(C.white), backDoor, { outline: false });

  const locker = group('lockers', interior, [-5.25, .83, -4.45]);
  for (let x = 0; x < 2; x++) for (let y = 0; y < 4; y++) {
    box('locker-cell', [.48, .42, .35], [x * .5, .22 + y * .44, 0], toon(0x7f9ca0), locker, { outlineOpacity: .48 });
    box('locker-handle', [.05, .04, .02], [x * .5 + .14, .22 + y * .44, .19], toon(C.ink), locker, { outline: false });
  }

  // Local warm lights illuminate the actual geometry.
  const warmLights = [
    [-3.6, 4.35, -1.2, 24],
    [0, 4.3, -2.5, 26],
    [2.2, 3.9, -.2, 18],
  ];
  for (const [x, y, z, power] of warmLights) {
    const light = new THREE.PointLight(C.warmWhite, power, 7.5, 1.8);
    light.position.set(x, y, z);
    light.castShadow = false;
    interior.add(light);
  }
  return interior;
}

export function buildStore(parent) {
  const store = group('Mori-Mart', parent);
  const animations = { doors: [], flickerMaterials: [], rainGlass: [] };

  // Structure: side and back walls keep the interior physically legible.
  box('rear-wall', [9.4, 4.65, .25], [-1.15, 3.02, -5.48], toon(C.wallShade), store);
  box('left-wall', [.25, 4.65, 6.7], [-5.85, 3.02, -2.1], toon(C.wall), store);
  box('right-wall-back', [.25, 4.65, 2.7], [3.55, 3.02, -4.12], toon(C.wall), store);
  box('right-wall-front-column', [.25, 4.65, .55], [3.55, 3.02, .88], toon(C.wall), store);
  box('facade-left-column', [.3, 4.65, .35], [-5.72, 3.02, 1.26], toon(C.wall), store);
  box('facade-middle-column', [.18, 3.55, .35], [.35, 2.28, 1.26], toon(C.inkSoft), store);
  box('facade-right-column', [.28, 4.65, .35], [3.42, 3.02, 1.26], toon(C.wall), store);
  box('window-sill', [9.15, .2, .55], [-1.15, .85, 1.18], toon(0xa6b5ad), store);
  box('upper-fascia', [9.4, .85, .6], [-1.15, 4.72, 1.05], toon(C.wall), store);
  box('flat-roof', [9.8, .32, 7.15], [-1.15, 5.48, -2.08], toon(0x586979), store);
  box('roof-cap', [10.05, .16, 7.42], [-1.15, 5.7, -2.08], toon(C.inkSoft), store);

  buildInterior(store);

  // Front windows and automatic entry.
  const frontPane = frameWindow(store, [-2.65, 2.63, 1.44], 5.75, 3.42, {
    centerBar: true, opacity: .14, thickness: .09,
  });
  animations.rainGlass.push(frontPane);
  const doorGroup = group('automatic-sliding-door', store);
  box('door-header', [2.78, .22, .25], [1.9, 4.26, 1.4], toon(C.inkSoft), doorGroup);
  for (const [i, x] of [[0, 1.25], [1, 2.55]]) {
    const door = group(`door-panel-${i}`, doorGroup, [x, 2.58, 1.43]);
    box('door-vertical-left', [.08, 3.1, .12], [-.58, 0, 0], toon(C.inkSoft), door);
    box('door-vertical-right', [.08, 3.1, .12], [.58, 0, 0], toon(C.inkSoft), door);
    box('door-top', [1.22, .08, .12], [0, 1.51, 0], toon(C.inkSoft), door);
    box('door-bottom', [1.22, .08, .12], [0, -1.51, 0], toon(C.inkSoft), door);
    plane('door-glass', [1.12, 2.92], [0, 0, .015], glass(C.glass, .18), door, { rotation: [0, 0, 0], renderOrder: 5 });
    box('door-band', [1.13, .12, .025], [0, .18, .075], toon(i ? C.coral : C.teal), door, { outline: false });
    box('door-handle', [.055, .65, .06], [i ? -.36 : .36, -.05, .09], toon(C.steel), door, { outline: false });
    animations.doors.push({ object: door, baseX: x, direction: i === 0 ? -1 : 1 });
  }
  plane('entry-mat', [2.5, 1.05], [1.9, .862, 1.77], toon(0x344753), store, { outline: true });
  for (let i = 0; i < 7; i++) plane('mat-stripe', [.05, .88], [.95 + i * .31, .865, 1.77], toon(0x536c77), store, { outline: false });

  // Side display window, assembled inside a rotated local frame.
  const sideGlassGroup = group('side-window', store, [3.68, 0, 0]);
  sideGlassGroup.rotation.y = Math.PI / 2;
  const sidePane = frameWindow(sideGlassGroup, [1.45, 2.64, 0], 3.25, 3.35, { centerBar: true, opacity: .14, thickness: .09 });
  animations.rainGlass.push(sidePane);

  // Signage and canopy.
  const signTexture = labelTexture();
  const signMat = new THREE.MeshStandardMaterial({ map: signTexture, emissiveMap: signTexture, emissive: 0xffffff, emissiveIntensity: 1.05, toneMapped: false });
  const sign = plane('main-illuminated-sign', [8.5, 1.16], [-1.15, 5.08, 1.39], signMat, store, { rotation: [0, 0, 0], outline: true, renderOrder: 4 });
  animations.flickerMaterials.push(signMat);
  box('rain-canopy', [9.7, .18, 1.15], [-1.15, 4.08, 1.65], toon(0xe9e3ce), store);
  box('canopy-teal-band', [9.72, .12, 1.18], [-1.15, 4.02, 1.67], toon(C.teal), store, { outline: false });
  box('canopy-coral-line', [9.74, .055, 1.2], [-1.15, 3.94, 1.68], glow(C.coral, .75), store, { outline: false });

  // Interior window posters and decals.
  makeTextPlane(posterTexture(0), [.72, 1.05], [-4.72, 2.45, 1.51], store, { name: 'oden-poster', emissive: true, intensity: .55, outline: false });
  makeTextPlane(posterTexture(1), [.72, 1.05], [-3.78, 2.45, 1.51], store, { name: 'coffee-poster', emissive: true, intensity: .55, outline: false });
  box('open-decal', [.9, .25, .025], [-1.15, 3.45, 1.52], glow(C.teal, 1.15), store, { outlineOpacity: .35 });
  box('window-hours', [1.1, .13, .02], [-1.15, 3.1, 1.52], glow(C.warmWhite, .65), store, { outline: false });

  // Store-side compressor units and pipes.
  for (let i = 0; i < 2; i++) {
    const ac = group('air-conditioner-outdoor-unit', store, [-4.9 + i * 1.65, 1.32, -5.72]);
    box('ac-case', [1.3, .9, .55], [0, 0, 0], toon(0x9eaaa8), ac);
    cylinder('ac-fan', .29, .29, .035, [0, 0, .295], toon(0x526472), ac, { rotation: [Math.PI / 2, 0, 0], segments: 18 });
    for (let blade = 0; blade < 4; blade++) {
      const b = box('fan-blade', [.08, .44, .02], [0, 0, .32], toon(C.inkSoft), ac, { outline: false });
      b.rotation.z = blade * Math.PI / 2 + .35;
    }
    box('ac-foot-l', [.28, .12, .6], [-.42, -.52, 0], toon(C.steel), ac);
    box('ac-foot-r', [.28, .12, .6], [.42, -.52, 0], toon(C.steel), ac);
  }

  // Vertical corner sign.
  const verticalTexture = labelTexture({ width: 256, height: 720, title: 'MART', subtitle: '24h OPEN' });
  const vertical = makeTextPlane(verticalTexture, [1.15, 3.05], [3.72, 4.18, -.22], store, { emissive: true, intensity: .75 });
  vertical.rotation.y = Math.PI / 2;
  animations.flickerMaterials.push(vertical.material);

  return { group: store, animations };
}
