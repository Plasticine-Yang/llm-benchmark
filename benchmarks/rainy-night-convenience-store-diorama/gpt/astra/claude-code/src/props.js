import * as THREE from 'three';
import {
  C, material, group, mesh, box, cylinder, sphere, torus, rod, tube,
  canvasTexture, halo, light, rng,
} from './kit.js';

const PI = Math.PI;
const RUST = '#ac5c4e';
const LEAVES = ['#3e7567', '#658e75', '#91ac83'];
const FONT = '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';

// All category signs and little printed surfaces share one atlas.
function makeDecals() {
  const specs = [
    { key: 'brand', aspect: 4.2, bg: C.paper, fg: C.darkTeal, text: 'ひといき', sub: 'DRINKS  ·  24 HOURS' },
    { key: 'side', aspect: .37, bg: C.teal, fg: C.paper, text: 'ひといき', kind: 'vertical' },
    { key: 'prices', aspect: 8, bg: C.darkTeal, fg: C.paper, text: '¥120   ¥130   ¥140   ¥120   ¥150' },
    { key: 'ready', aspect: 2.1, bg: C.ink, fg: '#a2e4c3', text: '販売中' },
    { key: 'ic', aspect: 1, bg: C.darkTeal, fg: C.paper, kind: 'ic' },
    { key: 'cans', aspect: 1.55, bg: C.paper, fg: C.darkTeal, text: '缶・びん', sub: 'CANS / GLASS', kind: 'bin' },
    { key: 'pet', aspect: 1.55, bg: C.paper, fg: C.blue, text: 'ペット', sub: 'PET BOTTLES', kind: 'bin' },
    { key: 'umbrella', aspect: 1, bg: C.paper, fg: C.darkTeal, text: '傘' },
    { key: 'street', aspect: 4, bg: '#315b79', fg: C.paper, text: '東町三丁目', sub: 'HIGASHIMACHI 3', kind: 'street' },
    { key: 'post', aspect: 1.1, bg: RUST, fg: C.paper, text: '〒', sub: 'POST', kind: 'post' },
    { key: 'collection', aspect: 2.3, bg: C.paper, fg: C.ink, text: '取集時刻', sub: '10:30  /  16:00' },
    { key: 'pole', aspect: .32, bg: C.paper, fg: C.ink, text: '東町六八', kind: 'vertical' },
    { key: 'parking', aspect: .78, bg: '#315b79', fg: C.paper, kind: 'parking' },
    { key: 'crate', aspect: 2.6, bg: C.paper, fg: C.darkTeal, text: '空きびん' },
    { key: 'bike', aspect: 4, bg: C.paper, fg: C.darkTeal, text: 'KOYORI' },
    { key: 'collect', aspect: 5.5, bg: C.teal, fg: C.paper, text: 'おとりぐち' },
  ];
  const columns = 4, cellW = 512, cellH = 256, gutter = 6;
  const rows = Math.ceil(specs.length / columns);
  const atlas = canvasTexture(columns * cellW, rows * cellH, ctx => {
    const print = (text, x, y, size, color, width, weight = 700) => {
      ctx.fillStyle = color;
      ctx.font = `${weight} ${size}px ${FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y, width);
    };
    specs.forEach((s, i) => {
      const ox = i % columns * cellW, oy = Math.floor(i / columns) * cellH;
      ctx.fillStyle = s.bg; ctx.fillRect(ox, oy, cellW, cellH);
      ctx.save();
      ctx.translate(ox + gutter, oy + gutter);
      const h = 256, w = h * s.aspect;
      ctx.scale((cellW - 2 * gutter) / w, (cellH - 2 * gutter) / h);
      ctx.strokeStyle = s.fg; ctx.lineWidth = 3;
      if (s.kind === 'vertical') {
        [...s.text].forEach((letter, j) => print(letter, w / 2, h * (.16 + j * .22), w * .67, s.fg, w * .84));
        ctx.fillStyle = s.fg; ctx.fillRect(w * .26, h * .95, w * .48, 3);
      } else if (s.kind === 'ic') {
        ctx.lineWidth = 8;
        ctx.strokeRect(w * .18, h * .16, w * .64, h * .49);
        [0, 1, 2].forEach(j => {
          ctx.beginPath(); ctx.arc(w * .42, h * .4, h * (.07 + j * .065), -.75, .75); ctx.stroke();
        });
        print('IC', w / 2, h * .84, h * .23, s.fg, w * .8);
      } else if (s.kind === 'bin') {
        const cx = w / 2;
        ctx.lineWidth = 7;
        if (s.key === 'cans') {
          ctx.strokeRect(cx - 49, 25, 36, 67);
          ctx.beginPath(); ctx.ellipse(cx - 31, 25, 18, 5, 0, 0, 2 * PI); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx + 18, 27); ctx.lineTo(cx + 34, 27);
          ctx.lineTo(cx + 34, 44); ctx.lineTo(cx + 47, 54); ctx.lineTo(cx + 47, 94);
          ctx.lineTo(cx + 5, 94); ctx.lineTo(cx + 5, 54); ctx.lineTo(cx + 18, 44); ctx.closePath(); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.moveTo(cx - 13, 20); ctx.lineTo(cx + 13, 20);
          ctx.lineTo(cx + 13, 42); ctx.lineTo(cx + 31, 56); ctx.lineTo(cx + 31, 96);
          ctx.lineTo(cx - 31, 96); ctx.lineTo(cx - 31, 56); ctx.lineTo(cx - 13, 42); ctx.closePath(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx - 28, 72); ctx.lineTo(cx + 28, 72); ctx.stroke();
        }
        print(s.text, cx, 151, 61, s.fg, w * .91);
        print(s.sub, cx, 214, 27, s.fg, w * .9, 600);
      } else if (s.kind === 'parking') {
        print('P', w * .49, h * .32, h * .61, s.fg, w * .8);
        ctx.fillStyle = C.paper; ctx.fillRect(0, h * .69, w, h * .31);
        print('お客様専用', w / 2, h * .79, h * .10, C.darkTeal, w * .94);
        print('20分無料', w / 2, h * .92, h * .085, C.darkTeal, w * .83, 600);
        ctx.lineWidth = 5; ctx.strokeStyle = C.paper; ctx.strokeRect(6, 6, w - 12, h * .66);
      } else if (s.kind === 'street') {
        ctx.lineWidth = 4; ctx.strokeRect(9, 9, w - 18, h - 18);
        print(s.text, w * .455, h * .40, h * .49, s.fg, w * .8);
        print(s.sub, w * .455, h * .78, h * .16, s.fg, w * .79, 600);
        ctx.fillStyle = s.fg; ctx.beginPath();
        ctx.moveTo(w * .91, h * .28); ctx.lineTo(w * .965, h * .48); ctx.lineTo(w * .91, h * .68); ctx.fill();
      } else if (s.kind === 'post') {
        print(s.text, w / 2, h * .39, h * .68, s.fg, w * .81);
        print(s.sub, w / 2, h * .86, h * .19, s.fg, w * .8);
      } else {
        print(s.text, w / 2, h * (s.sub ? .39 : .51), h * (s.sub ? .51 : .57), s.fg, w * .94);
        if (s.sub) print(s.sub, w / 2, h * .80, h * .18, s.fg, w * .9, 600);
      }
      ctx.restore();
    });
  });
  const matte = new THREE.MeshStandardMaterial({ map: atlas, roughness: .82, emissiveMap: atlas, emissive: '#ffffff', emissiveIntensity: .13 });
  const lit = new THREE.MeshStandardMaterial({ map: atlas, roughness: .65, emissiveMap: atlas, emissive: '#ffffff', emissiveIntensity: .65 });
  const lookup = new Map(specs.map((s, i) => [s.key, i]));
  return (parent, key, pos, size, rotation = [0, 0, 0], luminous = false) => {
    const i = lookup.get(key);
    const geometry = new THREE.PlaneGeometry(...size);
    const uv = geometry.attributes.uv;
    for (let n = 0; n < uv.count; n++) {
      uv.setXY(n,
        (i % columns * cellW + gutter + uv.getX(n) * (cellW - gutter * 2)) / (columns * cellW),
        1 - (Math.floor(i / columns) * cellH + cellH - gutter - uv.getY(n) * (cellH - gutter * 2)) / (rows * cellH));
    }
    return mesh(parent, geometry, pos, luminous ? lit : matte, { rotation, shadow: false });
  };
}

function bolt(parent, pos, radius = .013) {
  return cylinder(parent, pos, radius, radius, .009, C.metal, { segments: 8, rotation: [PI / 2, 0, 0] });
}

function wireRectangle(parent, width, depth, y, thickness, color, x = 0, z = 0) {
  const a = width / 2, b = depth / 2, r = Math.min(.04, a * .2, b * .2);
  return tube(parent, [
    [x - a + r, y, z - b], [x + a - r, y, z - b], [x + a, y, z - b + r],
    [x + a, y, z + b - r], [x + a - r, y, z + b], [x - a + r, y, z + b],
    [x - a, y, z + b - r], [x - a, y, z - b + r], [x - a + r, y, z - b],
  ], thickness, color);
}

function makeVending(parent, decal, m) {
  const g = group(parent, [-4.75, .4, .5]); g.name = 'Teal vending machine';
  for (const x of [-.35, .35]) for (const z of [-.25, .25]) {
    box(g, [x, .055, z], [.13, .11, .14], C.ink, { bevel: .012 });
  }
  box(g, [0, 1.1, 0], [1, 2.03, .73], C.darkTeal, { bevel: .045, outline: true });
  box(g, [0, 1.13, .366], [.956, 1.97, .075], C.teal, { bevel: .028 });
  box(g, [0, 2.137, .015], [1.045, .072, .80], C.teal, { bevel: .024 });
  box(g, [0, 2.098, .41], [1.015, .022, .037], C.paper);
  box(g, [0, 1.962, .414], [.884, .237, .04], C.paper, { bevel: .013 });
  decal(g, 'brand', [0, 1.962, .437], [.85, .204], [0, 0, 0], true);

  // Recessed, stocked display: shelves, bottles, price rails, then the glass.
  box(g, [-.10, 1.372, .414], [.692, .952, .021], C.ink, { bevel: .014 });
  box(g, [-.10, 1.392, .431], [.64, .873, .014], C.paper);
  for (const x of [-.439, .239]) box(g, [x, 1.374, .463], [.027, .968, .11], C.darkTeal);
  for (const y of [.901, 1.851]) box(g, [-.1, y, .463], [.703, .029, .11], C.darkTeal);
  const colors = [C.teal, C.cream, C.yellow, C.coral, C.blue];
  for (let row = 0; row < 3; row++) {
    const shelfY = .973 + row * .291;
    box(g, [-.1, shelfY, .469], [.655, .026, .12], C.metal);
    box(g, [-.1, shelfY - .038, .514], [.655, .052, .023], C.darkTeal);
    decal(g, 'prices', [-.1, shelfY - .037, .528], [.635, .040]);
    for (let col = 0; col < 5; col++) {
      const x = -.363 + col * .131, y = shelfY + .09;
      const index = (col + row * 2) % colors.length, bottled = (row + col) % 3 !== 1;
      cylinder(g, [x, y, .476], .037, .041, .142, colors[index], { segments: 12 });
      cylinder(g, [x, y - .003, .476], .0415, .0415, .064, C.paper, { segments: 12 });
      if (bottled) {
        cylinder(g, [x, y + .080, .476], .021, .035, .029, colors[index]);
        cylinder(g, [x, y + .104, .476], .022, .022, .021, C.paper);
      } else {
        cylinder(g, [x, y + .075, .476], .038, .038, .01, m.chrome);
        torus(g, [x, y + .081, .476], .014, .003, C.ink, { rotation: [PI / 2, 0, 0] });
      }
      box(g, [x, y, .519], [.016, .041, .004], colors[index]);
      box(g, [x, shelfY - .071, .544], [.066, .018, .024], C.paper, { bevel: .006 });
      sphere(g, [x + .043, shelfY - .071, .549], .0065, m.coolGlow);
    }
  }
  box(g, [-.1, 1.39, .56], [.655, .873, .008], m.vendGlass, { shadow: false });
  box(g, [-.399, 1.39, .568], [.012, .829, .003], m.glassGlint, { shadow: false });
  box(g, [-.368, 1.574, .568], [.008, .341, .003], m.glassGlint, { shadow: false });
  box(g, [-.1, 1.81, .511], [.591, .013, .025], m.coolGlow, { shadow: false });

  // Separate service column, including contactless reader and coin return.
  box(g, [.348, 1.332, .43], [.161, .89, .035], C.darkTeal, { bevel: .013 });
  decal(g, 'ready', [.348, 1.705, .451], [.132, .062], [0, 0, 0], true);
  box(g, [.348, 1.546, .453], [.127, .133, .04], C.ink, { bevel: .014 });
  decal(g, 'ic', [.348, 1.546, .475], [.105, .105]);
  cylinder(g, [.348, 1.354, .454], .057, .057, .029, m.chrome, { rotation: [PI / 2, 0, 0], segments: 16 });
  box(g, [.348, 1.354, .474], [.010, .075, .006], C.ink);
  box(g, [.348, 1.216, .459], [.132, .061, .038], C.metal, { bevel: .006 });
  box(g, [.348, 1.219, .481], [.107, .014, .006], C.ink);
  cylinder(g, [.348, 1.073, .458], .032, .032, .035, C.orange, { rotation: [PI / 2, 0, 0] });
  box(g, [.348, .924, .453], [.102, .061, .043], C.ink, { bevel: .01 });
  box(g, [.348, .904, .478], [.11, .02, .037], m.chrome);
  for (const y of [.40, 1.82]) box(g, [.474, y, .385], [.025, .086, .045], C.metal, { bevel: .004 });
  bolt(g, [.401, .75, .414]);

  box(g, [-.08, .562, .42], [.713, .273, .044], C.darkTeal, { bevel: .023 });
  box(g, [-.08, .556, .448], [.632, .193, .022], C.ink, { bevel: .012 });
  box(g, [-.08, .622, .473], [.628, .083, .027], C.metal, { rotation: [-.13, 0, 0], bevel: .009 });
  box(g, [-.08, .454, .488], [.675, .023, .07], C.teal, { bevel: .006 });
  decal(g, 'collect', [-.08, .773, .414], [.51, .085]);
  box(g, [0, .25, .410], [.828, .236, .013], C.teal, { outline: true });
  for (let i = 0; i < 6; i++) box(g, [-.204, .179 + i * .025, .42], [.319, .009, .007], C.darkTeal);
  bolt(g, [.344, .251, .425]);
  decal(g, 'side', [.502, 1.32, -.015], [.414, 1.119], [0, PI / 2, 0]);
  for (let i = 0; i < 5; i++) box(g, [.506, .39 + i * .033, -.012], [.007, .012, .335], C.ink);
  light(g, [-.08, 1.52, .71], '#a4e5dc', 1.65, 2.6);
  halo(g, [-.1, 1.54, .592], '#97dfd5', .80, .085);

  const crate = group(parent, [-5.03, .4, 1.26], [0, -.08, 0]); crate.name = 'Bottle return crate';
  box(crate, [0, .025, 0], [.49, .05, .40], C.darkTeal, { bevel: .009 });
  for (const x of [-.231, .231]) for (const z of [-.186, .186]) box(crate, [x, .156, z], [.034, .282, .034], C.blue);
  for (const y of [.092, .171, .262]) {
    for (const z of [-.186, .186]) box(crate, [0, y, z], [.49, .037, .027], C.blue);
    for (const x of [-.231, .231]) box(crate, [x, y, 0], [.027, .037, .40], C.blue);
  }
  for (const z of [-.186, .186]) for (const x of [-.13, 0, .13]) box(crate, [x, .127, z], [.02, .207, .026], C.blue);
  for (const x of [-.105, .105]) for (const z of [-.086, .086]) {
    cylinder(crate, [x, .206, z], .038, .043, .271, m.umbrellaTeal);
    cylinder(crate, [x, .359, z], .019, .037, .047, m.umbrellaTeal);
    cylinder(crate, [x, .405, z], .019, .019, .052, m.umbrellaTeal);
    torus(crate, [x, .433, z], .019, .004, C.teal, { rotation: [PI / 2, 0, 0] });
  }
  decal(crate, 'crate', [0, .178, .203], [.218, .084]);
}

function makeBicycle(parent, decal, m) {
  const g = group(parent, [2.3, .4, 1.55], [0, .025, 0]); g.name = 'Orange city bicycle';
  const wheelY = .458;
  for (const x of [-.735, .755]) {
    torus(g, [x, wheelY, 0], .420, .036, C.ink);
    for (const z of [-.027, .027]) torus(g, [x, wheelY, z], .414, .011, C.cream);
    torus(g, [x, wheelY, 0], .387, .012, m.chrome);
    cylinder(g, [x, wheelY, 0], .041, .041, .14, m.chrome, { rotation: [PI / 2, 0, 0] });
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * 2 * PI, side = i % 2 ? 1 : -1, b = a + side * .34;
      rod(g, [x + Math.cos(b) * .031, wheelY + Math.sin(b) * .031, side * .053],
        [x + Math.cos(a) * .379, wheelY + Math.sin(a) * .379, 0], .005, m.chrome, { segments: 6 });
    }
    rod(g, [x + .086, wheelY - .35, .002], [x + .075, wheelY - .305, .002], .009, C.ink);
    box(g, [x - .18, wheelY + .135, .014], [.076, .025, .016], C.paper, { rotation: [0, 0, -.68], bevel: .004 });
    const fender = mesh(g, new THREE.TorusGeometry(.473, .02, 6, 36, PI + .34), [x, wheelY, 0], C.cream, { rotation: [0, 0, -.17] });
    fender.scale.z = 2.75;
    for (const side of [-1, 1]) {
      rod(g, [x, wheelY, side * .07], [x - .398, wheelY + .227, side * .054], .009, m.chrome);
      rod(g, [x, wheelY, side * .07], [x + .382, wheelY + .25, side * .054], .009, m.chrome);
    }
  }
  const rear = [-.735, wheelY, 0], crank = [-.115, .43, 0];
  const seat = [-.35, 1.012, 0], head = [.404, .986, 0];
  rod(g, crank, seat, .031, C.orange);
  tube(g, [[-.34, .928, 0], [-.14, .748, 0], [.12, .708, 0], [.414, .872, 0]], .03, C.orange);
  tube(g, [[.431, .809, 0], [.236, .503, 0], [.035, .444, 0], crank], .033, C.orange);
  rod(g, [.433, .801, 0], head, .043, C.orange);
  for (const side of [-1, 1]) {
    rod(g, [-.735, wheelY, side * .066], [-.35, .984, side * .035], .019, C.orange);
    rod(g, [-.735, wheelY, side * .066], [-.115, .43, side * .040], .022, C.orange);
    tube(g, [[.411, .971, side * .048], [.475, .73, side * .073], [.69, .492, side * .075], [.755, wheelY, side * .073]], .025, C.orange);
  }
  cylinder(g, crank, .065, .065, .182, m.chrome, { rotation: [PI / 2, 0, 0] });
  rod(g, seat, [-.378, 1.119, 0], .022, m.chrome);
  box(g, [-.386, 1.143, 0], [.325, .079, .244], C.ink, { bevel: .043, rotation: [0, 0, -.025] });
  box(g, [-.386, 1.169, 0], [.277, .03, .218], RUST, { bevel: .014 });
  for (const z of [-.068, .068]) torus(g, [-.435, 1.084, z], .026, .007, m.chrome, { rotation: [PI / 2, 0, 0] });
  decal(g, 'bike', [-.044, .697, .032], [.174, .044], [0, 0, .025]);

  // Exposed lower chain run, stamped chain guard, and opposed crank arms.
  torus(g, [-.115, .43, .108], .112, .011, C.ink);
  torus(g, [-.115, .43, .111], .077, .009, m.chrome);
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * 2 * PI;
    rod(g, [-.115, .43, .11], [-.115 + .088 * Math.cos(a), .43 + .088 * Math.sin(a), .11], .007, C.metal);
  }
  torus(g, [-.735, wheelY, .106], .053, .009, C.ink);
  tube(g, [[-.735, .516, .122], [-.125, .544, .122], [-.010, .485, .122], [-.030, .360, .122],
    [-.165, .317, .122], [-.742, .404, .122], [-.789, .459, .122], [-.735, .516, .122]], .008, C.metal);
  tube(g, [[-.77, .54, .139], [-.42, .555, .139], [-.12, .571, .139], [.009, .50, .139]], .025, C.cream);
  for (const sign of [-1, 1]) {
    const end = [-.115 + sign * .116, .43 - sign * .102, sign * .169];
    rod(g, [-.115, .43, sign * .13], end, .017, m.chrome);
    box(g, [end[0], end[1], end[2] + sign * .028], [.131, .041, .098], C.ink, { bevel: .008 });
    box(g, [end[0], end[1], end[2] + sign * .080], [.076, .02, .009], C.orange);
  }
  rod(g, [-.23, .408, -.046], [-.365, .019, .233], .016, C.metal);
  box(g, [-.365, .014, .233], [.092, .023, .058], C.ink, { bevel: .006 });

  // Swept bars, brake levers and two gently bowed control cables.
  rod(g, head, [.372, 1.247, 0], .026, m.chrome);
  tube(g, [[.295, 1.208, -.299], [.381, 1.244, -.211], [.402, 1.263, 0], [.381, 1.244, .211], [.295, 1.208, .299]], .022, m.chrome);
  for (const side of [-1, 1]) {
    rod(g, [.348, 1.228, side * .253], [.252, 1.185, side * .333], .032, C.ink);
    rod(g, [.339, 1.229, side * .226], [.224, 1.203, side * .267], .011, m.chrome);
    tube(g, [[.330, 1.229, side * .21], [.49, 1.067, side * .237], [.474, .913, side * .154], [.545, .774, side * .055]], .006, C.ink);
  }
  sphere(g, [.374, 1.289, .141], .041, m.chrome).scale.y = .55;
  box(g, [.414, 1.289, .153], [.028, .013, .022], C.ink, { bevel: .004 });
  box(g, [.79, .813, .057], [.118, .094, .084], C.darkTeal, { bevel: .026 });
  cylinder(g, [.853, .813, .057], .036, .036, .012, C.paper, { rotation: [0, 0, PI / 2] });

  // Thin wire basket stays transparent in silhouette, rather than blocking the window.
  const basket = group(g, [.767, .966, 0], [0, 0, -.035]);
  wireRectangle(basket, .36, .33, 0, .012, C.cream);
  wireRectangle(basket, .445, .423, .285, .016, C.cream);
  wireRectangle(basket, .415, .392, .19, .009, C.cream);
  wireRectangle(basket, .385, .363, .09, .009, C.cream);
  for (let i = 0; i < 7; i++) {
    const f = i / 6 - .5;
    for (const side of [-1, 1]) {
      rod(basket, [f * .36, 0, side * .165], [f * .445, .285, side * .2115], .007, C.cream);
      rod(basket, [side * .18, 0, f * .33], [side * .2225, .285, f * .423], .007, C.cream);
    }
    rod(basket, [f * .36, 0, -.165], [f * .36, 0, .165], .007, C.cream);
  }
  for (const z of [-.133, .133]) rod(g, [.755, wheelY, z * .55], [.878, .974, z], .011, m.chrome);
  rod(g, [.44, 1.034, 0], [.571, 1.039, 0], .016, C.metal);

  // Rear carrier, reflector, and small mud flap.
  wireRectangle(g, .47, .255, .984, .014, m.chrome, -.713);
  for (const x of [-.89, -.75, -.61]) rod(g, [x, .984, -.12], [x, .984, .12], .009, m.chrome);
  for (const side of [-1, 1]) rod(g, [-.735, wheelY, side * .078], [-.908, .983, side * .119], .012, m.chrome);
  box(g, [-1.013, .731, 0], [.032, .081, .094], C.coral, { bevel: .012 });
  box(g, [-1.204, .456, 0], [.024, .131, .103], C.ink, { bevel: .01, rotation: [0, 0, .14] });
}

function closedCanopy(height) {
  const rings = [[.13, .010], [.31, .026], [.53, .038], [.75, .064], [.91, .082], [.95, .055]];
  const positions = [], indices = [], segments = 12;
  rings.forEach(([y, r], j) => {
    for (let i = 0; i <= segments; i++) {
      const a = i / segments * 2 * PI, fold = i % 2 ? .61 : 1;
      positions.push(Math.cos(a) * r * fold, (y + (j === rings.length - 1 && i % 2 ? -.037 : 0)) * height, Math.sin(a) * r * fold);
      if (j && i) {
        const n = j * (segments + 1) + i;
        indices.push(n, n - 1, n - segments - 2, n, n - segments - 2, n - segments - 1);
      }
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(positions.length / 3 * 2), 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function makeUmbrellas(parent, decal, m) {
  const g = group(parent, [-1.6, .4, 1.1]); g.name = 'Umbrella stand';
  box(g, [0, .054, 0], [.562, .085, .328], C.darkTeal, { bevel: .024 });
  box(g, [0, .101, 0], [.493, .014, .264], C.ink, { bevel: .012 });
  wireRectangle(g, .53, .303, .422, .017, m.chrome);
  wireRectangle(g, .53, .303, .231, .010, m.chrome);
  for (const x of [-.251, .251]) for (const z of [-.139, .139]) {
    rod(g, [x, .062, z], [x, .421, z], .015, m.chrome);
    cylinder(g, [x, .014, z], .025, .027, .028, C.ink);
  }
  for (const x of [-.168, -.056, .056, .168]) {
    rod(g, [x, .099, .145], [x, .42, .145], .007, m.chrome);
    rod(g, [x, .099, -.145], [x, .42, -.145], .007, m.chrome);
  }
  decal(g, 'umbrella', [0, .265, .159], [.118, .118]);
  const umbrellas = [
    { x: -.171, z: .004, h: 1.01, tilt: .10, mat: m.umbrellaBlue, trim: C.blue },
    { x: .006, z: -.055, h: 1.14, tilt: -.05, mat: m.umbrellaTeal, trim: C.teal },
    { x: .174, z: .018, h: 1.025, tilt: -.13, mat: m.umbrellaCoral, trim: C.coral },
  ];
  umbrellas.forEach(u => {
    const handle = group(g, [u.x, .06, u.z], [.025, 0, u.tilt]);
    rod(handle, [0, .019, 0], [0, u.h + .037, 0], .009, m.chrome);
    cylinder(handle, [0, .046, 0], .012, .008, .071, C.ink);
    mesh(handle, closedCanopy(u.h), [0, 0, 0], u.mat, { shadow: false });
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * 2 * PI;
      tube(handle, [[.010 * Math.cos(a), .13 * u.h, .010 * Math.sin(a)],
        [.034 * Math.cos(a), .50 * u.h, .034 * Math.sin(a)],
        [.064 * Math.cos(a), .75 * u.h, .064 * Math.sin(a)],
        [.082 * Math.cos(a), .91 * u.h, .082 * Math.sin(a)]], .0028, C.paper);
    }
    cylinder(handle, [0, .545 * u.h, 0], .041, .041, .035, u.trim);
    sphere(handle, [.038, .545 * u.h, .012], .008, C.paper);
    tube(handle, [[0, u.h - .032, 0], [0, u.h + .075, 0], [.037, u.h + .121, 0],
      [.098, u.h + .108, 0], [.117, u.h + .066, 0], [.11, u.h + .018, 0]], .016, u.trim);
    sphere(handle, [.11, u.h + .018, 0], .017, u.trim);
  });
}

function makeRecycling(parent, decal, m) {
  const g = group(parent, [-4.8, .4, -1.4], [0, -.08, 0]); g.name = 'Sorted recycling';
  [-1, 1].forEach(side => {
    const bin = group(g, [side * .278, 0, side * .018], [0, side * .045, 0]);
    const lid = side < 0 ? C.teal : C.blue;
    box(bin, [0, .42, 0], [.463, .734, .491], C.cream, { bevel: .043, outline: true });
    box(bin, [0, .080, 0], [.479, .081, .506], C.darkTeal, { bevel: .02 });
    box(bin, [0, .801, 0], [.50, .119, .529], lid, { bevel: .034 });
    cylinder(bin, [0, .864, .021], .089, .089, .011, C.ink, { segments: 20 });
    torus(bin, [0, .871, .021], .096, .009, m.chrome, { rotation: [PI / 2, 0, 0] });
    box(bin, [0, .724, .254], [.261, .08, .022], C.ink, { bevel: .018 });
    box(bin, [0, .761, .276], [.28, .014, .043], lid, { bevel: .004 });
    decal(bin, side < 0 ? 'cans' : 'pet', [0, .478, .248], [.356, .230]);
    for (const x of [-.172, .172]) {
      box(bin, [x, .306, .247], [.011, .307, .009], C.white, { bevel: .003 });
      box(bin, [x, .777, -.26], [.053, .045, .051], C.metal, { bevel: .01 });
      cylinder(bin, [x, .067, -.17], .051, .051, .049, C.ink, { rotation: [0, 0, PI / 2] });
    }
    box(bin, [.239, .626, 0], [.022, .063, .161], lid, { bevel: .009 });
    box(bin, [-.239, .626, 0], [.022, .063, .161], lid, { bevel: .009 });
  });
}

function insulator(parent, pos, m, small = false) {
  const s = small ? .68 : 1;
  rod(parent, [pos[0], pos[1] - .025, pos[2]], [pos[0], pos[1] + .30 * s, pos[2]], .018 * s, C.metal);
  for (let i = 0; i < 4; i++) {
    cylinder(parent, [pos[0], pos[1] + (.037 + i * .056) * s, pos[2]], .056 * s, .071 * s, .036 * s, C.cream, { segments: 12 });
  }
  sphere(parent, [pos[0], pos[1] + .257 * s, pos[2]], .029 * s, m.chrome).scale.y = .55;
  return [pos[0], pos[1] + .288 * s, pos[2]];
}

function sagCable(parent, a, b, sag, radius = .014) {
  const points = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    return [THREE.MathUtils.lerp(a[0], b[0], t), THREE.MathUtils.lerp(a[1], b[1], t) - 4 * sag * t * (1 - t), THREE.MathUtils.lerp(a[2], b[2], t)];
  });
  return tube(parent, points, radius, C.ink);
}

function makePole(parent, config, decal, m) {
  const { x, z, ground, top, front } = config;
  const g = group(parent, [x, ground, z]); g.name = front ? 'Forward utility pole and streetlight' : 'Back alley utility pole';
  const shaft = top - ground - .36, crossY = shaft - .035;
  cylinder(g, [0, shaft / 2, 0], .103, .144, shaft, C.metal, { segments: 14 });
  cylinder(g, [0, .095, 0], .171, .184, .19, C.darkTeal, { segments: 12 });
  cylinder(g, [0, shaft - .031, 0], .113, .113, .051, C.ink);
  for (const y of [.97, 2.16, shaft - 1.55, shaft - .85]) cylinder(g, [0, y, 0], .146 - y * .005, .146 - y * .005, .052, C.ink);
  cylinder(g, [0, .556, 0], .148, .148, .652, C.ink);
  for (const y of [.337, .521, .705]) cylinder(g, [0, y, 0], .150, .150, .086, C.yellow);
  box(g, [.036, 1.746, .128], [.172, .557, .021], C.paper, { bevel: .009 });
  decal(g, 'pole', [.036, 1.746, .141], [.150, .50]);
  for (let i = 0; i < 6; i++) {
    const sign = i % 2 ? 1 : -1, y = 2.18 + i * .39;
    tube(g, [[sign * .095, y, -.06], [sign * .19, y, -.06], [sign * .195, y + .09, -.06]], .012, C.metal);
  }
  const dx = .562, dz = -.827;
  box(g, [0, crossY, 0], [1.63, .104, .131], C.darkTeal, { rotation: [0, Math.atan2(-dz, dx), 0], bevel: .01 });
  for (const side of [-1, 1]) rod(g, [0, crossY - .44, 0], [dx * .58 * side, crossY - .026, dz * .58 * side], .022, C.metal);
  const endpoints = [-.64, 0, .64].map(offset => {
    const pin = insulator(g, [dx * offset, crossY + .069, dz * offset], m);
    return [pin[0] + x, pin[1] + ground, pin[2] + z];
  });

  const transformerY = shaft - .99;
  box(g, [0, transformerY - .3, -.083], [front ? .95 : .64, .079, .182], C.darkTeal);
  const cans = front ? [-.282, .294] : [-.258];
  cans.forEach((tx, index) => {
    const tz = -.134;
    cylinder(g, [tx, transformerY, tz], .179, .165, .742, C.cream, { segments: 16 });
    cylinder(g, [tx, transformerY + .389, tz], .197, .197, .055, C.metal, { segments: 16 });
    cylinder(g, [tx, transformerY - .369, tz], .176, .176, .046, C.metal, { segments: 16 });
    for (const y of [-.24, .21]) torus(g, [tx, transformerY + y, tz], .176, .012, C.metal, { rotation: [PI / 2, 0, 0] });
    box(g, [tx, transformerY - .032, tz + .18], [.12, .119, .008], C.darkTeal, { bevel: .008 });
    const pin = insulator(g, [tx, transformerY + .43, tz], m, true);
    const target = endpoints[index * 2];
    tube(g, [pin, [tx + .09, pin[1] + .17, tz], [target[0] - x, target[1] - ground - .15, target[2] - z],
      [target[0] - x, target[1] - ground, target[2] - z]], .010, C.ink);
    rod(g, [tx, transformerY - .22, -.15], [0, transformerY - .22, .018], .025, C.darkTeal);
  });
  tube(g, [[.106, transformerY + .17, -.038], [.158, transformerY - .37, -.04], [.152, 3.30, -.036], [.14, 2.22, -.036]], .012, C.ink);
  box(g, [.061, 2.754, .14], [.219, .31, .141], C.darkTeal, { bevel: .018 });
  box(g, [.061, 2.754, .216], [.175, .256, .012], C.metal, { bevel: .006 });
  bolt(g, [.114, 2.75, .229], .012);

  if (front) {
    const lampY = 5.6 - ground;
    tube(g, [[.069, lampY - .262, .035], [.253, lampY + .002, .092], [.70, lampY + .093, .252], [1.236, lampY + .048, .45]], .042, C.darkTeal);
    rod(g, [.082, lampY - .40, .017], [.657, lampY + .060, .239], .018, C.metal);
    box(g, [1.245, lampY + .011, .452], [.554, .129, .303], C.cream, { bevel: .055, rotation: [0, -.34, -.035] });
    box(g, [1.245, lampY + .069, .452], [.575, .027, .326], C.darkTeal, { bevel: .012, rotation: [0, -.34, -.035] });
    box(g, [1.245, lampY - .061, .452], [.402, .031, .223], m.amberGlow, { bevel: .014, rotation: [0, -.34, 0], shadow: false });
    light(g, [1.245, lampY - .15, .452], '#ffcd91', 9, 6.5);
    halo(g, [1.245, lampY - .113, .452], '#ffc889', 1.25, .24);
  }
  return { endpoints, g, shaft };
}

function makeUtilities(parent, decal, m) {
  const front = makePole(parent, { x: 4.3, z: 2, ground: .4, top: 7, front: true }, decal, m);
  const back = makePole(parent, { x: -5.7, z: -4.8, ground: .07, top: 6.4, front: false }, decal, m);
  for (let i = 0; i < 3; i++) sagCable(parent, front.endpoints[i], back.endpoints[i], .72 + i * .075, .014);
  // A short service drop terminates on the shop's upper back corner, not outside the plinth.
  sagCable(parent, [-5.58, 5.05, -4.70], [-3.79, 3.96, -4.53], .24, .012);
  rod(parent, [-3.9, 3.91, -4.53], [-3.79, 3.96, -4.53], .029, C.darkTeal);
  insulator(parent, [-3.8, 3.80, -4.53], m, true);
}

function makeTraffic(parent, decal, m) {
  const g = group(parent, [5.9, .07, -3.6], [0, .24, 0]); g.name = 'Neighborhood signal';
  cylinder(g, [0, 1.706, 0], .050, .067, 3.39, C.darkTeal, { segments: 12 });
  box(g, [0, .039, 0], [.241, .077, .237], C.metal, { bevel: .012 });
  for (const x of [-.084, .084]) for (const z of [-.084, .084]) cylinder(g, [x, .086, z], .017, .017, .02, C.ink, { segments: 6 });
  rod(g, [0, 3.255, 0], [-.272, 3.255, .109], .04, C.metal);
  const head = group(g, [-.265, 3.283, .101]);
  box(head, [0, 0, 0], [1.165, .386, .264], C.cream, { bevel: .069, outline: true });
  box(head, [0, 0, .143], [1.084, .307, .024], C.darkTeal, { bevel: .035 });
  for (const x of [-.516, .516]) for (const y of [-.132, .132]) bolt(head, [x, y, .161], .013);
  const hues = ['#6cf0ba', '#ffca67', '#f66d65'];
  const lenses = hues.map((color, i) => {
    const x = (i - 1) * .354;
    cylinder(head, [x, 0, .176], .117, .117, .04, C.ink, { rotation: [PI / 2, 0, 0], segments: 20 });
    torus(head, [x, 0, .205], .101, .012, C.metal);
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(.19), emissive: color, emissiveIntensity: .02, roughness: .33 });
    const lens = sphere(head, [x, 0, .213], .086, mat, { shadow: false });
    lens.scale.z = .28; lens.userData.dynamic = true;
    // A half-cylinder hood projects over each lens; the open bottom keeps it readable.
    mesh(head, new THREE.CylinderGeometry(.123, .123, .164, 16, 1, true, PI / 2, PI), [x, 0, .229], m.hood, { rotation: [PI / 2, 0, 0] });
    for (const y of [-.035, 0, .035]) box(head, [x, y, .239], [.121, .0025, .002], m.lensRibs, { shadow: false });
    return mat;
  });
  for (const y of [-.07, 0, .07]) box(head, [0, y, -.136], [.58, .016, .008], C.darkTeal);
  for (const y of [2.415, 2.615]) {
    cylinder(g, [0, y, 0], .071, .071, .041, C.metal);
    rod(g, [-.47, y, .07], [.40, y, .07], .015, C.metal);
  }
  box(g, [-.052, 2.525, .114], [1.163, .365, .055], C.blue, { bevel: .019 });
  decal(g, 'street', [-.052, 2.525, .144], [1.125, .281]);
  for (const x of [-.588, .484]) bolt(g, [x, 2.525, .147], .011);
  const update = (time = 0) => {
    const t = Number.isFinite(time) ? time : 0;
    const phase = ((t + 4) % 24 + 24) % 24;
    const active = phase < 10 ? 0 : phase < 12.5 ? 1 : 2;
    const start = [0, 10, 12.5][active];
    const blend = THREE.MathUtils.smoothstep(phase, start, start + .32);
    const previous = (active + 2) % 3;
    lenses.forEach((mat, i) => {
      const amount = i === active ? blend : i === previous ? 1 - blend : 0;
      mat.emissiveIntensity = .024 + amount * (2.15 + .055 * Math.sin(t * 1.8));
    });
  };
  update(0);
  return update;
}

function makeBarriers(parent) {
  const configurations = [[4.8, .4, PI / 2], [3.8, 3, 0]];
  configurations.forEach(([x, z, rotation]) => {
    const g = group(parent, [x, .07, z], [0, rotation, 0]); g.name = 'Weathered corner barrier';
    tube(g, [[-.47, .018, 0], [-.47, .53, 0], [-.437, .635, 0], [-.338, .685, 0],
      [.338, .685, 0], [.437, .635, 0], [.47, .53, 0], [.47, .018, 0]], .039, C.cream);
    for (const side of [-1, 1]) {
      cylinder(g, [side * .47, .017, 0], .078, .085, .034, C.metal);
      for (const y of [.363, .445]) cylinder(g, [side * .47, y, 0], .0405, .0405, .048, C.orange);
      box(g, [side * .468, .164, .039], [.021, .061, .003], RUST, { rotation: [0, 0, side * .17] });
      box(g, [side * .475, .275, .039], [.028, .014, .003], C.metal, { rotation: [0, 0, -.24] });
      box(g, [side * .462, .57, .037], [.015, .028, .004], RUST);
    }
    for (const xChip of [-.251, .146]) box(g, [xChip, .681, .038], [.052, .009, .003], C.metal, { rotation: [0, 0, -.06] });
  });
}

function makeMailbox(parent, decal) {
  const g = group(parent, [-5.1, .4, 1.94], [0, -.065, 0]); g.name = 'Red Japanese postbox';
  cylinder(g, [0, .041, 0], .136, .159, .082, C.metal);
  cylinder(g, [0, .408, 0], .061, .073, .75, RUST);
  cylinder(g, [0, .155, 0], .075, .075, .107, C.coral);
  box(g, [0, .99, 0], [.473, .641, .346], RUST, { bevel: .028, outline: true });
  box(g, [0, 1.319, .005], [.524, .086, .402], RUST, { bevel: .036 });
  box(g, [0, 1.184, .181], [.331, .043, .023], C.ink, { bevel: .008 });
  box(g, [0, 1.218, .206], [.365, .026, .082], C.coral, { bevel: .008, rotation: [-.1, 0, 0] });
  box(g, [0, .935, .177], [.403, .433, .012], RUST, { outline: true });
  decal(g, 'post', [-.033, 1.004, .188], [.234, .213]);
  decal(g, 'collection', [-.020, .797, .188], [.242, .105]);
  decal(g, 'post', [.239, 1.009, .006], [.225, .245], [0, PI / 2, 0]);
  for (const y of [.788, 1.07]) box(g, [-.216, y, .177], [.025, .075, .026], C.coral, { bevel: .005 });
  cylinder(g, [.151, .938, .194], .021, .021, .013, C.metal, { rotation: [PI / 2, 0, 0] });
  box(g, [.151, .938, .203], [.004, .019, .004], C.ink);
  for (const x of [-.20, .196]) box(g, [x, .716, .176], [.035, .011, .009], C.coral, { rotation: [0, 0, x] });
}

function makeShrub(parent, pos, color, seed) {
  const g = group(parent, pos); g.name = 'Potted alley shrub';
  const random = rng(seed);
  cylinder(g, [0, .026, 0], .294, .306, .052, color, { segments: 16 });
  cylinder(g, [0, .202, 0], .26, .19, .337, color, { segments: 16 });
  cylinder(g, [0, .36, 0], .278, .275, .071, color, { segments: 16 });
  cylinder(g, [0, .399, 0], .237, .237, .012, C.ink, { segments: 16 });
  torus(g, [0, .398, 0], .255, .019, C.cream, { rotation: [PI / 2, 0, 0] });
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * PI * 2;
    rod(g, [Math.cos(a) * .205, .08, Math.sin(a) * .205], [Math.cos(a) * .254, .334, Math.sin(a) * .254], .009, color);
  }
  rod(g, [0, .39, 0], [.017, .907, -.009], .025, RUST);
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, r = i === 8 ? .04 : .10 + random() * .10;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const y = .67 + random() * .27 + (i === 8 ? .14 : 0);
    rod(g, [0, .56, 0], [x, y, z], .012, RUST);
    const clump = mesh(g, new THREE.IcosahedronGeometry(.155 + random() * .045, 1), [x, y, z], LEAVES[i % 3]);
    clump.scale.set(1.15, .78 + random() * .3, 1);
    clump.rotation.set(random(), a, random());
  }
  for (let i = 0; i < 12; i++) {
    const a = i * 2.4, r = .21 + random() * .055;
    const leaf = sphere(g, [Math.cos(a) * r, .77 + random() * .25, Math.sin(a) * r], .063, LEAVES[(i + 1) % 3]);
    leaf.scale.set(1.25, .28, .68); leaf.rotation.set(.28, -a, .35);
  }
  for (const x of [-.098, .09]) sphere(g, [x, .414, .074], .022, C.metal).scale.y = .6;
}

function makeParking(parent, decal) {
  const g = group(parent, [-5.1, .07, 4.4], [0, -.08, 0]); g.name = 'Small customer parking sign';
  box(g, [0, .046, 0], [.282, .092, .269], C.cream, { bevel: .022 });
  cylinder(g, [0, .722, 0], .034, .045, 1.40, C.metal);
  for (const y of [1.126, 1.526]) box(g, [0, y, -.043], [.276, .032, .029], C.darkTeal);
  box(g, [0, 1.351, .02], [.584, .755, .055], C.darkTeal, { bevel: .028 });
  box(g, [0, 1.351, .051], [.557, .726, .012], C.paper, { bevel: .014 });
  decal(g, 'parking', [0, 1.351, .059], [.52, .67]);
  for (const y of [1.018, 1.683]) bolt(g, [0, y, .062], .011);
  box(g, [.20, 1.002, .059], [.043, .009, .003], RUST, { rotation: [0, 0, -.11] });
}

export function buildProps(parent) {
  const root = group(parent); root.name = 'Rainy Japanese street props';
  const decal = makeDecals();
  const m = {
    chrome: material(C.metal, { standard: true, roughness: .37, metalness: .55 }),
    coolGlow: material('#c0eee0', { emissive: '#a5e0d4', intensity: .85 }),
    amberGlow: material('#ffe3aa', { emissive: '#ffd590', intensity: 2.1 }),
    vendGlass: material('#9bdad3', { opacity: .115, standard: true, roughness: .18 }),
    glassGlint: material(C.paper, { opacity: .26 }),
    umbrellaBlue: material(C.blue, { opacity: .47, side: THREE.DoubleSide, standard: true, roughness: .42 }),
    umbrellaTeal: material(C.teal, { opacity: .46, side: THREE.DoubleSide, standard: true, roughness: .42 }),
    umbrellaCoral: material(C.coral, { opacity: .49, side: THREE.DoubleSide, standard: true, roughness: .42 }),
    hood: material(C.darkTeal, { side: THREE.DoubleSide }),
    lensRibs: material(C.ink, { opacity: .22 }),
  };
  makeVending(root, decal, m);
  makeBicycle(root, decal, m);
  makeUmbrellas(root, decal, m);
  makeRecycling(root, decal, m);
  makeUtilities(root, decal, m);
  const update = makeTraffic(root, decal, m);
  makeBarriers(root);
  makeMailbox(root, decal);
  makeShrub(root, [-4.7, .4, -3.6], C.coral, 87);
  makeShrub(root, [3.85, .4, -4.5], C.cream, 143);
  makeParking(root, decal);
  return { update };
}
