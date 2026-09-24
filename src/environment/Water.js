import * as THREE from 'three';
import { createWaterMaterial } from '../materials/WaterMaterial.js';

/**
 * Planar reflection shared by the moat and both reflecting ponds (one render for all water).
 * The mirror plane sits at the moat height; the ponds are only 0.5 m higher so the error is invisible.
 */
class PlanarReflection {
  constructor(planeY) {
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY);
    this.camera = new THREE.PerspectiveCamera();
    this.textureMatrix = new THREE.Matrix4();
    this.target = null;
    this.scale = 0;
    this.frame = 0;
    this.interval = 1;
    this._v = new THREE.Vector3(); this._n = new THREE.Vector3(); this._look = new THREE.Vector3();
    this._r = new THREE.Vector3(); this._clip = new THREE.Vector4(); this._q = new THREE.Vector4();
  }

  setQuality(scale, interval) {
    this.scale = scale; this.interval = interval;
    if (!scale) { this.target?.dispose(); this.target = null; }
  }

  resize(w, h) {
    if (!this.scale) return;
    const W = Math.max(64, Math.round(w * this.scale)), H = Math.max(64, Math.round(h * this.scale));
    if (!this.target) this.target = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 0 });
    else this.target.setSize(W, H);
  }

  render(renderer, scene, camera, hide) {
    if (!this.target || (this.frame++ % this.interval) !== 0) return;
    const p = this.plane, n = this._n.copy(p.normal);
    const planePos = this._v.copy(n).multiplyScalar(-p.constant);
    const camPos = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
    if (camPos.y < planePos.y) return;
    const rc = this.camera;
    const view = new THREE.Vector3().subVectors(planePos, camPos).reflect(n).negate().add(planePos);
    const rot = new THREE.Matrix4().extractRotation(camera.matrixWorld);
    const look = this._look.set(0, 0, -1).applyMatrix4(rot).add(camPos);
    const target = new THREE.Vector3().subVectors(planePos, look).reflect(n).negate().add(planePos);
    rc.position.copy(view);
    rc.up.set(0, 1, 0).applyMatrix4(rot).reflect(n);
    rc.lookAt(target);
    rc.far = camera.far; rc.near = camera.near;
    rc.updateMatrixWorld();
    rc.projectionMatrix.copy(camera.projectionMatrix);
    rc.layers.set(0);
    rc.layers.enable(2);   // occlusion-culled chunks are still visible in reflections

    this.textureMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    this.textureMatrix.multiply(rc.projectionMatrix).multiply(rc.matrixWorldInverse);

    // oblique near plane clipping (Lengyel)
    const rp = p.clone().applyMatrix4(rc.matrixWorldInverse);
    const clip = this._clip.set(rp.normal.x, rp.normal.y, rp.normal.z, rp.constant);
    const pm = rc.projectionMatrix;
    const q = this._q;
    q.x = (Math.sign(clip.x) + pm.elements[8]) / pm.elements[0];
    q.y = (Math.sign(clip.y) + pm.elements[9]) / pm.elements[5];
    q.z = -1.0;
    q.w = (1.0 + pm.elements[10]) / pm.elements[14];
    clip.multiplyScalar(2.0 / clip.dot(q));
    pm.elements[2] = clip.x; pm.elements[6] = clip.y; pm.elements[10] = clip.z + 1.0; pm.elements[14] = clip.w;

    for (const o of hide) o.visible = false;
    const prevRT = renderer.getRenderTarget();
    const prevShadow = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(this.target);
    renderer.clear();
    renderer.render(scene, rc);
    renderer.setRenderTarget(prevRT);
    renderer.shadowMap.autoUpdate = prevShadow;
    for (const o of hide) o.visible = true;
  }
}

export class WaterSystem {
  constructor(scene, level) {
    this.scene = scene;
    this.meshes = [];
    this.bodies = level.water;
    const moat = level.water.find((w) => w.name === 'Water_Moat');
    this.reflection = new PlanarReflection(moat ? moat.y : -1.2);
    for (const w of level.water) {
      const calm = w.name === 'Water_Moat' ? 0.25 : 0.85;
      const mat = createWaterMaterial({ calm, tint: w.name === 'Water_Moat' ? 0x0c1c17 : 0x0a1915 });
      mat.uniforms.textureMatrix.value = this.reflection.textureMatrix;
      const geo = new THREE.PlaneGeometry(w.x1 - w.x0, w.z1 - w.z0, 1, 1).rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((w.x0 + w.x1) / 2, w.y, (w.z0 + w.z1) / 2);
      mesh.name = w.name;
      mesh.renderOrder = -1;
      scene.add(mesh);
      this.meshes.push(mesh);
    }
  }

  /** Height of the water surface under (x, z), or null. Ponds take priority over the moat. */
  levelAt(x, z) {
    let best = null;
    for (const w of this.bodies) {
      if (x > w.x0 && x < w.x1 && z > w.z0 && z < w.z1) if (best === null || w.y > best) best = w.y;
    }
    return best;
  }

  setQuality(q) {
    // q: 0 off, 1 low (quarter res, every 3rd frame), 2 high (half res, every other frame), 3 ultra (full-ish res)
    const cfg = [[0, 1], [0.25, 3], [0.5, 2], [0.75, 1]][q] ?? [0, 1];
    this.reflection.setQuality(cfg[0], cfg[1]);
    if (this.size) this.reflection.resize(this.size.w, this.size.h);
    for (const m of this.meshes) m.material.uniforms.uHasReflection.value = cfg[0] ? 1 : 0;
  }

  resize(w, h) { this.size = { w, h }; this.reflection.resize(w, h); }

  update(renderer, scene, camera, sky) {
    for (const m of this.meshes) {
      const u = m.material.uniforms;
      u.tReflection.value = this.reflection.target?.texture ?? null;
      u.uSkyColor.value.copy(sky.zenith);
      u.uHorizon.value.copy(sky.horizon);
      u.uSunColor.value.copy(sky.sunColor);
    }
    this.reflection.render(renderer, scene, camera, this.meshes);
  }
}
