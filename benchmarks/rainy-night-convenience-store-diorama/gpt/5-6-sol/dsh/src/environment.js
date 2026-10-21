import * as THREE from 'three';
import { C, PRODUCT_COLORS } from './palette.js';
import {
  box, cylinder, glow, group, makeTextPlane, outline, plane, standard, toon, tube, glass,
} from './modeling.js';
import { posterTexture, roadTexture, vendingTexture } from './textures.js';

function buildBase(parent) {
  const base = group('square-collectible-base', parent);
  box('base-shadow', [18.8, .55, 18.8], [0, -.32, 0], toon(C.baseEdge), base, { outlineOpacity: .9 });
  box('base-body', [18.35, .58, 18.35], [0, 0, 0], toon(C.base), base, { outlineOpacity: .92 });
  box('base-inset', [17.82, .13, 17.82], [0, .34, 0], toon(0x3b4d60), base, { outlineOpacity: .55 });
  return base;
}

function buildRoads(parent) {
  const roadMap = roadTexture();
  roadMap.wrapS = roadMap.wrapT = THREE.RepeatWrapping;
  roadMap.repeat.set(3, 3);
  const roadMat = standard(C.asphalt, { map: roadMap, roughness: .32, metalness: .08 });
  const sidewalkMat = standard(C.sidewalk, { roughness: .78 });

  // L-shaped road: foreground avenue and right side street.
  plane('front-wet-street', [17.7, 5.15], [0, .415, 6.25], roadMat, parent, { outline: true });
  plane('side-wet-street', [4.7, 12.4], [6.48, .417, -.08], roadMat, parent, { outline: true });
  plane('store-sidewalk', [12.95, 2.15], [-1.02, .47, 2.58], sidewalkMat, parent, { outline: true });
  plane('side-sidewalk', [2.15, 9.35], [3.98, .47, -2.1], sidewalkMat, parent, { outline: true });
  plane('rear-alley', [9.25, 2.2], [-1.2, .44, -7.52], standard(0x172336, { roughness: .4 }), parent, { outline: true });

  // Curbs.
  box('front-curb', [13.2, .28, .34], [-1.02, .55, 3.65], toon(C.curb), parent);
  box('corner-curb', [.34, .28, 9.62], [5.13, .55, -.96], toon(C.curb), parent);
  box('alley-curb', [9.3, .18, .25], [-1.2, .51, -6.42], toon(0x586777), parent);

  // Rounded corner is suggested by small stepped curb pieces.
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI / 10;
    const x = 4.73 + Math.sin(angle) * .38;
    const z = 3.26 + Math.cos(angle) * .38;
    const c = box('corner-curb-segment', [.38, .28, .3], [x, .55, z], toon(C.curb), parent);
    c.rotation.y = -angle;
  }

  // Drainage channels and grates.
  box('front-drain-channel', [13.1, .035, .38], [-1.15, .495, 3.88], toon(0x273a49), parent, { outlineOpacity: .45 });
  for (let i = 0; i < 8; i++) box('drain-slot', [.06, .025, .32], [-5.5 + i * .36, .52, 3.88], toon(C.black), parent, { outline: false });
  box('side-drain-channel', [.38, .035, 8.8], [5.38, .495, -.85], toon(0x273a49), parent, { outlineOpacity: .45 });
  for (let i = 0; i < 10; i++) box('side-drain-slot', [.32, .025, .06], [5.38, .52, -4.8 + i * .35], toon(C.black), parent, { outline: false });

  // Reflective zebra crossing across the side street.
  for (let i = 0; i < 5; i++) {
    plane('wet-crosswalk-stripe', [3.55, .38], [6.78, .445, 4.55 + i * .64], standard(0xcfd8d5, { roughness: .28, metalness: .03 }), parent, { outline: false });
  }
  // Stop line and road markings.
  plane('stop-line', [3.75, .14], [6.78, .448, 4.12], standard(0xdce0d5, { roughness: .3 }), parent, { outline: false });
  plane('lane-dash-a', [2.15, .13], [-5.1, .447, 6.2], standard(0xc1c9c7, { roughness: .34 }), parent, { outline: false });
  plane('lane-dash-b', [2.15, .13], [-1.6, .447, 6.2], standard(0xc1c9c7, { roughness: .34 }), parent, { outline: false });

  // Parking space outside the store.
  const parkingMat = standard(0xd8dfda, { roughness: .33 });
  plane('parking-line-a', [.11, 3.1], [-4.9, .49, 2.4], parkingMat, parent, { outline: false });
  plane('parking-line-b', [.11, 3.1], [-1.9, .49, 2.4], parkingMat, parent, { outline: false });
  plane('parking-stop', [3.1, .11], [-3.4, .49, 3.22], parkingMat, parent, { outline: false });
  return roadMat;
}

function buildVendingMachine(parent) {
  const g = group('vending-machine', parent, [4.42, .6, -.45]);
  g.rotation.y = -Math.PI / 2;
  box('vending-body', [1.28, 2.45, .72], [0, 1.22, 0], toon(0xe7e9dd), g);
  const texture = vendingTexture();
  const frontMat = new THREE.MeshStandardMaterial({ map: texture, emissiveMap: texture, emissive: 0xffffff, emissiveIntensity: .7, toneMapped: false });
  plane('vending-lit-face', [1.12, 2.23], [0, 1.28, .371], frontMat, g, { rotation: [0, 0, 0], outline: true, renderOrder: 3 });
  box('vending-foot-left', [.24, .2, .6], [-.38, -.07, 0], toon(C.inkSoft), g);
  box('vending-foot-right', [.24, .2, .6], [.38, -.07, 0], toon(C.inkSoft), g);
  const light = new THREE.PointLight(0xc7f4ff, 2.4, 4.5, 2);
  light.position.set(0, 1.2, .8);
  g.add(light);
  return frontMat;
}

function buildBicycle(parent) {
  const bike = group('parked-bicycle', parent, [-4.15, .68, 3.0]);
  bike.rotation.y = -.08;
  const dark = toon(0x28374a);
  const frameMat = toon(C.coral);
  const wheels = [];
  for (const x of [-.78, .78]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(.55, .045, 8, 24), dark);
    wheel.name = 'bicycle-wheel';
    wheel.position.set(x, .57, 0);
    outline(wheel, C.ink, 28, .78);
    bike.add(wheel);
    wheels.push(wheel);
    for (let s = 0; s < 8; s++) {
      const spoke = box('wheel-spoke', [.015, 1.02, .015], [x, .57, 0], toon(C.steel), bike, { outline: false });
      spoke.rotation.z = s * Math.PI / 8;
    }
  }
  tube('bike-frame-top', [[-.38, .62, 0], [.24, .62, 0], [.62, .55, 0]], .045, frameMat, bike, { outline: true });
  tube('bike-frame-lower', [[-.38, .62, 0], [0, .18, 0], [.24, .62, 0], [-.38, .62, 0]], .045, frameMat, bike, { outline: true });
  tube('front-fork', [[.24, .64, 0], [.7, 1.15, 0], [.78, .57, 0]], .035, dark, bike);
  tube('handlebar', [[.63, 1.15, 0], [.67, 1.35, 0], [.88, 1.38, 0]], .035, dark, bike);
  tube('seat-post', [[-.3, .62, 0], [-.43, 1.05, 0]], .04, dark, bike);
  box('bike-seat', [.38, .09, .18], [-.5, 1.12, 0], dark, bike, { rotation: [0, 0, -.08] });
  const basket = group('bike-basket', bike, [.92, 1.03, 0]);
  box('basket-bottom', [.48, .05, .42], [0, 0, 0], toon(0x738898), basket);
  for (let i = 0; i < 5; i++) box('basket-bar', [.025, .38, .025], [-.2 + i * .1, .18, .2], toon(C.steel), basket, { outline: false });
  box('kickstand', [.03, .65, .03], [-.2, .2, .16], dark, bike, { rotation: [0, 0, -.35], outline: false });
  return bike;
}

function buildUmbrellaStand(parent) {
  const g = group('umbrella-stand', parent, [3.35, .65, 2.55]);
  box('umbrella-rack', [1.05, .6, .55], [0, .3, 0], toon(0x607485), g);
  box('umbrella-rack-label', [.72, .16, .03], [0, .42, .295], toon(C.warmWhite), g, { outline: false });
  const umbrellaColors = [C.teal, C.yellow, C.purple, C.blue, C.coral];
  for (let i = 0; i < 7; i++) {
    const x = -.36 + (i % 4) * .23;
    const z = -.12 + Math.floor(i / 4) * .25;
    const u = group('closed-umbrella', g, [x, .3, z]);
    const shaft = cylinder('umbrella-shaft', .018, .018, 1.35, [0, .65, 0], toon(C.steel), u, { segments: 6, outline: false });
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(.11, .72, 8), toon(umbrellaColors[i % umbrellaColors.length]));
    canopy.name = 'folded-canopy';
    canopy.position.y = .8;
    canopy.rotation.z = Math.PI;
    u.add(canopy);
    tube('umbrella-handle', [[0, .02, 0], [0, -.08, 0], [.08, -.13, 0]], .025, toon(C.inkSoft), u);
    u.rotation.z = (i % 3 - 1) * .05;
  }
}

function buildStreetFurniture(parent) {
  const animations = { flickerMaterials: [], signalLamps: [] };
  buildVendingMachine(parent);
  buildBicycle(parent);
  buildUmbrellaStand(parent);

  // Trash and recycling bins.
  const bins = group('sorted-trash-bins', parent, [4.48, .62, -2.32]);
  bins.rotation.y = -Math.PI / 2;
  for (let i = 0; i < 2; i++) {
    box('recycling-bin', [.63, .9, .55], [i * .69, .45, 0], toon(i ? 0x7f9696 : 0x6f8c85), bins);
    box('bin-slot', [.32, .08, .025], [i * .69, .68, .29], toon(C.black), bins, { outline: false });
    box('bin-label', [.3, .18, .02], [i * .69, .36, .29], toon(i ? C.coral : C.teal), bins, { outline: false });
  }

  // Street lamp with warm pool.
  const lamp = group('street-lamp', parent, [2.75, .58, 5.15]);
  cylinder('lamp-pole', .1, .14, 4.75, [0, 2.36, 0], toon(0x42546a), lamp, { segments: 10 });
  tube('lamp-arm', [[0, 4.55, 0], [0, 4.9, 0], [.52, 5.08, 0]], .09, toon(0x42546a), lamp, { outline: true });
  box('lamp-housing', [.8, .22, .42], [.7, 5.06, 0], toon(0x35465b), lamp, { rotation: [0, 0, -.1] });
  const lampBulb = box('lamp-warm-light', [.57, .06, .28], [.7, 4.92, 0], glow(C.warm, 2.1), lamp, { outline: false });
  animations.flickerMaterials.push(lampBulb.material);
  const streetLight = new THREE.SpotLight(C.warm, 9, 10, .75, .55, 1.5);
  streetLight.position.set(.7, 4.86, 0);
  streetLight.target.position.set(.4, 0, .2);
  streetLight.castShadow = true;
  streetLight.shadow.mapSize.set(512, 512);
  lamp.add(streetLight, streetLight.target);

  // Guardrails follow the corner.
  const rails = group('corner-guardrails', parent);
  const railMat = toon(0xd8e3df);
  for (const [x, z, ry] of [[4.72, 1.6, 0], [4.72, .1, 0], [1.85, 3.32, Math.PI / 2]]) {
    const section = group('guardrail-section', rails, [x, .56, z]);
    section.rotation.y = ry;
    for (const px of [-.58, .58]) cylinder('guard-post', .05, .065, .82, [px, .41, 0], railMat, section, { segments: 8 });
    tube('guard-top', [[-.58, .82, 0], [-.72, .74, 0], [-.72, .3, 0], [.72, .3, 0], [.72, .74, 0], [.58, .82, 0]], .055, railMat, section, { outline: true });
  }

  // Bulletin board in the side lane.
  const board = group('community-bulletin-board', parent, [4.55, .58, -4.75]);
  board.rotation.y = -Math.PI / 2;
  box('board-frame', [2.05, 1.52, .18], [0, 1.42, 0], toon(0x4c6171), board);
  box('board-cork', [1.82, 1.26, .03], [0, 1.42, .11], toon(0xa77b5f), board, { outline: false });
  for (let i = 0; i < 4; i++) makeTextPlane(posterTexture(i), [.36, .53], [-.65 + i * .43, 1.42 + (i % 2) * .16, .135], board, { outline: false });
  for (const x of [-.78, .78]) cylinder('board-post', .07, .08, 1.55, [x, .45, 0], toon(0x465b69), board, { segments: 8 });
  box('board-roof', [2.35, .14, .55], [0, 2.25, 0], toon(0x596d79), board);

  // Street name sign and mirror.
  const signpost = group('street-signpost', parent, [4.7, .58, 2.76]);
  cylinder('sign-pole', .07, .09, 3.3, [0, 1.65, 0], toon(0x64798a), signpost, { segments: 8 });
  box('street-name-sign', [1.45, .43, .08], [-.32, 2.82, 0], glow(C.blue, .65), signpost, { rotation: [0, 0, -.02] });
  box('sign-white-line', [1.15, .05, .02], [-.32, 2.82, .051], glow(C.white, .6), signpost, { outline: false });
  const mirror = cylinder('traffic-mirror', .42, .42, .07, [.35, 2.18, 0], glow(0xf0a757, .25), signpost, { rotation: [Math.PI / 2, 0, 0], segments: 24 });
  cylinder('mirror-face', .34, .34, .012, [.35, 2.18, .045], standard(0xa9d9e5, { metalness: .4, roughness: .2 }), signpost, { rotation: [Math.PI / 2, 0, 0], segments: 24, outline: false });

  // Small distant traffic signal.
  const signal = group('distant-traffic-signal', parent, [7.7, .58, -5.8]);
  cylinder('signal-pole', .08, .1, 4.05, [0, 2.02, 0], toon(0x3f5264), signal, { segments: 9 });
  tube('signal-arm', [[0, 3.9, 0], [0, 4.18, 0], [-.9, 4.18, 0]], .07, toon(0x3f5264), signal);
  box('signal-case', [1.45, .48, .25], [-1.25, 4.18, 0], toon(C.ink), signal);
  [C.green, C.yellow, C.red].forEach((color, i) => {
    const lampMesh = cylinder('signal-lamp', .13, .13, .035, [-1.7 + i * .43, 4.18, .14], glow(color, i === 0 ? 1.5 : .08), signal, { rotation: [Math.PI / 2, 0, 0], segments: 16, outline: false });
    animations.signalLamps.push(lampMesh.material);
  });

  return animations;
}

function buildUtilityPole(parent) {
  const pole = group('utility-pole-and-wires', parent, [-7.35, .59, -3.95]);
  cylinder('wooden-utility-pole', .15, .22, 6.8, [0, 3.38, 0], toon(0x394c5d), pole, { segments: 10 });
  box('pole-band', [.38, .12, .38], [0, 1.2, 0], toon(C.steel), pole, { outline: false });
  box('crossbar', [2.2, .15, .18], [0, 6.2, 0], toon(0x35475a), pole);
  for (const x of [-.85, 0, .85]) {
    cylinder('ceramic-insulator', .1, .12, .32, [x, 6.43, 0], toon(0xd2d7cc), pole, { segments: 8 });
  }
  box('transformer', [.78, 1.05, .62], [.48, 5.2, 0], toon(0x596e7d), pole);
  cylinder('transformer-cap', .28, .31, .14, [.48, 5.78, 0], toon(0x465b69), pole, { segments: 10 });
  box('pole-number', [.28, .48, .02], [0, 3.4, .19], toon(C.warmWhite), pole, { outline: false });

  const wireMat = standard(0x131b2a, { roughness: .9 });
  [-.85, 0, .85].forEach((x, i) => {
    tube('overhead-wire', [[-7.35 + x, 7.03, -3.95], [-3.4 + x * .5, 6.35 - i * .12, -3.1], [1.0, 6.65 - i * .18, -4.55], [5.1, 6.1 - i * .1, -5.4]], .025, wireMat, parent, { segments: 45 });
  });
  tube('service-cable', [[-7.3, 6.4, -3.95], [-5.4, 5.95, -3.1], [-3.0, 5.82, -4.9]], .03, wireMat, parent, { segments: 28 });
}

function buildAlleyDetails(parent) {
  // Alley entrance framing, crates, pipes, and a curtain-like light.
  box('alley-shadow-wall', [.18, 4.8, 2.0], [-5.95, 2.85, -6.65], toon(0x1a2939), parent);
  const crates = group('delivery-crates', parent, [-4.8, .58, -6.9]);
  for (let i = 0; i < 5; i++) {
    const x = (i % 2) * .72;
    const y = Math.floor(i / 2) * .42;
    box('plastic-crate', [.64, .38, .5], [x, .2 + y, 0], toon(i % 2 ? C.tealDark : 0x52758a), crates);
    for (let s = 0; s < 3; s++) box('crate-slot', [.1, .2, .02], [x - .18 + s * .18, .2 + y, .26], toon(C.inkSoft), crates, { outline: false });
  }
  const pipes = group('service-pipes', parent, [3.72, .6, -4.75]);
  tube('service-pipe-a', [[0, 0, 0], [0, 1.2, 0], [.35, 1.55, 0], [.35, 3.5, 0]], .055, toon(0x72939a), pipes, { outline: true });
  tube('service-pipe-b', [[0, .1, .18], [0, 2.6, .18], [-.28, 3.0, .18]], .04, toon(0x6f8190), pipes);
  box('electric-meter', [.45, .62, .2], [.32, 2.12, .08], toon(0xb0c0bb), pipes);
  cylinder('meter-window', .13, .13, .02, [.32, 2.21, .19], glass(0xbdeaf3, .7), pipes, { rotation: [Math.PI / 2, 0, 0], segments: 16 });
}

export function buildEnvironment(parent) {
  const base = buildBase(parent);
  buildRoads(base);
  const furnitureAnimations = buildStreetFurniture(base);
  buildUtilityPole(base);
  buildAlleyDetails(base);
  return { base, animations: furnitureAnimations };
}
