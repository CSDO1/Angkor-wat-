import * as THREE from 'three';
import { Pass } from 'three/addons/postprocessing/Pass.js';

/**
 * Temporal hardware occlusion culling (WebGL2 occlusion queries).
 * After the main scene is rendered, the bounding box of every architecture chunk is drawn
 * (no colour / depth writes) against the scene depth. Chunks whose box produced no samples for two
 * consecutive results are moved to a layer the main camera doesn't render — they still cast
 * shadows and appear in reflections. Their proxy keeps being tested, so they return as soon as
 * any part becomes visible. Frustum culling is handled by three.js; LODs and vegetation distance
 * culling live in their own systems.
 */
export const OCCLUDED_LAYER = 2;

export class OcclusionCuller {
  constructor(renderer, camera) {
    this.renderer = renderer;
    this.camera = camera;
    this.gl = renderer.getContext();
    this.enabled = !!this.gl.createQuery;
    this.scene = new THREE.Scene();
    this.mat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
    this.items = [];
    this.box = new THREE.BoxGeometry(1, 1, 1);
    this.stats = { tested: 0, hidden: 0 };
  }

  /** objects: THREE.Object3D whose children are meshes (e.g. THREE.LOD). */
  add(obj) {
    const bb = new THREE.Box3().setFromObject(obj);
    if (bb.isEmpty()) return;
    bb.expandByScalar(1.2);
    const proxy = new THREE.Mesh(this.box, this.mat);
    bb.getCenter(proxy.position); bb.getSize(proxy.scale);
    proxy.matrixAutoUpdate = false; proxy.updateMatrix();
    const item = { obj, proxy, bb, query: null, pending: false, hiddenCount: 0, occluded: false };
    proxy.onBeforeRender = () => {
      if (item.pending) return;
      item.query ??= this.gl.createQuery();
      this.gl.beginQuery(this.gl.ANY_SAMPLES_PASSED_CONSERVATIVE, item.query);
      item.active = true;
    };
    proxy.onAfterRender = () => {
      if (!item.active) return;
      this.gl.endQuery(this.gl.ANY_SAMPLES_PASSED_CONSERVATIVE);
      item.active = false; item.pending = true;
    };
    this.scene.add(proxy);
    this.items.push(item);
  }

  setEnabled(on) {
    this.enabled = on && !!this.gl.createQuery;
    if (!this.enabled) for (const it of this.items) this._show(it);
  }

  _show(it) { if (it.occluded) { it.occluded = false; it.obj.traverse((o) => o.layers.set(0)); } }
  _hide(it) { if (!it.occluded) { it.occluded = true; it.obj.traverse((o) => o.layers.set(OCCLUDED_LAYER)); } }

  /** Read back finished queries (non-blocking) and update visibility. Call once per frame. */
  update() {
    if (!this.enabled) return;
    const gl = this.gl, cam = this.camera.position;
    let hidden = 0;
    for (const it of this.items) {
      // never cull what the camera is inside of or very close to
      if (it.bb.distanceToPoint(cam) < 4) { this._show(it); it.hiddenCount = 0; continue; }
      if (it.pending && gl.getQueryParameter(it.query, gl.QUERY_RESULT_AVAILABLE)) {
        const visible = gl.getQueryParameter(it.query, gl.QUERY_RESULT) > 0;
        it.pending = false;
        if (visible) { it.hiddenCount = 0; this._show(it); }
        else if (++it.hiddenCount >= 2) this._hide(it);
      }
      if (it.occluded) hidden++;
    }
    this.stats = { tested: this.items.length, hidden };
  }
}

/** Composer pass that draws the occlusion proxies into the current depth buffer. */
export class OcclusionPass extends Pass {
  constructor(culler) { super(); this.culler = culler; this.needsSwap = false; }
  render(renderer, writeBuffer, readBuffer) {
    if (!this.culler.enabled) return;
    const auto = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
    renderer.render(this.culler.scene, this.culler.camera);
    renderer.autoClear = auto;
  }
}

/** Frame timing + optional FPS limiter. */
export class FrameClock {
  constructor() { this.last = performance.now(); this.acc = 0; this.frames = 0; this.fps = 0; this.fpsTimer = 0; this.limit = 0; }
  /** Returns dt in seconds, or 0 when this frame should be skipped by the FPS limiter. */
  tick(now) {
    const raw = (now - this.last) / 1000;
    if (this.limit && raw < 1 / this.limit - 0.002) return 0;
    this.last = now;
    this.frames++; this.fpsTimer += raw;
    if (this.fpsTimer >= 0.5) { this.fps = this.frames / this.fpsTimer; this.frames = 0; this.fpsTimer = 0; }
    return Math.min(raw, 0.1);
  }
}
