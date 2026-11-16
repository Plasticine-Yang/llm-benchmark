import * as THREE from 'three';

export function buildAtmosphere(dripAnchors = []) {
  const group = new THREE.Group();
  group.name = 'Atmosphere';

  // --- 1. Anime Rainy Night Gradient Sky Dome ---
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vWorldDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vWorldDir;
      void main() {
        float h = vWorldDir.y;
        vec3 zenith = vec3(0.028, 0.044, 0.095);
        vec3 horizon = vec3(0.082, 0.125, 0.235);
        vec3 abyss = vec3(0.025, 0.035, 0.072);

        vec3 col = mix(horizon, zenith, smoothstep(0.0, 0.62, max(h, 0.0)));
        col = mix(col, abyss, smoothstep(0.0, -0.35, min(h, 0.0)));

        // Subtle atmospheric horizon glow behind the corner store
        float mistBand = exp(-pow(h * 5.0, 2.0)) * 0.06;
        col += vec3(0.18, 0.30, 0.55) * mistBand;

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(85, 32, 24), skyMat);
  group.add(skyDome);

  // --- 2. Continuous Diagonal Anime Rain Curtain (持续降雨) ---
  const rainCount = 1150;
  const rainPositions = new Float32Array(rainCount * 6);
  const rainState = [];
  const windX = 1.05;
  const windZ = 0.55;
  const fallSpeed = 14.5;

  const isInsideBuildingRoof = (x, y, z) => {
    if (y > 3.25) return false;
    const inStore = x > -5.7 && x < 2.1 && z > -5.9 && z < 1.1;
    const inAwning = x > -5.7 && x < 2.85 && z > 0.95 && z < 2.25 && y < 3.08;
    const inRightAwning = x > 1.95 && x < 2.85 && z > -1.9 && z < 2.25 && y < 3.08;
    const inNeighbor = x > -8.9 && x < -7.2 && z > -8.5 && z < -0.6 && y < 5.1;
    return inStore || inAwning || inRightAwning || inNeighbor;
  };

  for (let i = 0; i < rainCount; i++) {
    const x = (Math.random() - 0.5) * 18.2;
    const z = (Math.random() - 0.5) * 18.2;
    const y = Math.random() * 13.5 + 0.15;
    const len = 0.36 + Math.random() * 0.28;
    const speedMult = 0.88 + Math.random() * 0.26;
    rainState.push({ x, y, z, len, speedMult });
  }

  const rainGeom = new THREE.BufferGeometry();
  rainGeom.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rainMat = new THREE.LineBasicMaterial({
    color: 0xb6d8ff,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  const rainLines = new THREE.LineSegments(rainGeom, rainMat);
  rainLines.frustumCulled = false;
  group.add(rainLines);

  // --- 3. Awning Eaves Rain Drips (屋檐滴水) ---
  const dripsPerAnchor = 2;
  const totalDrips = dripAnchors.length * dripsPerAnchor;
  const dripGeom = new THREE.SphereGeometry(0.022, 8, 8);
  const dripMat = new THREE.MeshBasicMaterial({
    color: 0xdff5ff,
    transparent: true,
    opacity: 0.85,
  });
  const dripInst = totalDrips > 0 ? new THREE.InstancedMesh(dripGeom, dripMat, totalDrips) : null;
  const dripData = [];
  if (dripInst) {
    for (let i = 0; i < dripAnchors.length; i++) {
      for (let k = 0; k < dripsPerAnchor; k++) {
        dripData.push({
          anchor: dripAnchors[i],
          phase: Math.random(),
          period: 1.05 + Math.random() * 0.85,
        });
      }
    }
    dripInst.frustumCulled = false;
    group.add(dripInst);
  }

  // --- 4. Ground Puddle Splash Ripple Rings (地面积水波纹) ---
  const rippleCount = 32;
  const rippleGeom = new THREE.RingGeometry(0.76, 1.0, 20);
  rippleGeom.rotateX(-Math.PI / 2);
  const rippleMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const rippleInst = new THREE.InstancedMesh(rippleGeom, rippleMat, rippleCount);
  const rippleColor = new THREE.Color(0xd6eeff);

  const pickRippleSpot = (idx) => {
    // First batch hits directly under awning drip spots; remaining hit wet road & sidewalk puddles
    if (idx < dripAnchors.length && dripAnchors.length > 0) {
      const a = dripAnchors[idx];
      return { x: a.x, y: 0.146, z: a.z };
    }
    const zones = [
      { cx: 3.6, cz: 5.4, rx: 1.7, rz: 1.1, y: 0.008 },
      { cx: 5.3, cz: 3.3, rx: 1.2, rz: 1.7, y: 0.008 },
      { cx: -3.4, cz: 5.1, rx: 2.0, rz: 0.9, y: 0.008 },
      { cx: 5.8, cz: -3.2, rx: 1.2, rz: 2.0, y: 0.008 },
      { cx: 6.2, cz: 6.2, rx: 1.5, rz: 1.4, y: 0.008 },
      { cx: -6.4, cz: 5.1, rx: 1.0, rz: 0.8, y: 0.008 },
      { cx: 2.95, cz: 2.45, rx: 0.65, rz: 0.55, y: 0.146 },
      { cx: -1.65, cz: 2.85, rx: 0.6, rz: 0.45, y: 0.146 },
    ];
    const z = zones[idx % zones.length];
    return {
      x: z.cx + (Math.random() - 0.5) * 2 * z.rx,
      y: z.y,
      z: z.cz + (Math.random() - 0.5) * 2 * z.rz,
    };
  };

  const rippleData = [];
  for (let i = 0; i < rippleCount; i++) {
    const spot = pickRippleSpot(i);
    rippleData.push({
      ...spot,
      age: Math.random(),
      duration: 0.75 + Math.random() * 0.55,
      maxRadius: i < dripAnchors.length ? 0.18 : 0.24 + Math.random() * 0.12,
    });
  }
  rippleInst.frustumCulled = false;
  group.add(rippleInst);

  const dummy = new THREE.Object3D();

  return {
    group,
    update(dt, time) {
      const clampedDt = Math.min(dt, 0.05);

      // Update falling rain streaks
      const posAttr = rainGeom.getAttribute('position');
      for (let i = 0; i < rainCount; i++) {
        const s = rainState[i];
        const v = fallSpeed * s.speedMult;
        s.x += windX * s.speedMult * clampedDt;
        s.z += windZ * s.speedMult * clampedDt;
        s.y -= v * clampedDt;

        if (
          s.y < 0.05 ||
          Math.abs(s.x) > 9.3 ||
          Math.abs(s.z) > 9.3 ||
          isInsideBuildingRoof(s.x, s.y, s.z)
        ) {
          s.x = (Math.random() - 0.5) * 18.2;
          s.z = (Math.random() - 0.5) * 18.2;
          s.y = 12.2 + Math.random() * 2.5;
        }

        const idx = i * 6;
        posAttr.array[idx] = s.x;
        posAttr.array[idx + 1] = s.y;
        posAttr.array[idx + 2] = s.z;
        // Streak tail trails slightly up-back along rain vector
        const tailScale = s.len / v;
        posAttr.array[idx + 3] = s.x - windX * s.speedMult * tailScale;
        posAttr.array[idx + 4] = s.y + v * tailScale;
        posAttr.array[idx + 5] = s.z - windZ * s.speedMult * tailScale;
      }
      posAttr.needsUpdate = true;

      // Update eaves droplets
      if (dripInst) {
        for (let i = 0; i < dripData.length; i++) {
          const d = dripData[i];
          const t = ((time / d.period) + d.phase) % 1.0;
          if (t < 0.38) {
            // Droplet swells at awning edge
            const swell = t / 0.38;
            dummy.position.set(d.anchor.x, d.anchor.y - 0.02 * swell, d.anchor.z);
            dummy.scale.set(0.55 + swell * 0.55, 0.7 + swell * 0.85, 0.55 + swell * 0.55);
          } else {
            // Free fall from awning edge (2.93) to sidewalk (0.145)
            const fallT = (t - 0.38) / 0.62;
            const dropY = THREE.MathUtils.lerp(d.anchor.y, 0.145, fallT * fallT);
            dummy.position.set(d.anchor.x, dropY, d.anchor.z);
            dummy.scale.set(0.7, 2.3, 0.7);
          }
          dummy.updateMatrix();
          dripInst.setMatrixAt(i, dummy.matrix);
        }
        dripInst.instanceMatrix.needsUpdate = true;
      }

      // Update 3D ground splash rings
      for (let i = 0; i < rippleCount; i++) {
        const rp = rippleData[i];
        rp.age += clampedDt / rp.duration;
        if (rp.age >= 1.0) {
          rp.age -= 1.0;
          if (i >= dripAnchors.length) {
            const spot = pickRippleSpot(i);
            rp.x = spot.x;
            rp.y = spot.y;
            rp.z = spot.z;
          }
        }
        const radius = 0.025 + rp.age * rp.maxRadius;
        const fade = 1.0 - rp.age;
        dummy.position.set(rp.x, rp.y, rp.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(radius, 1, radius);
        dummy.updateMatrix();
        rippleInst.setMatrixAt(i, dummy.matrix);
        rippleColor.setRGB(0.84 * fade, 0.94 * fade, 1.0 * fade);
        rippleInst.setColorAt(i, rippleColor);
      }
      rippleInst.instanceMatrix.needsUpdate = true;
      if (rippleInst.instanceColor) rippleInst.instanceColor.needsUpdate = true;
    },
  };
}
