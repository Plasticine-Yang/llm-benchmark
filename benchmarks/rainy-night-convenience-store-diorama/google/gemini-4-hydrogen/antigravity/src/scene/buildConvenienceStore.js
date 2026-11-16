import * as THREE from 'three';
import {
  createCelMaterial,
  createCelMesh,
  createCanvasTexture,
  addOutline,
} from '../utils/toonFactory.js';

function createStoreTextures() {
  // 1. Exterior cream-beige Japanese Konbini wall tile texture
  const wallTileTex = createCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#ddd3c4';
      ctx.fillRect(0, 0, w, h);

      const cols = 12;
      const rows = 20;
      const cw = w / cols;
      const ch = h / rows;

      for (let r = 0; r < rows; r++) {
        const offset = (r % 2) * (cw * 0.5);
        for (let c = -1; c <= cols; c++) {
          const shade = ((r * 7 + c * 13) % 5) * 3;
          ctx.fillStyle = `rgb(${216 + shade}, ${206 + shade}, ${191 + shade})`;
          ctx.fillRect(c * cw + offset + 2, r * ch + 2, cw - 4, ch - 4);
        }
      }
    },
    { repeat: [2, 2] }
  );

  // 2. Iconic 3-stripe backlit Konbini Fascia Signboard Texture
  const makeFasciaTex = (withTitle = true) =>
    createCanvasTexture(1024, 256, (ctx, w, h) => {
      // Creamy illuminated milk-glass backdrop
      ctx.fillStyle = '#fff9eb';
      ctx.fillRect(0, 0, w, h);

      // Classic Japanese 3-stripe Konbini motif
      ctx.fillStyle = '#ff8438'; // tangerine top stripe
      ctx.fillRect(0, 18, w, 26);

      ctx.fillStyle = '#22b573'; // emerald middle stripe
      ctx.fillRect(0, 52, w, 30);

      ctx.fillStyle = '#38a3ff'; // sky blue bottom stripe
      ctx.fillRect(0, h - 42, w, 26);

      if (withTitle) {
        // Left circular "24" badge
        ctx.save();
        ctx.translate(140, h * 0.54);
        ctx.fillStyle = '#22b573';
        ctx.beginPath();
        ctx.arc(0, 0, 54, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#182036';
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 46px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('24', 0, 3);
        ctx.restore();

        // Store name in crisp anime-clean typography
        ctx.fillStyle = '#19223b';
        ctx.font = 'bold 62px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SORA MART', w * 0.56, h * 0.49);

        ctx.fillStyle = '#228e5c';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('ほしぞらマート  24時間営業', w * 0.56, h * 0.72);
      }

      // Subtle dark outline border
      ctx.strokeStyle = '#181e33';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, w - 8, h - 8);
    });

  const fasciaMainTex = makeFasciaTex(true);
  const fasciaSideTex = makeFasciaTex(true);

  const badge24Tex = createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#fff5dc';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#22b573';
    ctx.fillRect(0, 0, w, 36);
    ctx.fillStyle = '#ff8438';
    ctx.fillRect(0, h - 36, w, 36);
    ctx.fillStyle = '#172038';
    ctx.font = 'bold 78px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('24h', w * 0.5, h * 0.44);
    ctx.fillStyle = '#e65a28';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('OPEN', w * 0.5, h * 0.71);
    ctx.strokeStyle = '#181e33';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, w - 10, h - 10);
  });

  return { wallTileTex, fasciaMainTex, fasciaSideTex, badge24Tex };
}

/**
 * Custom animated glass shader with Fresnel sheen + vertical rain droplets sliding down glass.
 */
function createRainGlassMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      float rainDropLayer(vec2 coord, float t, float seedShift) {
        vec2 st = coord;
        float colId = floor(st.x);
        float h = fract(sin((colId + seedShift) * 127.1) * 43758.5453);
        float speed = 0.55 + h * 0.65;

        // Slight organic horizontal wobble as drop slides down glass
        float wobble = sin(st.y * 5.0 + h * 6.28) * 0.08;
        float x = fract(st.x) - 0.5 + wobble;

        float yScroll = st.y + t * speed + h * 13.7;
        float cellY = floor(yScroll);
        float hCell = fract(sin(dot(vec2(colId, cellY), vec2(41.3, 289.1))) * 43758.5453);
        float fy = fract(yScroll) - 0.5;

        // Droplet head + trailing thin wetness streak
        float activeDrop = step(0.32, hCell);
        float head = smoothstep(0.16, 0.02, length(vec2(x * 2.1, fy * 0.9))) * activeDrop;
        float trail = smoothstep(0.06, 0.0, abs(x)) * smoothstep(0.48, -0.25, fy) * smoothstep(-0.42, -0.05, fy) * 0.45 * activeDrop;
        return clamp(head + trail, 0.0, 1.0);
      }

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - abs(dot(normalize(vWorldNormal), viewDir)), 2.4);

        vec2 glassUv = vec2(vWorldPos.x + vWorldPos.z, vWorldPos.y);
        float d1 = rainDropLayer(glassUv * vec2(6.5, 2.2), uTime, 1.0);
        float d2 = rainDropLayer(glassUv * vec2(11.0, 3.6) + vec2(3.1, 0.7), uTime * 1.15, 7.3);
        float drops = clamp(d1 + d2 * 0.75, 0.0, 1.0);

        // Clean anime pale cyan-indigo glass sheen + glistening rain droplets
        vec3 glassCol = mix(vec3(0.55, 0.76, 0.96), vec3(0.86, 0.95, 1.0), fresnel);
        glassCol = mix(glassCol, vec3(0.95, 0.99, 1.0), drops * 0.85);

        float alpha = 0.09 + fresnel * 0.22 + drops * 0.34;
        gl_FragColor = vec4(glassCol, clamp(alpha, 0.0, 0.65));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

export function buildConvenienceStore() {
  const group = new THREE.Group();
  group.name = 'ConvenienceStore';
  const tex = createStoreTextures();

  const wallMat = createCelMaterial({
    color: 0xf4ede2,
    map: tex.wallTileTex,
    rimColor: 0x8bc0ff,
    rimStrength: 0.18,
    shadowTint: 0x262f54,
    shadowTintStrength: 0.42,
    wetness: 0.14,
  });

  const frameMat = createCelMaterial({
    color: 0x29324a,
    rimColor: 0x8dc2ff,
    rimStrength: 0.28,
    wetness: 0.35,
  });

  const canopyRoofMat = createCelMaterial({
    color: 0x384361,
    rimColor: 0x8cc2ff,
    rimStrength: 0.24,
    wetness: 0.45,
  });

  const roofMembraneMat = createCelMaterial({
    color: 0x2f3852,
    rimColor: 0x7ab4ff,
    rimStrength: 0.16,
    wetness: 0.42,
  });

  const glassMat = createRainGlassMaterial();

  // --- 1. Structural Walls ---
  // Left wall (X = -5.52, Z: -5.80..1.00, Y: 0.14..4.14)
  const leftWall = createCelMesh(new THREE.BoxGeometry(0.16, 4.0, 6.8), wallMat, {
    outline: true,
    outlineThickness: 1.6,
    crease: true,
  });
  leftWall.position.set(-5.52, 2.14, -2.40);
  group.add(leftWall);

  // Back wall (Z = -5.72, X: -5.60..2.00, Y: 0.14..4.14)
  const backWall = createCelMesh(new THREE.BoxGeometry(7.6, 4.0, 0.16), wallMat, {
    outline: true,
    outlineThickness: 1.6,
    crease: true,
  });
  backWall.position.set(-1.80, 2.14, -5.72);
  group.add(backWall);

  // Right solid wall portion (X = 1.92, Z: -5.80..-1.76, Y: 0.14..4.14)
  const rightSolidWall = createCelMesh(new THREE.BoxGeometry(0.16, 4.0, 4.04), wallMat, {
    outline: true,
    outlineThickness: 1.6,
    crease: true,
  });
  rightSolidWall.position.set(1.92, 2.14, -3.78);
  group.add(rightSolidWall);

  // Front low window sill (Z = 0.92, X: -5.44..-0.78, Y: 0.14..0.52)
  const frontSill = createCelMesh(new THREE.BoxGeometry(4.66, 0.38, 0.16), wallMat, {
    outline: true,
    outlineThickness: 1.4,
    crease: true,
  });
  frontSill.position.set(-3.11, 0.33, 0.92);
  group.add(frontSill);

  // Front right narrow sill (Z = 0.92, X: 1.18..1.98, Y: 0.14..0.52)
  const frontRightSill = createCelMesh(new THREE.BoxGeometry(0.80, 0.38, 0.16), wallMat, {
    outline: true,
    outlineThickness: 1.3,
  });
  frontRightSill.position.set(1.58, 0.33, 0.92);
  group.add(frontRightSill);

  // Right corner window sill (X = 1.92, Z: -1.76..0.98, Y: 0.14..0.52)
  const rightSill = createCelMesh(new THREE.BoxGeometry(0.16, 0.38, 2.74), wallMat, {
    outline: true,
    outlineThickness: 1.4,
    crease: true,
  });
  rightSill.position.set(1.92, 0.33, -0.39);
  group.add(rightSill);

  // Upper facade spandrel beams above windows (Y: 2.94..4.14)
  const frontUpperWall = createCelMesh(new THREE.BoxGeometry(7.6, 1.2, 0.18), wallMat, {
    outline: true,
    outlineThickness: 1.5,
  });
  frontUpperWall.position.set(-1.80, 3.54, 0.92);
  const rightUpperWall = createCelMesh(new THREE.BoxGeometry(0.18, 1.2, 2.86), wallMat, {
    outline: true,
    outlineThickness: 1.5,
  });
  rightUpperWall.position.set(1.92, 3.54, -0.36);
  group.add(frontUpperWall, rightUpperWall);

  // Aluminum window mullions & corner post
  const cornerPost = createCelMesh(new THREE.BoxGeometry(0.18, 2.84, 0.18), frameMat, {
    outline: true,
    outlineThickness: 1.3,
  });
  cornerPost.position.set(1.92, 1.56, 0.92);
  group.add(cornerPost);

  [-5.44, -3.90, -2.35, -0.80, 1.18].forEach((mx) => {
    const mullion = createCelMesh(new THREE.BoxGeometry(0.08, 2.46, 0.12), frameMat, {
      outline: true,
      outlineThickness: 1.1,
    });
    mullion.position.set(mx, 1.73, 0.92);
    group.add(mullion);
  });

  [-1.76, -0.40].forEach((mz) => {
    const mullion = createCelMesh(new THREE.BoxGeometry(0.12, 2.46, 0.08), frameMat, {
      outline: true,
      outlineThickness: 1.1,
    });
    mullion.position.set(1.92, 1.73, mz);
    group.add(mullion);
  });

  // --- 2. Panoramic Rain-Slide Glass Curtain Windows ---
  const frontGlassMain = new THREE.Mesh(new THREE.PlaneGeometry(4.62, 2.40), glassMat);
  frontGlassMain.position.set(-3.12, 1.72, 0.93);
  frontGlassMain.renderOrder = 3;

  const frontGlassRight = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 2.40), glassMat);
  frontGlassRight.position.set(1.52, 1.72, 0.93);
  frontGlassRight.renderOrder = 3;

  const rightGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.68, 2.40), glassMat);
  rightGlass.rotation.y = Math.PI / 2;
  rightGlass.position.set(1.93, 1.72, -0.42);
  rightGlass.renderOrder = 3;

  group.add(frontGlassMain, frontGlassRight, rightGlass);

  // --- 3. Animated Automatic Sliding Double Doors (自动门) ---
  // Opening spans X in [-0.76, +1.14] (1.90m wide), Y in [0.16, 2.68]
  const doorHeader = createCelMesh(new THREE.BoxGeometry(2.06, 0.26, 0.20), frameMat, {
    outline: true,
    outlineThickness: 1.3,
    crease: true,
  });
  doorHeader.position.set(0.19, 2.81, 0.92);
  group.add(doorHeader);

  // Motion sensor module & status LED above door
  const sensorBox = createCelMesh(new THREE.BoxGeometry(0.24, 0.08, 0.10), frameMat, {
    outline: true,
    outlineThickness: 1.0,
  });
  sensorBox.position.set(0.19, 2.84, 1.04);
  const sensorLedMat = new THREE.MeshBasicMaterial({ color: 0xff5a4a });
  const sensorLed = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), sensorLedMat);
  sensorLed.position.set(0.19, 2.84, 1.10);
  group.add(sensorBox, sensorLed);

  const buildDoorLeaf = (width) => {
    const leaf = new THREE.Group();
    const stileW = 0.055;
    const height = 2.48;

    const topBar = createCelMesh(new THREE.BoxGeometry(width, 0.08, 0.05), frameMat, {
      outline: true,
      outlineThickness: 1.0,
    });
    topBar.position.y = height - 0.04;
    const botBar = createCelMesh(new THREE.BoxGeometry(width, 0.14, 0.05), frameMat, {
      outline: true,
      outlineThickness: 1.0,
    });
    botBar.position.y = 0.07;

    const leftStile = createCelMesh(new THREE.BoxGeometry(stileW, height, 0.05), frameMat, {
      outline: true,
      outlineThickness: 1.0,
    });
    leftStile.position.set(-width * 0.5 + stileW * 0.5, height * 0.5, 0);
    const rightStile = createCelMesh(new THREE.BoxGeometry(stileW, height, 0.05), frameMat, {
      outline: true,
      outlineThickness: 1.0,
    });
    rightStile.position.set(width * 0.5 - stileW * 0.5, height * 0.5, 0);

    // Classic green/orange konbini safety decal stripe across glass at waist height
    const safetyBand = new THREE.Mesh(
      new THREE.BoxGeometry(width - stileW * 2, 0.055, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x22b573 })
    );
    safetyBand.position.set(0, 1.04, 0);

    const pane = new THREE.Mesh(
      new THREE.PlaneGeometry(width - stileW * 2, height - 0.22),
      glassMat
    );
    pane.position.set(0, height * 0.5 + 0.03, 0);
    pane.renderOrder = 3;

    leaf.add(topBar, botBar, leftStile, rightStile, safetyBand, pane);
    return leaf;
  };

  const leftDoorLeaf = buildDoorLeaf(0.95);
  const leftClosedX = -0.285;
  leftDoorLeaf.position.set(leftClosedX, 0.16, 0.90);

  const rightDoorLeaf = buildDoorLeaf(0.95);
  const rightClosedX = 0.665;
  rightDoorLeaf.position.set(rightClosedX, 0.16, 0.90);

  group.add(leftDoorLeaf, rightDoorLeaf);

  // --- 4. Illuminated Konbini Fascia Signboard (便利店招牌) ---
  const fasciaGroup = new THREE.Group();
  const frontFascia = new THREE.Mesh(
    new THREE.BoxGeometry(7.68, 0.78, 0.12),
    [
      new THREE.MeshBasicMaterial({ color: 0xfff8e6 }),
      new THREE.MeshBasicMaterial({ color: 0xfff8e6 }),
      new THREE.MeshBasicMaterial({ color: 0x262f48 }),
      new THREE.MeshBasicMaterial({ color: 0x262f48 }),
      new THREE.MeshBasicMaterial({ map: tex.fasciaMainTex }),
      new THREE.MeshBasicMaterial({ color: 0x262f48 }),
    ]
  );
  frontFascia.position.set(-1.80, 3.66, 1.05);
  addOutline(frontFascia, 1.45, 0x13172c);

  const rightFascia = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.78, 6.76),
    [
      new THREE.MeshBasicMaterial({ map: tex.fasciaSideTex }),
      new THREE.MeshBasicMaterial({ color: 0x262f48 }),
      new THREE.MeshBasicMaterial({ color: 0x262f48 }),
      new THREE.MeshBasicMaterial({ color: 0x262f48 }),
      new THREE.MeshBasicMaterial({ color: 0xfff8e6 }),
      new THREE.MeshBasicMaterial({ color: 0xfff8e6 }),
    ]
  );
  rightFascia.position.set(2.05, 3.66, -2.44);
  addOutline(rightFascia, 1.45, 0x13172c);

  const cornerFasciaCap = createCelMesh(new THREE.BoxGeometry(0.18, 0.80, 0.18), frameMat, {
    outline: true,
    outlineThickness: 1.35,
  });
  cornerFasciaCap.position.set(2.04, 3.66, 1.04);

  // Small projecting glowing "24h OPEN" side blade lightbox (with gentle organic flicker!)
  const sideBladeFrame = createCelMesh(new THREE.BoxGeometry(0.08, 0.66, 0.56), frameMat, {
    outline: true,
    outlineThickness: 1.2,
  });
  sideBladeFrame.position.set(2.36, 3.55, -1.35);
  const sideBladeMat = new THREE.MeshBasicMaterial({ map: tex.badge24Tex, color: 0xffffff });
  const sideBladeFaceF = new THREE.Mesh(new THREE.PlaneGeometry(0.50, 0.58), sideBladeMat);
  sideBladeFaceF.rotation.y = Math.PI / 2;
  sideBladeFaceF.position.set(2.405, 3.55, -1.35);
  const sideBladeFaceB = sideBladeFaceF.clone();
  sideBladeFaceB.rotation.y = -Math.PI / 2;
  sideBladeFaceB.position.x = 2.315;
  // Bracket arms connecting blade sign to wall
  const bladeBracket = createCelMesh(new THREE.BoxGeometry(0.32, 0.08, 0.08), frameMat, {
    outline: false,
  });
  bladeBracket.position.set(2.14, 3.55, -1.35);

  fasciaGroup.add(
    frontFascia,
    rightFascia,
    cornerFasciaCap,
    sideBladeFrame,
    sideBladeFaceF,
    sideBladeFaceB,
    bladeBracket
  );
  group.add(fasciaGroup);

  // --- 5. Wraparound Storefront Awning / Canopy (屋檐雨棚) ---
  const awningGroup = new THREE.Group();
  // Front canopy slab (X: -5.72..2.84, Z: 0.98..2.24)
  const frontAwning = createCelMesh(new THREE.BoxGeometry(8.56, 0.14, 1.26), canopyRoofMat, {
    outline: true,
    outlineThickness: 1.45,
    crease: true,
  });
  frontAwning.position.set(-1.44, 3.04, 1.61);
  frontAwning.rotation.x = 0.05;

  // Right corner wrap canopy slab (X: 1.98..2.84, Z: -1.86..1.04)
  const rightAwning = createCelMesh(new THREE.BoxGeometry(0.86, 0.14, 2.90), canopyRoofMat, {
    outline: true,
    outlineThickness: 1.4,
    crease: true,
  });
  rightAwning.position.set(2.41, 3.04, -0.41);
  rightAwning.rotation.z = -0.05;

  // Diagonal steel tie-rods holding awning to facade
  [-4.6, -1.8, 0.9].forEach((rx) => {
    const rod = createCelMesh(new THREE.CylinderGeometry(0.018, 0.018, 1.18, 8), frameMat, {
      outline: false,
    });
    rod.position.set(rx, 3.45, 1.56);
    rod.rotation.x = -0.78;
    awningGroup.add(rod);
  });

  // Warm recessed under-canopy soffit downlights
  const soffitLightMat = new THREE.MeshBasicMaterial({ color: 0xffe8bd });
  [
    { x: -3.6, z: 1.58 },
    { x: -1.4, z: 1.58 },
    { x: 0.25, z: 1.58 },
    { x: 1.75, z: 1.58 },
    { x: 2.38, z: -0.35 },
  ].forEach((lp) => {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 12), soffitLightMat);
    disc.position.set(lp.x, 2.95, lp.z);
    awningGroup.add(disc);
  });

  awningGroup.add(frontAwning, rightAwning);
  group.add(awningGroup);

  // Exact world-space awning drip coordinates along front & side rain lips!
  const dripAnchors = [
    new THREE.Vector3(-5.1, 2.93, 2.22),
    new THREE.Vector3(-4.1, 2.93, 2.22),
    new THREE.Vector3(-3.0, 2.93, 2.22),
    new THREE.Vector3(-1.9, 2.93, 2.22),
    new THREE.Vector3(-0.7, 2.93, 2.22),
    new THREE.Vector3(0.45, 2.93, 2.22),
    new THREE.Vector3(1.55, 2.93, 2.22),
    new THREE.Vector3(2.65, 2.93, 2.22),
    new THREE.Vector3(2.82, 2.93, 1.15),
    new THREE.Vector3(2.82, 2.93, -0.05),
    new THREE.Vector3(2.82, 2.93, -1.25),
  ];

  // --- 6. Rooftop Parapet, Waterproof Deck & HVAC Chiller Equipment ---
  const roofDeck = createCelMesh(new THREE.BoxGeometry(7.52, 0.14, 6.72), roofMembraneMat, {
    outline: false,
    castShadow: false,
  });
  roofDeck.position.set(-1.80, 3.24, -2.40);
  group.add(roofDeck);

  // Parapet coping trim capping the roof edges
  const copingMat = createCelMaterial({ color: 0x5c6887, rimStrength: 0.2, wetness: 0.3 });
  [
    { w: 7.72, d: 0.22, x: -1.80, z: 0.98 },
    { w: 7.72, d: 0.22, x: -1.80, z: -5.78 },
    { w: 0.22, d: 6.76, x: -5.58, z: -2.40 },
    { w: 0.22, d: 6.76, x: 1.98, z: -2.40 },
  ].forEach((c) => {
    const cap = createCelMesh(new THREE.BoxGeometry(c.w, 0.12, c.d), copingMat, {
      outline: true,
      outlineThickness: 1.3,
    });
    cap.position.set(c.x, 4.18, c.z);
    group.add(cap);
  });

  // Rooftop Commercial HVAC Unit + Sheet-Metal Vent Ducts
  const hvacMat = createCelMaterial({ color: 0x8d99b3, rimColor: 0xb6d6ff, rimStrength: 0.25, wetness: 0.35 });
  const hvacBody = createCelMesh(new THREE.BoxGeometry(1.75, 0.88, 1.12), hvacMat, {
    outline: true,
    outlineThickness: 1.4,
    crease: true,
  });
  hvacBody.position.set(-3.1, 3.74, -3.5);
  group.add(hvacBody);

  // Twin rooftop fan shrouds
  const fanShroudMat = createCelMaterial({ color: 0x323b54, rimStrength: 0.2 });
  [-3.52, -2.68].forEach((fx) => {
    const shroud = createCelMesh(new THREE.CylinderGeometry(0.32, 0.34, 0.12, 16), fanShroudMat, {
      outline: true,
      outlineThickness: 1.1,
    });
    shroud.position.set(fx, 4.22, -3.5);
    group.add(shroud);
  });

  // Galvanized rooftop air duct & cylindrical exhaust stack
  const ductHoriz = createCelMesh(new THREE.BoxGeometry(1.4, 0.36, 0.42), hvacMat, {
    outline: true,
    outlineThickness: 1.2,
    crease: true,
  });
  ductHoriz.position.set(-1.6, 3.55, -3.5);
  const exhaustVent = createCelMesh(new THREE.CylinderGeometry(0.18, 0.18, 0.65, 12), hvacMat, {
    outline: true,
    outlineThickness: 1.2,
  });
  exhaustVent.position.set(0.35, 3.62, -4.1);
  const ventCap = createCelMesh(new THREE.ConeGeometry(0.30, 0.18, 12), hvacMat, {
    outline: true,
    outlineThickness: 1.1,
  });
  ventCap.position.set(0.35, 3.98, -4.1);
  group.add(ductHoriz, exhaustVent, ventCap);

  // Rear exterior service door on back wall (Z = -5.80)
  const rearDoor = createCelMesh(
    new THREE.BoxGeometry(0.92, 2.05, 0.06),
    { color: 0x626e8a, rimStrength: 0.18, wetness: 0.25 },
    { outline: true, outlineThickness: 1.2, crease: true }
  );
  rearDoor.position.set(-4.8, 1.17, -5.81);
  group.add(rearDoor);

  return {
    group,
    dripAnchors,
    update(time, doorWarmLight) {
      glassMat.uniforms.uTime.value = time;

      // Occasional automatic door open/close cycle every 10 seconds
      const cycle = time % 10.5;
      let openFactor = 0;
      if (cycle > 2.0 && cycle <= 3.1) {
        const t = (cycle - 2.0) / 1.1;
        openFactor = t * t * (3 - 2 * t);
      } else if (cycle > 3.1 && cycle <= 5.4) {
        openFactor = 1;
      } else if (cycle > 5.4 && cycle <= 6.6) {
        const t = 1 - (cycle - 5.4) / 1.2;
        openFactor = t * t * (3 - 2 * t);
      }

      const slideDist = 0.72 * openFactor;
      leftDoorLeaf.position.x = leftClosedX - slideDist;
      rightDoorLeaf.position.x = rightClosedX + slideDist;

      // Sensor LED turns emerald when open, subtle warm red/amber when closed
      sensorLedMat.color.setHex(openFactor > 0.1 ? 0x4bff9c : 0xff6b57);
      if (doorWarmLight) {
        doorWarmLight.intensity = 1.6 + openFactor * 1.45;
      }

      // Subtle organic fluorescent flicker on side 24h lightbox
      const wave =
        Math.sin(time * 2.7) * 0.04 +
        Math.sin(time * 17.3) * 0.02 +
        (Math.sin(time * 0.9) > 0.96 ? -0.18 * Math.abs(Math.sin(time * 43.0)) : 0);
      const flick = THREE.MathUtils.clamp(0.96 + wave, 0.72, 1.05);
      sideBladeMat.color.setRGB(flick, flick * 0.98, flick * 0.94);
    },
  };
}
