import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { BOX, PLANE, clearMaterialCache, decal, put, toon, withRepeat } from './materials';
import { GradeShader, LIGHT_SLOTS, createRain, createWetMaterial } from './shaders';
import {
  makeAsphalt,
  makeSidewalk,
  makeSoftDot,
} from './textures';
import { STORE, buildPoleSign, buildStore, resetDrips, updateDrips } from './store';
import { LAYOUT, buildStreet, haloSprite, NeonRef } from './street';

const SIDEWALK_TILE = 2.4; // texture repeat unit -> 1.2m tiles

export class Diorama {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private grade: ShaderPass;
  private wetMat = createWetMaterial();

  private clock = new THREE.Clock();
  private raf = 0;
  private elapsed = 0;
  private ro: ResizeObserver | null = null;

  private updaters: ((t: number, dt: number) => void)[] = [];
  private neon: NeonRef[] = [];

  // eave drip system
  private dripSources: THREE.Vector3[] = [];
  private drops: { mesh: THREE.Mesh; src: THREE.Vector3; y: number; v: number; delay: number }[] = [];
  private rings: { mesh: THREE.Mesh; life: number }[] = [];

  private target = new THREE.Vector3(-0.6, 1.5, -2.6);
  private autoResumeTimer = 0;
  private disposed = false;

  constructor(container: HTMLElement) {
    this.container = container;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.touchAction = 'none';
    container.appendChild(this.renderer.domElement);

    this.scene.background = makeBackdropTexture();
    this.scene.fog = new THREE.FogExp2(0x0a1122, 0.013);

    this.camera = new THREE.PerspectiveCamera(
      34,
      Math.max(0.2, container.clientWidth / Math.max(1, container.clientHeight)),
      0.4,
      260
    );
    this.camera.position.set(14.6, 9.4, 15.2);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(this.target);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.72;
    this.controls.zoomSpeed = 0.85;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 54;
    this.controls.minPolarAngle = 0.14;
    this.controls.maxPolarAngle = 1.495;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.24;
    this.controls.addEventListener('start', () => {
      this.controls.autoRotate = false;
      this.autoResumeTimer = 0;
    });
    this.controls.addEventListener('end', () => {
      this.autoResumeTimer = 3.2;
    });

    // ---------------- lighting ----------------
    this.scene.add(new THREE.AmbientLight(0x1b2440, 0.7));
    const hemi = new THREE.HemisphereLight(0x4a5f96, 0x0a0d18, 0.75);
    this.scene.add(hemi);

    const moon = new THREE.DirectionalLight(0x9fb8ff, 0.62);
    moon.position.set(-13, 21, 10);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.camera.left = -17;
    moon.shadow.camera.right = 17;
    moon.shadow.camera.top = 17;
    moon.shadow.camera.bottom = -17;
    moon.shadow.camera.near = 1;
    moon.shadow.camera.far = 62;
    moon.shadow.bias = -0.0009;
    moon.shadow.normalBias = 0.022;
    this.scene.add(moon);

    const rim = new THREE.DirectionalLight(0x6f96e0, 0.34);
    rim.position.set(16, 7, -16);
    this.scene.add(rim);

    // ---------------- world ----------------
    this.buildBase();
    this.buildGround();
    this.buildMarkings();
    this.buildWetLayer();

    const store = buildStore();
    this.scene.add(store.group);
    this.updaters.push(store.update);
    this.neon.push(...store.neonLights);

    const street = buildStreet();
    this.scene.add(street.group);
    this.updaters.push(street.update);
    this.neon.push(...street.neon);

    // corner pole sign
    const pole = buildPoleSign();
    pole.group.position.set(4.4, LAYOUT.walkTop, -2.6);
    pole.group.rotation.y = -0.34;
    this.scene.add(pole.group);
    this.updaters.push((t) => pole.update(t));
    this.neon.push({
      pos: new THREE.Vector3(4.4, 0, -2.2),
      color: new THREE.Color(0xd8f0ff),
      radius: 3.4,
      base: 0.58,
    });
    const poleHalo = haloSprite(0xbfe6ff, 3.4, 0.3);
    poleHalo.position.set(4.4, 4.0, -2.6);
    this.scene.add(poleHalo);

    // glow halos on the brightest fixtures
    const halos: [number, number, number, number, number, number][] = [
      [4.2, 4.5, -0.53, 0xffe0ab, 4.2, 0.3],
      [-2.5, 3.86, -2.6, 0xd9ffe9, 5.4, 0.18],
      [-1.15, 2.86, -1.6, 0xffe2b4, 6.4, 0.13],
      [-6.9, 1.5, -2.4, 0xff8f7a, 2.6, 0.2],
      [-5.9, 1.5, -2.4, 0x8fb6ff, 2.6, 0.2],
      [-4.9, 1.5, -2.4, 0x8fe4ff, 2.6, 0.2],
    ];
    halos.forEach(([x, y, z, c, s, o]) => {
      const h = haloSprite(c, s, o);
      h.position.set(x, y, z);
      this.scene.add(h);
    });

    this.buildRain();
    this.buildDrips(street.dripPoints);

    // ---------------- post ----------------
    const size = new THREE.Vector2(container.clientWidth, container.clientHeight);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(size, 0.66, 0.62, 0.7);
    this.composer.addPass(this.bloom);
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.grade);
    this.composer.addPass(new OutputPass());
    this.composer.setSize(size.x, size.y);

    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    window.addEventListener('resize', this.onWinResize);

    this.loop();
  }

  /* ================= display base ================= */
  private buildBase() {
    const plinth = toon(0x232838, { rough: true });
    const soil = toon(0x3b4252, { rough: true });
    put(this.scene, BOX(25.8, 0.55, 25.8), plinth, { pos: [0, -1.8, 0], outline: 0.0018, cast: true, recv: true });
    put(this.scene, BOX(24, 1.5, 24), soil, { pos: [0, -0.77, 0], outline: 0.0016, recv: true });
    // thin bright seam between plinth and terrain
    put(this.scene, BOX(24.14, 0.06, 24.14), toon(0x59627a), { pos: [0, -1.52, 0] });
  }

  /* ================= terrain ================= */
  private buildGround() {
    const asphalt = toon(0xffffff, { map: makeAsphalt(), rough: true });
    const road = put(this.scene, PLANE(24, 24), asphalt, {
      pos: [0, 0, 0],
      rot: [-Math.PI / 2, 0, 0],
      recv: true,
    });
    road.renderOrder = 0;

    const walkMat = (w: number, d: number) =>
      withRepeat(
        toon(0xffffff, {
          map: makeSidewalk(),
          emissive: 0x2a3247,
          emissiveIntensity: 0.3,
          rough: true,
        }),
        w / SIDEWALK_TILE,
        d / SIDEWALK_TILE
      );

    const slabs: [number, number, number, number][] = [
      // w, d, cx, cz
      [17.2, 2.4, -3.4, -1.8],
      [2.7, 9.0, 3.85, -7.5],
      [24, 2.0, 0, 6.4],
      [0.8, 17.4, 11.6, -3.3],
    ];
    slabs.forEach(([w, d, x, z]) => {
      put(this.scene, BOX(w, 0.16, d), walkMat(w, d), {
        pos: [x, 0.06, z],
        recv: true,
        cast: false,
        outline: 0.0009,
      });
      // curb cap highlight
      put(this.scene, BOX(w + 0.02, 0.035, d + 0.02), toon(0x9aa2b2, { rough: true }), {
        pos: [x, 0.15, z],
      });
    });

    // alley floor (darker, wetter)
    put(this.scene, PLANE(4, 8), toon(0x1d2331, { rough: true }), {
      pos: [-10, 0.012, -7],
      rot: [-Math.PI / 2, 0, 0],
      recv: true,
    });
    // store threshold strip
    put(this.scene, BOX(7.2, 0.03, 0.34), toon(0x8f98a4), { pos: [-1.1, 0.155, -2.9] });
  }

  /* ================= road markings ================= */
  private buildMarkings() {
    const paint = toon(0xeef3f6, {
      emissive: 0xc3d6e2,
      emissiveIntensity: 0.4,
      rough: true,
    });
    const yellow = toon(0xe8c65a, {
      emissive: 0xb08f2c,
      emissiveIntensity: 0.35,
      rough: true,
    });
    const Y = 0.024;

    // crosswalk in front of the store corner
    for (let i = 0; i < 7; i++) {
      decal(this.scene, 2.26, 0.4, paint, 3.85, Y, 0.05 + i * 0.78);
    }
    // crosswalk over the side street
    for (let i = 0; i < 7; i++) {
      decal(this.scene, 0.4, 1.4, paint, 5.62 + i * 0.78, Y, 6.4);
    }
    // stop lines
    decal(this.scene, 2.4, 0.24, paint, 3.85, Y, -0.42);
    decal(this.scene, 0.24, 5.8, paint, 5.42, Y, 2.4);

    // centre dashes
    for (let x = -11.6; x < 2.2; x += 2.1) decal(this.scene, 1.1, 0.13, yellow, x, Y, 2.4);
    for (let x = 5.8; x < 11.8; x += 2.1) decal(this.scene, 1.1, 0.13, yellow, x, Y, 2.4);
    for (let z = -11.6; z < -1.0; z += 2.1) decal(this.scene, 0.13, 1.1, yellow, 8.2, Y, z);
    for (let z = 7.8; z < 11.8; z += 2.1) decal(this.scene, 0.13, 1.1, yellow, 8.2, Y, z);

    // parking bays
    [-10.6, -7.0, -3.4].forEach((x) => decal(this.scene, 0.13, 1.8, paint, x, Y, 4.42));
    decal(this.scene, 7.3, 0.13, paint, -7.0, Y, 5.3);

    // lane arrows
    const arrowShape = new THREE.Shape();
    arrowShape.moveTo(0, 0.86);
    arrowShape.lineTo(0.42, 0.06);
    arrowShape.lineTo(0.15, 0.06);
    arrowShape.lineTo(0.15, -0.86);
    arrowShape.lineTo(-0.15, -0.86);
    arrowShape.lineTo(-0.15, 0.06);
    arrowShape.lineTo(-0.42, 0.06);
    arrowShape.closePath();
    const arrowGeo = new THREE.ShapeGeometry(arrowShape);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xdfe7ec, toneMapped: false, transparent: true, opacity: 0.82 });
    const mkArrow = (x: number, z: number, rot: number, s = 0.9) => {
      const m = new THREE.Mesh(arrowGeo, arrowMat);
      m.rotation.set(-Math.PI / 2, 0, rot);
      m.position.set(x, Y + 0.002, z);
      m.scale.setScalar(s);
      m.renderOrder = 2;
      this.scene.add(m);
    };
    mkArrow(-1.6, 3.9, Math.PI * 0.5, 0.95);
    mkArrow(0.4, 0.9, -Math.PI * 0.5, 0.95);
    mkArrow(9.7, -4.4, Math.PI, 0.9);

    // gutters along the kerbs
    const gutterMat = toon(0x171d29, { rough: true });
    decal(this.scene, 17.2, 0.22, gutterMat, -3.4, 0.018, -0.5);
    decal(this.scene, 0.22, 11.4, gutterMat, 5.3, 0.018, -6.3);
    decal(this.scene, 17.2, 0.22, gutterMat, -3.4, 0.018, 5.5);
    // grate bars
    for (let x = -11.4; x < 5.0; x += 1.7) {
      put(this.scene, BOX(0.09, 0.015, 0.2), toon(0x39424d), { pos: [x, 0.028, -0.5] });
    }
    for (let z = -11.6; z < -1.0; z += 1.7) {
      put(this.scene, BOX(0.2, 0.015, 0.09), toon(0x39424d), { pos: [5.3, 0.028, z] });
    }
    // storm drain at the corner
    put(this.scene, BOX(0.56, 0.05, 0.4), toon(0x12171f), { pos: [4.5, 0.02, -0.42] });
    for (let i = 0; i < 5; i++) {
      put(this.scene, BOX(0.5, 0.02, 0.035), toon(0x4a5462), { pos: [4.5, 0.048, -0.55 + i * 0.07] });
    }

    // manholes
    [[-3.2, 1.4], [8.2, -6.8]].forEach(([mx, mz]) => {
      put(this.scene, new THREE.CircleGeometry(0.36, 20), toon(0x2b323d, { rough: true }), {
        pos: [mx, 0.02, mz],
        rot: [-Math.PI / 2, 0, 0],
      });
      put(this.scene, new THREE.TorusGeometry(0.36, 0.03, 6, 20), toon(0x3d4653), {
        pos: [mx, 0.022, mz],
        rot: [-Math.PI / 2, 0, 0],
      });
    });
  }

  /* ================= wet reflections ================= */
  private buildWetLayer() {
    const planes: [number, number, number, number, number][] = [
      // w, d, x, y, z
      [24, 6.0, 0, 0.032, 2.4],
      [6.0, 6.6, 8.2, 0.032, 8.7],
      [6.0, 11.4, 8.2, 0.032, -6.3],
      [17.2, 2.4, -3.4, LAYOUT.walkTop + 0.038, -1.8],
      [2.7, 9.0, 3.85, LAYOUT.walkTop + 0.038, -7.5],
      [24, 2.0, 0, LAYOUT.walkTop + 0.038, 6.4],
      [0.8, 17.4, 11.6, LAYOUT.walkTop + 0.038, -3.3],
      [4, 8, -10, 0.02, -7],
    ];
    planes.forEach(([w, d, x, y, z]) => {
      const m = new THREE.Mesh(PLANE(w, d), this.wetMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, y, z);
      m.renderOrder = 7;
      m.receiveShadow = false;
      this.scene.add(m);
    });
  }

  /* ================= rain ================= */
  private buildRain() {
    const rain = createRain(2300, 12.4, 13.5, {
      // keep the sheltered volume under the awning / roof dry
      minX: STORE.x0 - 0.4,
      maxX: STORE.x1 + 0.4,
      minZ: STORE.z0 - 0.4,
      maxZ: STORE.z1 + 1.3,
      top: 3.0,
    });
    this.scene.add(rain);
    const mat = rain.material as THREE.ShaderMaterial;
    this.updaters.push((t) => {
      mat.uniforms.uTime.value = t;
    });

    // soft haze so the rain reads against the dark street
    const haze = new THREE.Mesh(
      PLANE(27, 27),
      new THREE.MeshBasicMaterial({
        map: makeSoftDot('rgba(150,185,235,0.5)'),
        transparent: true,
        opacity: 0.05,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      })
    );
    haze.rotation.x = -Math.PI / 2;
    haze.position.y = 0.24;
    haze.renderOrder = 4;
    this.scene.add(haze);
  }

  /* ================= eave drips + splash rings ================= */
  private buildDrips(extra: THREE.Vector3[]) {
    const dropGeo = new THREE.SphereGeometry(1, 6, 6);
    const dropMat = new THREE.MeshBasicMaterial({
      color: 0xbfe0ff,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const ringGeo = new THREE.RingGeometry(0.55, 0.72, 22);
    const ringMat = () =>
      new THREE.MeshBasicMaterial({
        color: 0xcfe6ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      });

    // awning front edge
    const awnZ = STORE.z1 + 1.25;
    for (let x = -4.5; x <= 2.2; x += 0.96) {
      this.dripSources.push(new THREE.Vector3(x, 2.84, awnZ - 0.02));
    }
    // vending-machine canopy edge
    for (let x = -8.0; x <= -4.9; x += 1.02) {
      this.dripSources.push(new THREE.Vector3(x, 2.34, STORE.z1 + 1.05));
    }
    // street furniture roofs
    extra.forEach((p) => this.dripSources.push(p.clone()));
    // sign-box overhang
    this.dripSources.push(new THREE.Vector3(-5.6, 3.34, STORE.z1 + 0.06));
    this.dripSources.push(new THREE.Vector3(0.6, 3.34, STORE.z1 + 0.06));

    for (let i = 0; i < 20; i++) {
      const src = this.dripSources[i % this.dripSources.length];
      const mesh = new THREE.Mesh(dropGeo, dropMat);
      mesh.scale.set(0.036, 0.1, 0.036);
      mesh.position.copy(src);
      mesh.renderOrder = 6;
      mesh.visible = false;
      this.scene.add(mesh);
      this.drops.push({
        mesh,
        src,
        y: src.y,
        v: 0,
        delay: Math.random() * 3.4,
      });
    }

    for (let i = 0; i < 18; i++) {
      const mesh = new THREE.Mesh(ringGeo, ringMat());
      mesh.rotation.x = -Math.PI / 2;
      mesh.renderOrder = 8;
      mesh.visible = false;
      this.scene.add(mesh);
      this.rings.push({ mesh, life: 0 });
    }

    let ringCursor = 0;
    const impact = new THREE.Vector3();
    const splash = (p: THREE.Vector3) => {
      const r = this.rings[ringCursor];
      ringCursor = (ringCursor + 1) % this.rings.length;
      r.mesh.position.set(p.x, p.y + 0.05, p.z);
      r.mesh.visible = true;
      r.mesh.scale.setScalar(0.06);
      r.life = 0.001;
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = 0.55;
    };

    this.updaters.push((_, dt) => {
      const g = 9.6;
      for (const d of this.drops) {
        if (d.delay > 0) {
          d.delay -= dt;
          if (d.delay <= 0) {
            d.mesh.visible = true;
            d.y = d.src.y;
            d.v = 0.2;
            d.mesh.position.set(d.src.x, d.y, d.src.z);
          }
          continue;
        }
        d.v += g * dt;
        d.y -= d.v * dt;
        d.mesh.position.y = d.y;
        const floor = LAYOUT.walkTop;
        if (d.y <= floor) {
          impact.set(d.src.x, floor, d.src.z);
          splash(impact);
          d.mesh.visible = false;
          d.delay = 0.5 + Math.random() * 3.6;
          d.y = d.src.y;
          d.v = 0;
        }
      }
      for (const r of this.rings) {
        if (r.life <= 0) continue;
        r.life += dt;
        const k = r.life / 0.62;
        if (k >= 1) {
          r.life = 0;
          r.mesh.visible = false;
          continue;
        }
        r.mesh.scale.setScalar(0.06 + k * 0.52);
        (r.mesh.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - k) * (1 - k);
      }
    });
  }

  /* ================= frame / loop ================= */
  private onWinResize = () => this.resize();

  private resize() {
    if (this.disposed) return;
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    // pull back on tall/narrow viewports so the whole corner stays in frame
    const aspect = w / h;
    const fov = aspect < 0.8 ? 42 : aspect < 1.25 ? 36 : 33;
    this.camera.fov = fov;
    const need =
      31 / (2 * Math.tan((fov * Math.PI) / 360) * Math.max(0.75, Math.min(aspect, 1.7)));
    const dist = THREE.MathUtils.clamp(need, 17, 42);
    const off = this.camera.position.clone().sub(this.controls.target);
    if (off.lengthSq() > 0.001) {
      off.setLength(dist);
      this.camera.position.copy(this.controls.target).add(off);
    }
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.bloom.resolution.set(w, h);
  }

  private syncWetLights() {
    const lights = this.wetMat.uniforms.uLights.value as THREE.Vector4[];
    const colors = this.wetMat.uniforms.uLightCol.value as THREE.Color[];
    const n = Math.min(LIGHT_SLOTS, this.neon.length);
    for (let i = 0; i < LIGHT_SLOTS; i++) {
      if (i < n) {
        const r = this.neon[i];
        lights[i].set(r.pos.x, r.pos.z, r.radius, r.base);
        colors[i].copy(r.color);
      } else {
        lights[i].set(0, 0, 1, 0);
        colors[i].setRGB(0, 0, 0);
      }
    }
    this.wetMat.uniforms.uCamXZ.value.set(
      this.camera.position.x,
      this.camera.position.z
    );
  }

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    this.elapsed += dt;

    if (this.autoResumeTimer > 0) {
      this.autoResumeTimer -= dt;
      if (this.autoResumeTimer <= 0) this.controls.autoRotate = true;
    }

    for (const u of this.updaters) u(this.elapsed, dt);
    updateDrips(this.elapsed);
    this.wetMat.uniforms.uTime.value = this.elapsed;
    this.syncWetLights();

    this.controls.update();
    this.grade.uniforms.uTime.value = this.elapsed;
    this.composer.render();
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onWinResize);
    this.ro?.disconnect();
    this.controls.dispose();

    this.scene.traverse((o) => {
      const any = o as THREE.Mesh;
      if (any.geometry) any.geometry.dispose();
      const m = (any as THREE.Mesh).material;
      if (Array.isArray(m)) m.forEach((x) => x.dispose());
      else if (m) (m as THREE.Material).dispose();
    });
    this.composer.dispose();
    this.renderer.dispose();
    clearMaterialCache();
    resetDrips();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

/* ---------- screen-space backdrop gradient ---------- */
function makeBackdropTexture() {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 512;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#04060d');
  grd.addColorStop(0.3, '#0a1124');
  grd.addColorStop(0.58, '#151d3a');
  grd.addColorStop(0.78, '#25284a');
  grd.addColorStop(1, '#3a3050');
  g.fillStyle = grd;
  g.fillRect(0, 0, 8, 512);
  for (let i = 0; i < 60; i++) {
    g.globalAlpha = 0.1 + Math.random() * 0.4;
    g.fillStyle = '#cfe0ff';
    g.fillRect(Math.random() * 8, Math.random() * 230, 1, 1);
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
