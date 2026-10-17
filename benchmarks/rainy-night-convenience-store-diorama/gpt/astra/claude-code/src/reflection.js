import * as THREE from 'three';

// A horizontal mirror with world-space clipping. Unlike a perspective oblique
// near plane, this also preserves an orthographic camera's parallel projection.
export class WetReflection extends THREE.Mesh {
  constructor(geometry, { shader, resolution = 1024, height = .088 }) {
    const uniforms = THREE.UniformsUtils.clone(shader.uniforms);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
    });
    super(geometry, material);
    this.isReflector = true;
    this.userData.dynamic = true;
    this.rotation.x = -Math.PI / 2;
    this.position.y = height;
    this.target = new THREE.WebGLRenderTarget(resolution, resolution, {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: true,
    });
    uniforms.tDiffuse.value = this.target.texture;
    const normal = new THREE.Vector3(0, 1, 0);
    const reflectedPosition = new THREE.Vector3();
    const lookAt = new THREE.Vector3();
    const orientation = new THREE.Quaternion();
    const clip = new THREE.Plane(normal, -height);
    let mirrorCamera;

    this.onBeforeRender = (renderer, scene, camera) => {
      if (camera.position.y < height) return;
      if (!mirrorCamera || mirrorCamera.type !== camera.type) mirrorCamera = camera.clone();
      mirrorCamera.copy(camera, false);
      mirrorCamera.layers.disable(1);
      camera.getWorldPosition(reflectedPosition);
      camera.getWorldDirection(lookAt).add(reflectedPosition);
      reflectedPosition.y = height * 2 - reflectedPosition.y;
      lookAt.y = height * 2 - lookAt.y;
      mirrorCamera.position.copy(reflectedPosition);
      camera.getWorldQuaternion(orientation);
      mirrorCamera.up.set(0, 1, 0).applyQuaternion(orientation).reflect(normal).negate();
      mirrorCamera.lookAt(lookAt);
      mirrorCamera.updateMatrixWorld();
      mirrorCamera.projectionMatrix.copy(camera.projectionMatrix);
      mirrorCamera.projectionMatrixInverse.copy(mirrorCamera.projectionMatrix).invert();
      uniforms.textureMatrix.value.set(
        .5, 0, 0, .5,
        0, .5, 0, .5,
        0, 0, .5, .5,
        0, 0, 0, 1,
      ).multiply(mirrorCamera.projectionMatrix)
        .multiply(mirrorCamera.matrixWorldInverse)
        .multiply(this.matrixWorld);

      const target = renderer.getRenderTarget();
      const clippingPlanes = renderer.clippingPlanes;
      const xrEnabled = renderer.xr.enabled;
      const shadowAutoUpdate = renderer.shadowMap.autoUpdate;
      this.visible = false;
      renderer.xr.enabled = false;
      renderer.shadowMap.autoUpdate = false;
      renderer.clippingPlanes = [clip];
      try {
        renderer.setRenderTarget(this.target);
        renderer.state.buffers.depth.setMask(true);
        renderer.clear();
        renderer.render(scene, mirrorCamera);
      } finally {
        renderer.setRenderTarget(target);
        renderer.clippingPlanes = clippingPlanes;
        renderer.xr.enabled = xrEnabled;
        renderer.shadowMap.autoUpdate = shadowAutoUpdate;
        this.visible = true;
      }
    };
  }
  dispose() {
    this.target.dispose();
    this.geometry.dispose();
    this.material.dispose();
  }
}
