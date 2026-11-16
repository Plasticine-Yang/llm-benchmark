import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import {
  createCelMaterial,
  createCelMesh,
  createCanvasTexture,
  addOutline,
  addCreaseLines,
} from '../utils/toonFactory.js';

/**
 * Generates exact planar world-space UVs in [0, 1] over [-9, +9] x [-9, +9]
 * after geometry has already been oriented into world XZ.
 */
function applyPlanarWorldUVs(geometry, minX = -9, maxX = 9, minZ = -9, maxZ = 9) {
  const pos = geometry.getAttribute('position');
  const uv = new Float32Array(pos.count * 2);
  const spanX = maxX - minX;
  const spanZ = maxZ - minZ;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    uv[i * 2] = (x - minX) / spanX;
    uv[i * 2 + 1] = 1.0 - (z - minZ) / spanZ;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

function buildRoadTextures() {
  // 1. Crisp 1024x1024 wet asphalt, crosswalks, lane lines, parking bay markings
  const roadTex = createCanvasTexture(1024, 1024, (ctx, w, h) => {
    const toPxX = (wx) => ((wx + 9) / 18) * w;
    const toPxY = (wz) => ((wz + 9) / 18) * h;

    // Deep rainy twilight indigo-slate asphalt base
    ctx.fillStyle = '#1c2336';
    ctx.fillRect(0, 0, w, h);

    // Subtle anime painterly tonal bands + tire track darkening along roads
    ctx.fillStyle = '#181e2f';
    ctx.fillRect(0, toPxY(4.75), w, toPxY(8.6) - toPxY(4.75));
    ctx.fillRect(toPxX(4.75), 0, toPxX(8.6) - toPxX(4.75), h);

    // Slight dark asphalt wear tracks
    ctx.fillStyle = 'rgba(13, 17, 29, 0.45)';
    ctx.fillRect(0, toPxY(5.15), w, 24);
    ctx.fillRect(0, toPxY(7.45), w, 24);
    ctx.fillRect(toPxX(5.15), 0, 24, h);
    ctx.fillRect(toPxX(7.45), 0, 24, h);

    // Micro asphalt stipple (kept subtle & clean for cel-shaded aesthetic)
    let seed = 1337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < 3200; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const bright = rand() > 0.5;
      ctx.fillStyle = bright ? 'rgba(90, 108, 150, 0.08)' : 'rgba(9, 12, 22, 0.12)';
      ctx.fillRect(x, y, 2, 2);
    }

    // Parking bay surface (slightly smoother slate concrete)
    ctx.fillStyle = '#252c42';
    ctx.fillRect(
      toPxX(-5.7),
      toPxY(2.05),
      toPxX(-2.5) - toPxX(-5.7),
      toPxY(4.25) - toPxY(2.05)
    );

    // Crisp off-white / cool-cream road paint
    const paint = '#dbe4f5';
    ctx.fillStyle = paint;
    ctx.strokeStyle = paint;

    // Front road solid shoulder edge line (along Z = 4.55, left of crosswalk)
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(toPxX(-8.85), toPxY(4.56));
    ctx.lineTo(toPxX(0.6), toPxY(4.56));
    ctx.stroke();

    // Front road dashed centerline (Z = 6.65)
    ctx.lineWidth = 6;
    for (let wx = -8.5; wx <= 0.1; wx += 1.55) {
      ctx.beginPath();
      ctx.moveTo(toPxX(wx), toPxY(6.65));
      ctx.lineTo(toPxX(wx + 0.85), toPxY(6.65));
      ctx.stroke();
    }

    // Side road solid shoulder edge line (along X = 4.56, above crosswalk)
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(toPxX(4.56), toPxY(-8.85));
    ctx.lineTo(toPxX(4.56), toPxY(0.6));
    ctx.stroke();

    // Side road dashed centerline (X = 6.65)
    for (let wz = -8.5; wz <= 0.1; wz += 1.55) {
      ctx.beginPath();
      ctx.moveTo(toPxX(6.65), toPxY(wz));
      ctx.lineTo(toPxX(6.65), toPxY(wz + 0.85));
      ctx.stroke();
    }

    // Stop lines (停止線) before each crosswalk
    ctx.fillRect(toPxX(0.28), toPxY(4.65), 11, toPxY(6.55) - toPxY(4.65));
    ctx.fillRect(toPxX(4.65), toPxY(0.28), toPxX(6.55) - toPxX(4.65), 11);

    // Front Zebra Crosswalk (反光斑马线) spanning Z: 4.95 -> 8.55 at X: 1.05 -> 3.05
    const barCount = 5;
    for (let i = 0; i < barCount; i++) {
      const z0 = 5.0 + i * 0.72;
      ctx.fillRect(
        toPxX(1.08),
        toPxY(z0),
        toPxX(3.05) - toPxX(1.08),
        toPxY(z0 + 0.38) - toPxY(z0)
      );
    }

    // Side Zebra Crosswalk spanning X: 4.95 -> 8.55 at Z: 1.05 -> 3.05
    for (let i = 0; i < barCount; i++) {
      const x0 = 5.0 + i * 0.72;
      ctx.fillRect(
        toPxX(x0),
        toPxY(1.08),
        toPxX(x0 + 0.38) - toPxX(x0),
        toPxY(3.05) - toPxY(1.08)
      );
    }

    // Parking bay lines + crisp painted "P"
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(toPxX(-5.58), toPxY(4.15));
    ctx.lineTo(toPxX(-5.58), toPxY(2.15));
    ctx.lineTo(toPxX(-2.62), toPxY(2.15));
    ctx.lineTo(toPxX(-2.62), toPxY(4.15));
    ctx.stroke();

    ctx.save();
    ctx.fillStyle = 'rgba(222, 232, 248, 0.88)';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P', toPxX(-4.1), toPxY(3.38));
    ctx.restore();
  });

  // 2. Puddle mask texture (R = puddle coverage 0..1, G = wet sheen variation)
  const puddleTex = createCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      const toPxX = (wx) => ((wx + 9) / 18) * w;
      const toPxY = (wz) => ((wz + 9) / 18) * h;

      // Base damp film across all road surfaces
      ctx.fillStyle = 'rgb(42, 42, 42)';
      ctx.fillRect(0, 0, w, h);

      const drawPuddle = (wx, wz, rx, rz, rot = 0, strength = 1.0) => {
        ctx.save();
        ctx.translate(toPxX(wx), toPxY(wz));
        ctx.rotate(rot);
        const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, Math.max(rx, rz) * (w / 18));
        const peak = Math.round(strength * 255);
        grad.addColorStop(0.0, `rgb(${peak}, ${peak}, ${peak})`);
        grad.addColorStop(0.62, `rgb(${Math.round(peak * 0.9)}, ${Math.round(peak * 0.9)}, ${Math.round(peak * 0.9)})`);
        grad.addColorStop(0.86, `rgb(${Math.round(peak * 0.35)}, ${Math.round(peak * 0.35)}, ${Math.round(peak * 0.35)})`);
        grad.addColorStop(1.0, 'rgb(42, 42, 42)');
        ctx.fillStyle = grad;
        ctx.scale(1, rz / rx);
        ctx.beginPath();
        ctx.arc(0, 0, rx * (w / 18), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      // Corner crosswalk mirror puddle (catches warm store & cool streetlamp!)
      drawPuddle(3.6, 5.4, 2.2, 1.35, -0.18, 1.0);
      drawPuddle(5.3, 3.3, 1.45, 2.1, 0.14, 0.96);
      // Front parking / gutter puddle (catches store fascia & tall pole sign!)
      drawPuddle(-3.4, 5.1, 2.5, 1.15, 0.08, 0.95);
      drawPuddle(-1.2, 6.2, 1.7, 1.1, -0.1, 0.88);
      // Alley mouth puddle (catches warm alley lantern!)
      drawPuddle(-6.4, 5.2, 1.35, 1.0, 0.12, 0.92);
      // Side road puddle near vending glow & distant traffic signal!
      drawPuddle(5.6, -2.5, 1.4, 2.2, -0.08, 0.94);
      drawPuddle(6.1, -6.1, 1.6, 1.5, 0.2, 0.96);
      // Center intersection puddle
      drawPuddle(6.4, 6.4, 1.9, 1.6, 0.35, 0.92);
    },
    { srgb: false }
  );

  return { roadTex, puddleTex };
}

function buildSidewalkTexture() {
  return createCanvasTexture(1024, 1024, (ctx, w, h) => {
    const toPxX = (wx) => ((wx + 9) / 18) * w;
    const toPxY = (wz) => ((wz + 9) / 18) * h;

    // Clean rainy twilight concrete paver tone (cool lavender-slate)
    ctx.fillStyle = '#47516d';
    ctx.fillRect(0, 0, w, h);

    // Subtle warmer concrete apron directly beneath store canopy
    const warmGrad = ctx.createRadialGradient(
      toPxX(-0.8),
      toPxY(1.6),
      20,
      toPxX(-0.8),
      toPxY(1.6),
      240
    );
    warmGrad.addColorStop(0, 'rgba(130, 124, 138, 0.35)');
    warmGrad.addColorStop(1, 'rgba(71, 81, 109, 0.0)');
    ctx.fillStyle = warmGrad;
    ctx.fillRect(0, 0, w, h);

    // Crisp interlocking sidewalk paver lines (30cm grid)
    ctx.strokeStyle = 'rgba(22, 27, 48, 0.42)';
    ctx.lineWidth = 1.5;
    const step = 0.55;
    for (let wx = -9; wx <= 9; wx += step) {
      const px = toPxX(wx);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.stroke();
    }
    for (let wz = -9; wz <= 9; wz += step) {
      const py = toPxY(wz);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();
    }

    // Subtle damp darkening in narrow side alley (-7.2 to -5.6)
    ctx.fillStyle = 'rgba(18, 22, 38, 0.42)';
    ctx.fillRect(toPxX(-7.3), 0, toPxX(-5.5) - toPxX(-7.3), toPxY(4.25));

    // Curb edge stone highlight border around sidewalk perimeter
    ctx.strokeStyle = '#5f6b8c';
    ctx.lineWidth = 10;
    ctx.strokeRect(toPxX(-8.8), toPxY(-8.8), toPxX(4.15) - toPxX(-8.8), toPxY(4.15) - toPxY(-8.8));
  });
}

function createSidewalkGeometry() {
  // Build sidewalk polygon in world XZ, converting to Shape (sx = x, sy = -z)
  // Main block: X in [-8.95, 4.25], Z in [-8.95, 4.25]
  // With rounded corner at (4.25, 4.25), R = 1.15
  // And front-left parking bay cut-out: X in [-5.65, -2.55], Z in [2.10, 4.25]
  const shape = new THREE.Shape();
  const r = 1.15;

  // Start at back-left (-8.95, -8.95) -> sy = +8.95
  shape.moveTo(-8.95, 8.95);
  // Go along back (-Z) to right edge (4.25, -8.95)
  shape.lineTo(4.25, 8.95);
  // Go forward along +X edge down to start of corner arc (4.25, 4.25 - r) -> sy = -(4.25 - r)
  shape.lineTo(4.25, -(4.25 - r));
  // Smooth rounded corner around center (4.25 - r, -(4.25 - r))
  shape.absarc(4.25 - r, -(4.25 - r), r, 0, -Math.PI / 2, true);
  // Go left along front edge Z = 4.25 (sy = -4.25) to parking cut-out right edge (-2.55)
  shape.lineTo(-2.55, -4.25);
  // Cut in to parking bay back edge Z = 2.10 (sy = -2.10)
  shape.lineTo(-2.55, -2.10);
  shape.lineTo(-5.65, -2.10);
  shape.lineTo(-5.65, -4.25);
  // Continue left to (-8.95, 4.25)
  shape.lineTo(-8.95, -4.25);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.11,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
    curveSegments: 16,
  });
  geom.rotateX(-Math.PI / 2);
  geom.translate(0, 0.015, 0);
  applyPlanarWorldUVs(geom);
  return geom;
}

function createWetRoadShader(roadTex, puddleTex) {
  return {
    name: 'AnimeWetAsphaltShader',
    uniforms: {
      color: { value: null },
      tDiffuse: { value: null },
      textureMatrix: { value: null },
      uRoadMap: { value: roadTex },
      uPuddleMask: { value: puddleTex },
      uTime: { value: 0 },
      uSignalColor: { value: new THREE.Color(0x38f29e) },
    },
    vertexShader: /* glsl */ `
      uniform mat4 textureMatrix;
      varying vec4 vProjUv;
      varying vec2 vWorldUv;
      varying vec3 vWorldPos;

      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vWorldUv = vec2((worldPos.x + 9.0) / 18.0, 1.0 - (worldPos.z + 9.0) / 18.0);
        vProjUv = textureMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse;
      uniform sampler2D uRoadMap;
      uniform sampler2D uPuddleMask;
      uniform float uTime;
      uniform vec3 uSignalColor;

      varying vec4 vProjUv;
      varying vec2 vWorldUv;
      varying vec3 vWorldPos;

      // Procedural multi-cell raindrop ripples
      vec3 evalRainRipples(vec2 p, float t) {
        vec2 totalGrad = vec2(0.0);
        float totalRing = 0.0;

        for (int i = 0; i < 2; i++) {
          float scale = i == 0 ? 1.55 : 2.35;
          float speed = i == 0 ? 1.15 : 1.45;
          vec2 uv = p * scale;
          vec2 cell = floor(uv);
          vec2 local = fract(uv) - 0.5;

          float h1 = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
          float h2 = fract(sin(dot(cell, vec2(269.5, 183.3))) * 43758.5453);

          vec2 center = (vec2(h1, h2) - 0.5) * 0.48;
          vec2 diff = local - center;
          float dist = length(diff);

          float life = fract(t * speed + h1 * 6.2831);
          float radius = life * 0.44;
          float fade = (1.0 - life) * smoothstep(0.0, 0.08, life);

          float ring = exp(-pow((dist - radius) * 28.0, 2.0)) * fade;
          float wave = sin((dist - radius) * 42.0) * exp(-abs(dist - radius) * 16.0) * fade;
          vec2 dir = dist > 1e-4 ? diff / dist : vec2(0.0);

          totalGrad += dir * wave * 0.55;
          totalRing += ring;
        }
        return vec3(totalGrad, clamp(totalRing, 0.0, 1.0));
      }

      void main() {
        vec3 baseRoad = texture2D(uRoadMap, vWorldUv).rgb;
        float puddleRaw = texture2D(uPuddleMask, vWorldUv).r;
        float puddle = smoothstep(0.26, 0.72, puddleRaw);

        // Compute rain ripples strongest inside puddles
        vec3 ripple = evalRainRipples(vWorldPos.xz, uTime);
        vec2 rippleGrad = ripple.xy * (0.32 + 0.68 * puddle);
        float ringGlow = ripple.z * puddle;

        // Projected planar reflection with subtle vertical anime rain-streak blur
        vec4 proj = vProjUv;
        proj.xy += rippleGrad * 0.048 * proj.w;
        float blurY = (0.0045 + 0.0055 * (1.0 - puddle)) * proj.w;

        vec3 reflCenter = texture2DProj(tDiffuse, proj).rgb;
        vec3 reflUp = texture2DProj(tDiffuse, proj + vec4(0.0, blurY, 0.0, 0.0)).rgb;
        vec3 reflDown = texture2DProj(tDiffuse, proj - vec4(0.0, blurY * 1.4, 0.0, 0.0)).rgb;
        vec3 reflection = reflCenter * 0.50 + reflUp * 0.25 + reflDown * 0.25;

        // View-dependent Fresnel so shallow camera angles reflect brightly
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float ndv = clamp(viewDir.y, 0.0, 1.0);
        float fresnel = pow(1.0 - ndv, 2.1);

        // White crosswalk / lane lines stay bright even under reflections
        float paintMask = smoothstep(0.45, 0.78, dot(baseRoad, vec3(0.333)));
        float reflStrength = mix(0.18 + 0.34 * fresnel, 0.54 + 0.32 * fresnel, puddle);
        reflStrength *= mix(1.0, 0.45, paintMask * (1.0 - puddle * 0.65));

        // Stylized dark rainy-blue tint on asphalt vs crisp mirror reflection in puddles
        vec3 wetTint = mix(vec3(0.75, 0.84, 1.0), vec3(0.92, 0.96, 1.0), puddle);
        vec3 col = mix(baseRoad, reflection * wetTint, clamp(reflStrength, 0.0, 0.86));

        // Add subtle distant traffic-signal puddle reflection pool at far right corner (6.2, -6.2)
        float sigDist = length(vWorldPos.xz - vec2(6.5, -5.8));
        float sigPool = exp(-sigDist * sigDist * 0.14) * (0.28 + 0.72 * puddle);
        col += uSignalColor * sigPool * 0.18;

        // Crisp anime cel-white/cyan raindrop ripple rings on puddles
        col += vec3(0.68, 0.85, 1.0) * ringGlow * 0.26;

        // Subtle dark diorama edge framing
        float edgeDist = max(abs(vWorldPos.x), abs(vWorldPos.z));
        float edgeShade = smoothstep(8.75, 9.0, edgeDist);
        col *= 1.0 - edgeShade * 0.28;

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  };
}

export function buildBaseAndStreets(scene) {
  const group = new THREE.Group();
  group.name = 'BaseAndStreets';

  // --- 1. Collectible Square Architectural Diorama Plinth ---
  // Roadbed sub-asphalt edge slice (y: -0.18 .. 0.00)
  const strataAsphalt = createCelMesh(
    new THREE.BoxGeometry(18.02, 0.18, 18.02),
    { color: 0x1e2538, rimStrength: 0.10, shadowTintStrength: 0.35 },
    { outline: true, outlineThickness: 1.5, crease: true, creaseAngle: 40, castShadow: false }
  );
  strataAsphalt.position.y = -0.09;
  group.add(strataAsphalt);

  // Concrete foundation layer (y: -0.38 .. -0.18)
  const strataConcrete = createCelMesh(
    new THREE.BoxGeometry(18.24, 0.20, 18.24),
    { color: 0x353f59, rimStrength: 0.14, shadowTintStrength: 0.32 },
    { outline: true, outlineThickness: 1.6, crease: true, creaseAngle: 40, castShadow: false }
  );
  strataConcrete.position.y = -0.28;
  group.add(strataConcrete);

  // Subtle metallic champagne-bronze trim bezel (y: -0.42 .. -0.38)
  const brassTrim = createCelMesh(
    new THREE.BoxGeometry(18.36, 0.05, 18.36),
    { color: 0x9b8262, rimColor: 0xffdfa8, rimStrength: 0.25, wetness: 0.25 },
    { outline: false, crease: false, castShadow: false }
  );
  brassTrim.position.y = -0.40;
  group.add(brassTrim);

  // Upper walnut-slate collectible display plinth (y: -0.66 .. -0.42)
  const plinthUpper = createCelMesh(
    new THREE.BoxGeometry(18.54, 0.24, 18.54),
    { color: 0x1b1e2e, rimStrength: 0.12 },
    { outline: true, outlineThickness: 1.8, crease: true, creaseAngle: 40, castShadow: false }
  );
  plinthUpper.position.y = -0.54;
  group.add(plinthUpper);

  // Lower stepped dark base footing (y: -0.88 .. -0.66)
  const plinthLower = createCelMesh(
    new THREE.BoxGeometry(18.92, 0.22, 18.92),
    { color: 0x111420, rimStrength: 0.08 },
    { outline: true, outlineThickness: 1.8, crease: true, creaseAngle: 40, castShadow: false }
  );
  plinthLower.position.y = -0.77;
  group.add(plinthLower);

  // --- 2. Real-Time Planar Wet Road & Puddle Reflector ---
  const { roadTex, puddleTex } = buildRoadTextures();
  const roadShader = createWetRoadShader(roadTex, puddleTex);

  const roadReflector = new Reflector(new THREE.PlaneGeometry(17.98, 17.98), {
    clipBias: 0.003,
    textureWidth: 1024,
    textureHeight: 1024,
    multisample: 2,
    shader: roadShader,
  });
  roadReflector.rotation.x = -Math.PI / 2;
  roadReflector.position.y = 0.002;
  roadReflector.receiveShadow = false;
  group.add(roadReflector);

  // --- 3. Raised Sidewalk & Rounded Corner Curb ---
  const sidewalkTex = buildSidewalkTexture();
  const sidewalkMat = createCelMaterial({
    color: 0xffffff,
    map: sidewalkTex,
    rimColor: 0x6ea6f5,
    rimStrength: 0.12,
    shadowTint: 0x1e2748,
    shadowTintStrength: 0.45,
    wetness: 0.18,
  });

  const sidewalkGeom = createSidewalkGeometry();
  const sidewalkMesh = new THREE.Mesh(sidewalkGeom, sidewalkMat);
  sidewalkMesh.castShadow = true;
  sidewalkMesh.receiveShadow = true;
  addOutline(sidewalkMesh, 1.45, 0x13172c);
  addCreaseLines(sidewalkMesh, 42, 0x161c33, 0.65);
  group.add(sidewalkMesh);

  // Small opposite-corner sidewalk pad on the far right edge (X: 7.75..8.95, Z: -8.95..-5.85)
  // Holds the distant corner traffic signal & bollard cleanly inside the diorama!
  const farPadShape = new THREE.Shape();
  farPadShape.moveTo(7.75, 8.95);
  farPadShape.lineTo(8.95, 8.95);
  farPadShape.lineTo(8.95, 5.85);
  farPadShape.lineTo(8.15, 5.85);
  farPadShape.absarc(8.15, 6.25, 0.40, -Math.PI / 2, Math.PI, true);
  farPadShape.closePath();
  const farPadGeom = new THREE.ExtrudeGeometry(farPadShape, {
    depth: 0.11,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
    curveSegments: 10,
  });
  farPadGeom.rotateX(-Math.PI / 2);
  farPadGeom.translate(0, 0.015, 0);
  applyPlanarWorldUVs(farPadGeom);
  const farPadMesh = new THREE.Mesh(farPadGeom, sidewalkMat);
  farPadMesh.castShadow = true;
  farPadMesh.receiveShadow = true;
  addOutline(farPadMesh, 1.4, 0x13172c);
  group.add(farPadMesh);

  // Parking bay sloped concrete apron ramp (from Z=2.10 down to Z=2.55)
  const rampMat = createCelMaterial({
    color: 0x525d7d,
    rimStrength: 0.12,
    wetness: 0.22,
  });
  const rampGeom = new THREE.BoxGeometry(3.08, 0.07, 0.55);
  const rampMesh = createCelMesh(rampGeom, rampMat, { outline: true, outlineThickness: 1.2, crease: true });
  rampMesh.position.set(-4.1, 0.055, 2.35);
  rampMesh.rotation.x = 0.22;
  group.add(rampMesh);

  // Concrete parking wheel stops (車止め) with safety yellow band
  const wheelStopMat = createCelMaterial({ color: 0x7b86a3, rimStrength: 0.18 });
  const stripeMat = createCelMaterial({
    color: 0xf4c242,
    emissive: 0x332400,
    rimStrength: 0.2,
  });
  [-4.7, -3.5].forEach((wx) => {
    const stop = createCelMesh(new THREE.BoxGeometry(0.68, 0.12, 0.18), wheelStopMat, {
      outline: true,
      outlineThickness: 1.2,
      crease: true,
    });
    stop.position.set(wx, 0.06, 2.66);
    group.add(stop);

    const stripe = createCelMesh(new THREE.BoxGeometry(0.24, 0.125, 0.185), stripeMat, {
      outline: false,
      castShadow: false,
    });
    stripe.position.set(wx, 0.06, 2.66);
    group.add(stripe);
  });

  // --- 4. Japanese Yellow Tactile Warning Paving Blocks (点字ブロック) ---
  const tactileMat = createCelMaterial({
    color: 0xe4b83d,
    rimColor: 0xffe48a,
    rimStrength: 0.15,
    wetness: 0.30,
  });
  const tactileSpecs = [
    // Front crosswalk approach strips
    { x: 2.08, z: 3.82, w: 1.98, d: 0.34 },
    // Side crosswalk approach strips
    { x: 3.82, z: 2.08, w: 0.34, d: 1.98 },
    // Corner junction connecting blocks
    { x: 3.45, z: 3.45, w: 0.34, d: 0.34 },
  ];
  tactileSpecs.forEach((t) => {
    const block = createCelMesh(new THREE.BoxGeometry(t.w, 0.016, t.d), tactileMat, {
      outline: true,
      outlineThickness: 1.0,
      crease: true,
      castShadow: false,
    });
    block.position.set(t.x, 0.148, t.z);
    group.add(block);
  });

  // --- 5. Recessed Drainage Gutter & Slotted Steel Grates (排水沟) ---
  const gutterTroughMat = createCelMaterial({
    color: 0x161b2a,
    rimStrength: 0.05,
    wetness: 0.5,
  });
  const grateFrameMat = createCelMaterial({
    color: 0x5c6882,
    rimColor: 0x99b9eb,
    rimStrength: 0.25,
    wetness: 0.4,
  });

  const addGutterRun = (x, z, len, horizontal = true) => {
    const g = new THREE.Group();
    const w = horizontal ? len : 0.26;
    const d = horizontal ? 0.26 : len;

    // Concrete curb lip & dark recessed water channel
    const channel = createCelMesh(new THREE.BoxGeometry(w, 0.015, d), gutterTroughMat, {
      outline: false,
      castShadow: false,
    });
    channel.position.set(x, 0.012, z);
    g.add(channel);

    // Side concrete rails
    const railThickness = 0.04;
    const rail1 = createCelMesh(
      new THREE.BoxGeometry(horizontal ? w : railThickness, 0.035, horizontal ? railThickness : d),
      grateFrameMat,
      { outline: false, castShadow: false }
    );
    rail1.position.set(
      horizontal ? x : x - 0.13,
      0.022,
      horizontal ? z - 0.13 : z
    );
    const rail2 = rail1.clone();
    rail2.position.set(
      horizontal ? x : x + 0.13,
      0.022,
      horizontal ? z + 0.13 : z
    );
    g.add(rail1, rail2);

    // Instanced slotted steel grate bars
    const barCount = Math.max(4, Math.floor(len / 0.16));
    const barGeom = horizontal
      ? new THREE.BoxGeometry(0.055, 0.024, 0.23)
      : new THREE.BoxGeometry(0.23, 0.024, 0.055);
    const inst = new THREE.InstancedMesh(barGeom, grateFrameMat, barCount);
    inst.receiveShadow = true;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < barCount; i++) {
      const offset = -len * 0.5 + ((i + 0.5) / barCount) * len;
      dummy.position.set(
        horizontal ? x + offset : x,
        0.022,
        horizontal ? z : z + offset
      );
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    g.add(inst);
    group.add(g);
  };

  // Front curb gutters (left side, parking apron, crosswalk approach)
  addGutterRun(-7.25, 4.38, 3.0, true);
  addGutterRun(-4.1, 4.38, 3.0, true);
  addGutterRun(-0.35, 4.38, 4.2, true);
  // Side street curb gutters
  addGutterRun(4.38, -2.6, 11.4, false);
  // Alley center drain grate
  addGutterRun(-6.4, 2.2, 4.0, false);

  // --- 6. Animated Glossy Sidewalk Puddles (2 shallow translucent pools on sidewalk) ---
  const sidewalkPuddleUniforms = {
    uTime: { value: 0 },
  };
  const sidewalkPuddleMat = new THREE.ShaderMaterial({
    uniforms: sidewalkPuddleUniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float r = length(p);
        float mask = 1.0 - smoothstep(0.62, 0.98, r);

        float life1 = fract(uTime * 0.85);
        float life2 = fract(uTime * 0.85 + 0.5);
        float ring1 = exp(-pow((r - life1 * 0.85) * 16.0, 2.0)) * (1.0 - life1);
        float ring2 = exp(-pow((length(p - vec2(0.25, -0.18)) - life2 * 0.65) * 18.0, 2.0)) * (1.0 - life2);

        vec3 base = mix(vec3(0.16, 0.22, 0.36), vec3(0.45, 0.58, 0.82), 0.35);
        vec3 col = base + vec3(0.75, 0.88, 1.0) * (ring1 + ring2) * 0.45;
        gl_FragColor = vec4(col, mask * 0.55);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });

  const puddleSpots = [
    { x: 2.95, z: 2.45, sx: 1.55, sz: 1.25 },
    { x: -1.65, z: 2.85, sx: 1.4, sz: 1.0 },
    { x: -6.4, z: -1.8, sx: 1.1, sz: 2.1 },
  ];
  puddleSpots.forEach((ps) => {
    const pMesh = new THREE.Mesh(new THREE.PlaneGeometry(ps.sx, ps.sz), sidewalkPuddleMat);
    pMesh.rotation.x = -Math.PI / 2;
    pMesh.position.set(ps.x, 0.144, ps.z);
    group.add(pMesh);
  });

  return {
    group,
    update(time, signalColor) {
      roadReflector.material.uniforms.uTime.value = time;
      if (signalColor) {
        roadReflector.material.uniforms.uSignalColor.value.copy(signalColor);
      }
      sidewalkPuddleUniforms.uTime.value = time;
    },
  };
}
