import * as THREE from 'three';

/** Dark studio void the miniature sits in: vertical gradient + city bloom. */
export function buildAtmosphere(scene) {
  const geo = new THREE.SphereGeometry(150, 32, 20);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: new THREE.Color('#070b18') },
      uMid: { value: new THREE.Color('#101a33') },
      uBot: { value: new THREE.Color('#03050c') },
      uGlow: { value: new THREE.Color('#2a3358') },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uTop, uMid, uBot, uGlow;
      uniform float uTime;
      varying vec3 vDir;
      float h21(vec2 p){ p = fract(p*vec2(127.31,311.7)); p += dot(p,p+34.4); return fract(p.x*p.y); }
      void main() {
        float y = vDir.y * 0.5 + 0.5;
        vec3 col = mix(uBot, uMid, smoothstep(0.18, 0.52, y));
        col = mix(col, uTop, smoothstep(0.52, 0.95, y));
        // warm-ish city haze low behind the model
        float haze = exp(-pow((y - 0.44) / 0.16, 2.0));
        float azim = smoothstep(-0.2, 1.0, -vDir.z * 0.6 + vDir.x * 0.3);
        col += uGlow * haze * (0.35 + azim * 0.5);
        // very fine dither to stop banding on the gradient
        col += (h21(gl_FragCoord.xy) - 0.5) * 0.006;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.frustumCulled = false;
  scene.add(sky);

  // light spill beneath the base — sells the "model on a dark table" read
  const spillMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uColor: { value: new THREE.Color('#3c5a8c') }, uI: { value: 0.30 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uI; varying vec2 vUv;
      void main(){
        float d = length(vUv - 0.5) * 2.0;
        float a = exp(-pow(d/0.55,2.0)) * (1.0 - smoothstep(0.7,1.0,d));
        gl_FragColor = vec4(uColor, a*uI);
      }`,
  });
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), spillMat);
  spill.rotation.x = -Math.PI / 2;
  spill.position.y = -1.05;
  spill.renderOrder = -1;
  scene.add(spill);

  return { update(t) { mat.uniforms.uTime.value = t; } };
}