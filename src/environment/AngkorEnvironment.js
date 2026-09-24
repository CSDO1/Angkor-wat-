import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createStoneMaterial, createGroundMaterial, createSimpleWorldMaterial } from '../materials/EnvironmentMaterials.js';

const BASE = 'assets/environment/angkor_wat/';

/**
 * The Angkor Wat environment built from pet_model.blend / angkor_wat.blend by
 * tools/blender/export_angkor.py: merged, AO-baked visual chunks with LODs, plus the separate
 * collision mesh and level metadata. Loaded once; menus never reload it.
 */
export class AngkorEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'AngkorWat';
    this.lods = [];
    this.level = null;
    this.collisionGeometry = null;
    this.lodScale = 1;
  }

  async load(onProgress) {
    const loader = new GLTFLoader();
    const tex = new THREE.TextureLoader().loadAsync('assets/textures/T_Khmer_Rosette_Normal.png');
    const level = fetch(BASE + 'level.json').then((r) => r.json());
    const collision = loader.loadAsync(BASE + 'angkor_collision.glb');
    const visual = loader.loadAsync(BASE + 'angkor_visual.glb', (e) => onProgress?.(e.total ? e.loaded / e.total : 0));

    const rosette = await tex;
    rosette.wrapS = rosette.wrapT = THREE.RepeatWrapping;
    rosette.colorSpace = THREE.NoColorSpace;
    rosette.anisotropy = 4;
    this.rosette = rosette;
    this.materials = {
      Stone: createStoneMaterial(rosette),
      Ground_Grass_Soil: createGroundMaterial(),
      Foliage_Distant_Forest: createSimpleWorldMaterial({ color: 0x1b2b12, roughness: 1 }),
    };

    this.level = await level;
    const vis = await visual;
    const groups = new Map();
    vis.scene.traverse((o) => {
      if (!o.isMesh) return;
      const [base, lod] = o.name.split('__LOD');
      if (!groups.has(base)) groups.set(base, []);
      groups.get(base)[Number(lod) || 0] = o;
    });
    for (const [name, levels] of groups) {
      const matName = levels[0].userData.material ?? name.split('__')[0];
      const mat = this.materials[matName] ?? this.materials.Stone;
      const lod = new THREE.LOD();
      lod.name = name;
      levels.forEach((m, i) => {
        if (!m) return;
        m.material = mat;
        m.castShadow = matName === 'Stone';
        m.receiveShadow = true;
        m.geometry.computeBoundingSphere();
        m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); m.scale.set(1, 1, 1);
        lod.addLevel(m, 0);
      });
      // centre the LOD pivot on the chunk so distances are measured to the chunk, not the origin
      const bs = levels[0].geometry.boundingSphere;
      lod.userData.center = bs.center.clone();
      lod.userData.radius = bs.radius;
      lod.position.copy(bs.center);
      for (const l of lod.levels) l.object.position.copy(bs.center).negate();
      lod.autoUpdate = true;
      lod.userData.isGround = matName !== 'Stone';
      this.lods.push(lod);
      this.root.add(lod);
    }
    this.setLodDistance(1);
    this.scene.add(this.root);

    const col = await collision;
    col.scene.traverse((o) => { if (o.isMesh && !this.collisionGeometry) this.collisionGeometry = o.geometry; });
    return this;
  }

  /** Scales the distance at which chunks switch to their decimated LOD1. */
  setLodDistance(scale) {
    this.lodScale = scale;
    for (const lod of this.lods) {
      if (lod.levels.length > 1) lod.levels[1].distance = (lod.userData.radius + 90) * scale;
    }
  }

  stats() {
    let tris = 0;
    for (const lod of this.lods) {
      const g = lod.levels[0].object.geometry;
      tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    }
    return { chunks: this.lods.length, tris };
  }
}
