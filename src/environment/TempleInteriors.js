import * as THREE from 'three';
import { Carver, carveFace, createSculptureMaterial } from './KhmerSculptures.js';
import { worldMaterial } from '../materials/WorldShading.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { nagaGeometry, damagedBuddhaGeometry, balusterWindowGeometry } from './InteriorCarvings.js';

// Original meshes based on the supplied interior photographs; no photographic textures.
// All dimensions are in metres, local +Z faces the visitor.
function standingBuddha(detail) {
  const c = new Carver(detail);
  c.box([0, 0.09, 0], [0.72, 0.18, 0.66], 0.8);
  c.box([0, 0.235, 0], [0.62, 0.11, 0.56]);
  c.profile([[0.25, 0.29], [0.24, 0.34], [0.21, 0.39]], 0.85);
  for (const side of [-1, 1]) c.oval([side * 0.105, 0.42, 0.1], [0.082, 0.042, 0.15]);
  c.profile([[0.22, 0.46], [0.245, 0.58], [0.24, 0.94], [0.225, 1.23],
    [0.195, 1.43], [0.265, 1.7], [0.26, 1.87], [0.105, 1.99]], 0.6);
  c.limb([0, 1.97, 0], [0, 2.12, 0], 0.063);
  carveFace(c, 2.235, 0.005);
  c.oval([0, 2.345, -0.036], [0.156, 0.16, 0.113], 0.8);
  c.oval([0, 2.493, -0.03], [0.077, 0.082, 0.067]);
  if (detail) for (let row = 0; row < 3; row++) for (let j = 0; j < 14; j++) {
    const a = j / 14 * Math.PI * 2;
    c.oval([Math.sin(a) * 0.15, 2.31 + row * 0.048, -0.034 + Math.cos(a) * 0.112], [0.019, 0.023, 0.018], 0.76);
  }
  for (const side of [-1, 1]) {
    c.limb([side * 0.253, 1.84, 0], [side * 0.276, 1.48, 0.02], 0.057, 0.045);
    c.limb([side * 0.276, 1.48, 0.02], [side * 0.205, 1.27, 0.13], 0.044, 0.035);
    c.oval([side * 0.205, 1.26, 0.146], [0.043, 0.07, 0.031]);
  }
  c.tube([[-0.2, 1.9, 0.11], [-0.095, 1.73, 0.175], [0.12, 1.54, 0.155], [0.215, 1.28, 0.09]], 0.014, 0.82);
  for (let i = -4; i <= 4; i++) {
    if (!detail && i % 2) continue;
    c.tube([[i * 0.043, 0.48, 0.11], [i * 0.039, 0.95, 0.149], [i * 0.031, 1.41, 0.14]], 0.007, 0.84);
  }
  return c.finish();
}

function seatedBuddha(detail, plinth = true) {
  const c = new Carver(detail);
  if (plinth) {
    c.box([0, 0.07, 0], [0.78, 0.14, 0.62], 0.82);
    c.profile([[0.34, 0.14], [0.31, 0.2], [0.34, 0.24], [0.3, 0.3]], 0.82);
  }
  c.oval([0, 0.42, 0], [0.27, 0.14, 0.2]);
  for (const side of [-1, 1]) {
    c.limb([side * 0.19, 0.46, -0.015], [side * 0.3, 0.37, 0.12], 0.1);
    c.limb([side * 0.3, 0.37, 0.12], [-side * 0.12, 0.335, 0.23], 0.077, 0.048);
  }
  c.profile([[0.16, 0.43], [0.13, 0.61], [0.18, 0.85], [0.205, 0.92], [0.065, 1.03]], 0.67);
  c.limb([0, 1, 0], [0, 1.09, 0], 0.047);
  carveFace(c, 1.2, 0.01, 0.78);
  c.oval([0, 1.285, -0.025], [0.119, 0.112, 0.09], 0.8);
  c.oval([0, 1.391, -0.02], [0.053, 0.06, 0.05]);
  for (const side of [-1, 1]) {
    c.limb([side * 0.197, 0.92, 0], [side * 0.22, 0.65, 0.055], 0.047, 0.038);
    c.limb([side * 0.22, 0.65, 0.055], [side * 0.025, 0.54, 0.18], 0.037, 0.027);
    c.oval([side * 0.025, 0.54, 0.18], [0.05, 0.026, 0.035]);
  }
  c.tube([[-0.15, 0.97, 0.065], [-0.055, 0.82, 0.132], [0.125, 0.63, 0.1]], 0.012, 0.85);
  return c.finish();
}

function doorwayGeometry(width, height) {
  const c = new Carver(true);
  // Three nested jamb/lintel mouldings with a clear rectangular opening.
  for (let i = 0; i < 3; i++) {
    const x = width / 2 + 0.045 + i * 0.075;
    for (const side of [-1, 1]) c.box([side * x, height / 2, -i * 0.025], [0.068, height, 0.09], 0.91 - i * 0.045);
    c.box([0, height + i * 0.075, -i * 0.025], [2 * x + 0.068, 0.065, 0.09], 0.91 - i * 0.045);
  }
  for (const side of [-1, 1]) {
    const x = side * (width / 2 + 0.23);
    c.box([x, height / 2, -0.07], [0.23, height + 0.3, 0.13], 0.78);
    for (let j = 0; j < 9; j++) {
      const y = 0.22 + j * 0.315;
      c.tube([[x - 0.055, y, 0.022], [x, y + 0.065, 0.052], [x + 0.055, y, 0.022], [x, y - 0.065, 0.052], [x - 0.055, y, 0.022]], 0.013);
    }
    for (const y of [0.13, height - 0.02]) c.box([x, y, 0.005], [0.34, 0.15, 0.16]);
  }
  return c.finish();
}

function sashGeometry() {
  const positions = [], indices = [];
  for (let j = 0; j <= 24; j++) {
    const t = j / 24;
    for (let i = 0; i <= 8; i++) {
      const v = i / 8;
      positions.push(-0.2 + 0.43 * t + (v - 0.5) * 0.185,
        1.96 - 0.88 * t - 0.025 * Math.sin(v * Math.PI),
        0.12 + 0.085 * Math.sin(t * Math.PI) + 0.007 * Math.cos(v * Math.PI * 6));
      if (j < 24 && i < 8) { const k = j * 9 + i; indices.push(k, k + 9, k + 1, k + 1, k + 9, k + 10); }
    }
  }
  const g = new THREE.BufferGeometry();g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));g.setIndex(indices);g.computeVertexNormals();
  return g;
}

function parasolGeometry() {
  const points = [], indices = [];
  const rings = 9, slices = 64;
  for (let j = 0; j <= rings; j++) for (let i = 0; i <= slices; i++) {
    const t = j / rings, a = i / slices * Math.PI * 2, r = t * 0.65;
    const y = 0.24 * (1 - t * t) - 0.028 * Math.cos(a * 8) * t * t;
    points.push(Math.cos(a) * r, y, Math.sin(a) * r);
    if (j < rings && i < slices) { const k = j * (slices + 1) + i; indices.push(k, k + 1, k + slices + 1, k + 1, k + slices + 2, k + slices + 1); }
  }
  const g = new THREE.BufferGeometry();g.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));g.setIndex(indices);g.computeVertexNormals();return g;
}

export class TempleInteriors {
  constructor(sculptures) {
    this.sculptures = sculptures;
    this.root = new THREE.Group();this.root.name = 'TempleInteriors';
    this.items = [];this.blockers = [];this.lods = [];
    this.stone = createSculptureMaterial(0x9d9a87);
    this.recess = createSculptureMaterial(0x45463c);
    this.gold = worldMaterial(new THREE.MeshStandardMaterial({ color: 0xb89142, metalness: 0.55, roughness: 0.48 }));
    this.saffron = worldMaterial(new THREE.MeshStandardMaterial({ color: 0xd89116, roughness: 0.96, side: THREE.DoubleSide }));
    this.red = worldMaterial(new THREE.MeshStandardMaterial({ color: 0x633124, roughness: 0.92 }));
    this.green = worldMaterial(new THREE.MeshStandardMaterial({ color: 0x355834, roughness: 0.9 }));
    this.flower = worldMaterial(new THREE.MeshStandardMaterial({ color: 0xf0c83e, roughness: 0.88 }));
    this.white = worldMaterial(new THREE.MeshStandardMaterial({ color: 0xd9d2b9, roughness: 0.95, side: THREE.DoubleSide }));
    this.statueGeometries = { standing: [standingBuddha(true), standingBuddha(false)], seated: [seatedBuddha(true), seatedBuddha(false)] };
    this.statueGeometries.damaged = [true, false].map(damagedBuddhaGeometry);
    this.statueGeometries.naga = [true, false].map(detail => {
      const hood = nagaGeometry(detail);
      const buddha = seatedBuddha(detail, false).scale(1.7, 1.7, 1.7).translate(0, 0.58, 0.055);
      const combined = mergeGeometries([hood, buddha]);hood.dispose();buddha.dispose();
      combined.computeBoundingBox();combined.computeBoundingSphere();return combined;
    });
    this.windowGeometries = [true, false].map(balusterWindowGeometry);
    this.sash = sashGeometry();this.canopy = parasolGeometry();
  }
  mesh(g, m) {
    if (m.vertexColors && !g.attributes.color) {
      const colors = new Float32Array(g.attributes.position.count * 3).fill(1);
      g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }
    const o = new THREE.Mesh(g, m);o.castShadow = o.receiveShadow = true;return o;
  }
  box(parent, position, size, material = this.stone) {
    const o = this.mesh(new THREE.BoxGeometry(...size), material);o.position.set(...position);parent.add(o);return o;
  }
  addBlocker(object, min, max, label) { this.blockers.push({ object, box: new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max)), label }); }
  statue(kind = 'standing', draped = true) {
    const group = new THREE.Group();group.name = `Buddha_${kind}`;
    const lod = new THREE.LOD();
    this.statueGeometries[kind].forEach((g, i) => lod.addLevel(this.mesh(g, this.stone), i ? 24 : 0, 0.15));
    group.add(lod);group.userData.lod = lod;
    this.lods.push(lod);
    if (draped && kind === 'standing') group.add(this.mesh(this.sash, this.saffron));
    const half = kind === 'naga' ? 0.82 : kind === 'seated' ? 0.39 : 0.36;
    const height = { standing: 2.58, seated: 1.46, damaged: 2.05, naga: 3.91 }[kind];
    this.addBlocker(group, [-half, 0, kind === 'naga' ? -0.61 : -0.32], [half, height, kind === 'naga' ? 0.61 : 0.33], kind);
    return group;
  }
  parasol(color = 'saffron') {
    const group = new THREE.Group();group.name = 'CeremonialParasol';
    group.add(this.mesh(this.canopy, this[color]));
    const c = new Carver(true);
    c.limb([0, -0.5, 0], [0, 0.36, 0], 0.012);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      c.tube([[0, 0.225, 0], [Math.cos(a) * 0.34, 0.165, Math.sin(a) * 0.34], [Math.cos(a) * 0.65, -0.028, Math.sin(a) * 0.65]], 0.008);
    }
    for (let i = 0; i < 40; i++) {
      const a = i / 40 * Math.PI * 2, x = Math.cos(a) * 0.65, z = Math.sin(a) * 0.65;
      const y = -0.028 * Math.cos(a * 8);
      c.tube([[x, y, z], [x, y - 0.11, z]], 0.004);
      c.oval([x, y - 0.12, z], [0.013, 0.021, 0.013]);
    }
    group.add(this.mesh(c.finish(), this.gold));return group;
  }
  offerings(parent, x, z) {
    const bowl = new Carver(true);
    bowl.profile([[0.07, 0], [0.07, 0.035], [0.17, 0.09], [0.18, 0.14], [0.15, 0.14], [0.12, 0.075]], 1);
    const tray = this.mesh(bowl.finish(), this.gold);tray.position.set(x, 0.015, z);parent.add(tray);
    const petals = new Carver(true), leaves = new Carver(true);
    for (let j = 0; j < 5; j++) {
      const a = j * 2.4, fx = Math.cos(a) * 0.075, fz = Math.sin(a) * 0.075, y = 0.22 + j * 0.045;
      leaves.tube([[0, 0.07, 0], [fx, y - 0.06, fz]], 0.006);
      leaves.oval([fx + 0.023, y - 0.11, fz], [0.04, 0.012, 0.02]);
      for (let p = 0; p < 6; p++) {
        const b = p / 6 * Math.PI * 2;
        petals.oval([fx + Math.cos(b) * 0.017, y + Math.sin(b) * 0.017, fz], [0.023, 0.023, 0.013]);
      }
    }
    for (const [carver, material] of [[petals, this.flower], [leaves, this.green]]) {
      const mesh = this.mesh(carver.finish(), material);mesh.position.set(x, 0.015, z);parent.add(mesh);
    }
    const incense = new Carver(false);
    for (let j = 0; j < 3; j++) incense.limb([0.29 + j * 0.025, 0.02, 0], [0.29 + j * 0.025, 0.28 + j * 0.025, 0], 0.003);
    const sticks = this.mesh(incense.finish(), this.red);sticks.position.set(x, 0.015, z);parent.add(sticks);
  }
  corridor() {
    const group = new THREE.Group();group.name = 'PreahPoan_InteriorDetails';
    const frameGeometry = doorwayGeometry(2.7, 3.05);
    for (const z of [-6, -3.8, 6]) {
      const frame = this.mesh(frameGeometry, this.stone);frame.position.z = z;group.add(frame);
      for (const side of [-1, 1]) this.addBlocker(frame, [side < 0 ? -1.72 : 1.35, 0, -0.13], [side < 0 ? -1.35 : 1.72, 3.28, 0.11], 'jamb');
    }
    for (const side of [-1, 1]) for (const z of [-4.9, 5.2]) {
      const statue = this.statue(side < 0 ? 'damaged' : 'standing', side > 0);statue.scale.setScalar(0.8);
      statue.position.set(side * 1.48, 0, z);statue.rotation.y = -side * Math.PI / 2;group.add(statue);
    }
    for (const side of [-1, 1]) {
      const seated = this.statue('seated');seated.scale.setScalar(0.72);seated.position.set(side * 1.45, 0, 7.5);
      seated.rotation.y = -side * Math.PI / 2;group.add(seated);
    }
    for (const side of [-1, 1]) for (const z of [-5.5, 4.7]) {
      const window = new THREE.LOD();window.name = 'CarvedBalusterWindow';
      this.windowGeometries.forEach((g, i) => window.addLevel(this.mesh(g, this.stone), i ? 24 : 0, 0.15));
      this.lods.push(window);
      window.position.set(side * 1.88, 0.9, z);window.rotation.y = -side * Math.PI / 2;
      group.add(window);
      this.addBlocker(window, [-0.93, -0.065, -0.14], [0.93, 1.84, 0.14], 'baluster-window');
    }
    return group;
  }
  shrine() {
    const group = new THREE.Group();group.name = 'Buddhist_Shrine';
    this.box(group, [0, 1.625, -0.185], [4.1, 3.25, 0.23]);
    this.box(group, [0, 1.52, -0.057], [2.4, 3.04, 0.024], this.recess);
    this.addBlocker(group, [-2.05, 0, -0.3], [2.05, 3.25, -0.07], 'shrine-wall');
    group.add(this.mesh(doorwayGeometry(2.4, 3.08), this.stone));
    const statue = this.statue();statue.position.set(0, 0.05, 0.33);group.add(statue);
    // Short side screens flank the shrine; the approach remains open for exploration.
    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i++) this.box(group, [side * (0.47 + i * 0.125), 0.47, 0.5], [0.038, 0.83, 0.038], this.red);
      this.box(group, [side * 0.72, 0.91, 0.5], [0.66, 0.052, 0.065], this.red);
      this.addBlocker(group, [side < 0 ? -1.08 : 0.39, 0, 0.45], [side < 0 ? -0.39 : 1.08, 0.94, 0.55], 'shrine-screen');
      const relief = this.sculptures.create('devata', side < 0 ? 1 : 2);
      relief.scale.setScalar(0.43);relief.position.set(side * 1.62, 0.23, 0.04);group.add(relief);
      const parasol = this.parasol(side > 0 ? 'white' : 'saffron');parasol.scale.setScalar(0.64);
      parasol.position.set(side * 0.82, 2.74, 0.41);group.add(parasol);
      this.offerings(group, side * 0.62, 0.79);
    }
    // Low worn side altar slabs echo the varied supports in the reference photograph.
    this.box(group, [0, 0.065, 0.35], [1.12, 0.13, 0.75]);
    return group;
  }
  build(parent, level) {
    const corridor = this.corridor();corridor.position.set(0, level.levels.L1 + 0.014, 71.3);
    const shrine = this.shrine();shrine.position.set(30, level.levels.L1 + 0.014, 69.62);
    this.root.add(corridor, shrine);parent.add(this.root);
    this.items.push(corridor, shrine);
    // Separate side niches leave the cross-shaped cloister's central intersection clear.
    for (const x of [-35, -29, -23]) {
      const statue = this.statue('standing', x !== -29);statue.scale.setScalar(x === -29 ? 0.78 : 0.88);
      statue.position.set(x, level.levels.L1 + 0.014, 69.94);this.root.add(statue);this.items.push(statue);
      const umbrella = this.parasol(x === -29 ? 'white' : 'saffron');umbrella.scale.setScalar(0.68);
      umbrella.position.set(x, level.levels.L1 + 3.03, 70.05);this.root.add(umbrella);this.items.push(umbrella);
    }
    const naga = this.statue('naga', false);naga.scale.setScalar(0.78);
    naga.position.set(-17, level.levels.L1 + 0.014, 69.95);
    this.root.add(naga);this.items.push(naga);
  }
  registerCollision(collision) {
    this.root.updateWorldMatrix(true, true);
    for (const [i, { object, box, label }] of this.blockers.entries()) {
      object.updateWorldMatrix(true, false);
      const worldBox = box.clone().applyMatrix4(object.matrixWorld);
      collision.setBlocker(`temple-interior-${label}-${i}`, worldBox.min, worldBox.max);
    }
  }
  setLodDistance(scale) {
    for (const lod of this.lods) lod.levels[1].distance = 24 * scale;
  }
  triangleCount() {
    let count = 0;
    this.root.traverse(o => { if (o.isMesh && !o.parent.name.startsWith('Khmer_') && (!o.parent.isLOD || o.parent.levels[0].object === o)) count += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3; });
    return count;
  }
}
