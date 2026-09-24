import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createFoliageMaterial } from '../materials/EnvironmentMaterials.js';
import { worldMaterial } from '../materials/WorldShading.js';

const BASE = 'assets/environment/vegetation/';

/**
 * GPU-instanced vegetation from the Blender Geometry Nodes scatter:
 *  - palms, trees, bushes, ferns and lotus use the exported library meshes;
 *  - the distant forest (33k trees) uses a tiny canopy mesh, chunked for frustum culling;
 *  - grass uses a light 3-blade clump, chunked and only drawn near the camera;
 *  - window balusters use a simplified lathe (the source has 336 triangles each).
 * Density scales with the Vegetation Density setting without reloading anything.
 */
export class Vegetation {
  constructor(scene, collision) {
    this.scene = scene;
    this.collision = collision;
    this.groups = [];
    this.grassChunks = [];
    this.forestChunks = [];
    this.density = 1;
    this.grassDistance = 70;
    this.viewDistance = 1500;
    this._tmp = new THREE.Object3D();
  }

  async load() {
    const [gltf, meta, bin] = await Promise.all([
      new GLTFLoader().loadAsync(BASE + 'vegetation.glb'),
      fetch(BASE + 'instances.json').then((r) => r.json()),
      fetch(BASE + 'instances.bin').then((r) => r.arrayBuffer()),
    ]);
    const lib = {};
    gltf.scene.traverse((o) => {
      if (o.isMesh || o.isGroup) {
        const name = o.name.replace(/_\d+$/, '');
        if (!lib[name]) lib[name] = [];
      }
    });
    // each library node becomes a list of {geometry, material name}
    gltf.scene.children.forEach((node) => {
      const parts = [];
      node.traverse((o) => { if (o.isMesh) parts.push({ geo: o.geometry, mat: o.material.name }); });
      lib[node.name] = parts;
    });

    const data = new Float32Array(bin);
    const sets = {};
    for (const [name, s] of Object.entries(meta.sets)) {
      sets[name] = { ...s, arr: data.subarray(s.offset / 4, s.offset / 4 + s.count * 5) };
    }

    const matCache = {};
    const mat = (name) => (matCache[name] ??= createFoliageMaterial(name));

    // --- palms and near trees (library meshes), with trunk colliders ------------------------
    const trunk = { Palm: 0.28, Tree: 0.55 };
    for (const name of Object.keys(sets)) {
      if (name.startsWith('Grass') || name === 'Baluster_Source') continue;
      const s = name.startsWith('Palm') ? withoutApproach(sets[name]) : sets[name];
      const isForest = name.endsWith('_LOD1');
      if (isForest) continue;
      this._addInstanced(name, lib[name], s.arr, mat, { cast: !name.startsWith('Lotus'), minDensity: name.startsWith('Palm') || name.includes('LOD0') ? 1 : 0.2 });
      const r = name.startsWith('Palm') ? trunk.Palm : name.startsWith('Tree') ? trunk.Tree : 0;
      if (r) for (let i = 0; i < s.count; i++) {
        const o = i * 5;
        this.collision.addTrunk(s.arr[o], s.arr[o + 2], r * s.arr[o + 4]);
      }
    }

    // --- mid-distance broadleaf (LOD1 meshes) + distant forest (canopy blobs) -------------------
    const canopy = makeCanopyGeometry();
    const canopyMat = createFoliageMaterial('Foliage_Distant_Forest', { sway: 0.2, flutter: 0 });
    for (const name of Object.keys(sets).filter((n) => n.endsWith('_LOD1'))) {
      const s = sets[name];
      const near = [], far = [];
      for (let i = 0; i < s.count; i++) {
        const o = i * 5, x = s.arr[o], z = s.arr[o + 2];
        // inside the moat island -> real LOD1 tree mesh with a trunk collider; beyond -> canopy blob
        const onIsland = Math.abs(x) < 405 && z > -295 && z < 465;
        (onIsland ? near : far).push(...s.arr.subarray(o, o + 5));
        if (onIsland) this.collision.addTrunk(x, z, 0.5 * s.arr[o + 4]);
      }
      this._addInstanced(name, lib[name], new Float32Array(near), mat, { cast: true, minDensity: 0.3 });
      this._addChunked(this.forestChunks, canopy, canopyMat, new Float32Array(far), 400, { cast: false, lodDensity: 0.25 });
    }

    // --- grass ----------------------------------------------------------------------------
    const grassGeo = makeGrassClump();
    const grassMat = createFoliageMaterial('Grass_Blades', { sway: 0.6, flutter: 0.5 });
    const grassSets = Object.keys(sets).filter((n) => n.startsWith('Grass')).map((n) => sets[n].arr);
    const g = new Float32Array(grassSets.reduce((a, s) => a + s.length, 0));
    grassSets.reduce((off, s) => (g.set(s, off), off + s.length), 0);
    this._addChunked(this.grassChunks, grassGeo, grassMat, g, 24, { cast: false, lodDensity: 0.15, layer: 1 });

    // --- balusters (architecture detail, simplified) ------------------------------------------
    if (sets.Baluster_Source) {
      const src = lib.Baluster_Source?.[0]?.geo;
      src?.computeBoundingBox();
      const h = src ? src.boundingBox.max.y - src.boundingBox.min.y : 1.6;
      const geo = makeBalusterGeometry(h);
      const m = worldMaterial(new THREE.MeshStandardMaterial({ color: 0x6b5a45, roughness: 0.9 }));
      this._addInstanced('Baluster', [{ geo, mat: '' }], sets.Baluster_Source.arr, () => m, { cast: true, minDensity: 1 });
    }
    this.setDensity(this.density);
    return this;
  }

  /**
   * Library-mesh instancing, split into 150 m cells so frustum culling (camera and shadow map) works
   * per cell instead of per island-wide mesh.
   */
  _addInstanced(name, parts, arr, mat, { cast, minDensity, cell = 150 }) {
    const total = arr.length / 5;
    if (!total || !parts) return;
    const cells = new Map();
    for (let i = 0; i < total; i++) {
      const k = `${Math.floor(arr[i * 5] / cell)},${Math.floor(arr[i * 5 + 2] / cell)}`;
      if (!cells.has(k)) cells.set(k, []);
      cells.get(k).push(i);
    }
    const t = this._tmp;
    for (const idx of cells.values()) {
      // shuffle-stable order so reducing the instance count thins evenly
      idx.sort((a, b) => hash(a) - hash(b));
      const meshes = parts.map((p) => {
        const m = new THREE.InstancedMesh(p.geo, mat(p.mat), idx.length);
        m.castShadow = cast; m.receiveShadow = true; m.name = name;
        return m;
      });
      idx.forEach((src, i) => {
        const o = src * 5;
        t.position.set(arr[o], arr[o + 1], arr[o + 2]);
        t.rotation.set(0, arr[o + 3], 0);
        t.scale.setScalar(arr[o + 4]);
        t.updateMatrix();
        for (const m of meshes) m.setMatrixAt(i, t.matrix);
      });
      for (const m of meshes) { m.computeBoundingSphere(); this.scene.add(m); }
      this.groups.push({ meshes, count: idx.length, minDensity });
    }
  }

  _addChunked(list, geo, material, arr, cellSize, { cast, lodDensity, layer = 0 }) {
    const cells = new Map();
    for (let i = 0; i < arr.length; i += 5) {
      const k = `${Math.floor(arr[i] / cellSize)},${Math.floor(arr[i + 2] / cellSize)}`;
      if (!cells.has(k)) cells.set(k, []);
      cells.get(k).push(i);
    }
    const t = this._tmp;
    for (const idx of cells.values()) {
      idx.sort((a, b) => hash(a) - hash(b));
      const m = new THREE.InstancedMesh(geo, material, idx.length);
      idx.forEach((o, i) => {
        t.position.set(arr[o], arr[o + 1], arr[o + 2]);
        t.rotation.set(0, arr[o + 3], 0);
        t.scale.setScalar(arr[o + 4]);
        t.updateMatrix();
        m.setMatrixAt(i, t.matrix);
      });
      m.computeBoundingSphere();
      m.castShadow = cast; m.receiveShadow = true;
      m.layers.set(layer);
      m.userData.full = idx.length;
      m.userData.lodDensity = lodDensity;
      this.scene.add(m);
      list.push(m);
    }
  }

  setDensity(d) {
    this.density = d;
    for (const g of this.groups) {
      const n = Math.max(1, Math.round(g.count * Math.max(g.minDensity, d)));
      for (const m of g.meshes) m.count = n;
    }
  }

  /** Distance-based visibility / thinning for chunked instancing. Cheap: runs over ~200 chunks. */
  update(camera) {
    const cp = camera.position;
    for (const m of this.grassChunks) {
      const d = m.boundingSphere.center.distanceTo(cp) - m.boundingSphere.radius;
      m.visible = d < this.grassDistance;
      if (m.visible) {
        const fall = THREE.MathUtils.clamp(1 - d / this.grassDistance, 0.25, 1);
        m.count = Math.max(1, Math.round(m.userData.full * this.density * fall));
      }
    }
    for (const m of this.forestChunks) {
      const d = m.boundingSphere.center.distanceTo(cp) - m.boundingSphere.radius;
      m.visible = d < this.viewDistance;
      if (m.visible) m.count = Math.max(1, Math.round(m.userData.full * Math.max(0.25, this.density)));
    }
  }
}

function hash(i) { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }

/** Low-poly canopy blob (8 tris) with the same colour conventions as the library meshes. */
function makeCanopyGeometry() {
  // distant trees are only ever seen through haze: an 8-triangle canopy is enough
  const crown = new THREE.OctahedronGeometry(4.4, 0);
  crown.scale(1.15, 0.8, 1.15).translate(0, 8.0, 0);
  const geo = mergeGeometries([crown]);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i++) col.set([pos.getY(i) / 12, (Math.sin(i * 7.1) + 1) / 2, 0, 1], i * 4);
  geo.setAttribute('color', new THREE.BufferAttribute(col, 4));
  geo.computeVertexNormals();
  return geo;
}

/** A tuft of seven thin, slightly bent blades (two segments each). Height ~0.45 m. */
function makeGrassClump() {
  const pos = [], col = [];
  const blade = (ang, off, h, w, lean, shade) => {
    const c = Math.cos(ang), s = Math.sin(ang);
    const px = -s * w, pz = c * w;                    // half-width across the blade
    const ox = Math.cos(ang + 1.3) * off, oz = Math.sin(ang + 1.3) * off;
    const lx = c * lean, lz = s * lean;
    const p0 = [ox - px, 0, oz - pz], p1 = [ox + px, 0, oz + pz];
    const m0 = [ox - px * 0.7 + lx * 0.35, h * 0.55, oz - pz * 0.7 + lz * 0.35], m1 = [ox + px * 0.7 + lx * 0.35, h * 0.55, oz + pz * 0.7 + lz * 0.35];
    const tip = [ox + lx, h, oz + lz];
    for (const t of [[p0, p1, m1], [p0, m1, m0], [m0, m1, tip]]) for (const v of t) {
      pos.push(...v); col.push(v[1] / h, shade, 0, 1);
    }
  };
  for (let k = 0; k < 7; k++) {
    const a = k * 2.39996;
    blade(a, 0.03 + (k % 3) * 0.03, 0.32 + ((k * 37) % 10) / 60, 0.018, 0.08 + (k % 2) * 0.07, 0.2 + (k % 4) * 0.2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
  g.computeVertexNormals();
  // soft, mostly-up normals give even lighting on thin blades
  const n = g.attributes.normal;
  for (let i = 0; i < n.count; i++) { const x = n.getX(i) * 0.35, z = n.getZ(i) * 0.35; const l = Math.hypot(x, 1, z); n.setXYZ(i, x / l, 1 / l, z / l); }
  return g;
}

function makeBalusterGeometry(h) {
  const prof = [[0.07, 0], [0.07, 0.08], [0.05, 0.14], [0.075, 0.35], [0.05, 0.5], [0.075, 0.65], [0.05, 0.86], [0.07, 0.92], [0.07, 1]];
  const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r * 1.3, y * h)), 6);
  return g;
}

/** Keep the paved western approach clear of trees (a few palms of the far-bank scatter stood on it). */
function withoutApproach(set) {
  const out = [];
  for (let i = 0; i < set.count; i++) {
    const o = i * 5, x = set.arr[o], z = set.arr[o + 2];
    if (Math.abs(x) < 22 && z > 570 && z < 650) continue;
    for (let k = 0; k < 5; k++) out.push(set.arr[o + k]);
  }
  return { ...set, count: out.length / 5, arr: new Float32Array(out) };
}
