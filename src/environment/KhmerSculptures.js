import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { worldMaterial } from '../materials/WorldShading.js';
import { NOISE_GLSL } from '../shaders/noise.glsl.js';

// Original, reference-inspired sculpture meshes. Local +Z is the carved face, +Y is up.
// One merged draw per sculpture, shared geometry, and a simpler mesh at distance.
export class Carver {
  constructor(detail) { this.detail = detail; this.parts = []; }
  add(g, p = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0], shade = 1) {
    const matrix = new THREE.Matrix4().compose(new THREE.Vector3(...p),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)), new THREE.Vector3(...scale));
    const raw = g.index ? g.toNonIndexed() : g;
    if (raw !== g) g.dispose();
    raw.applyMatrix4(matrix);
    raw.deleteAttribute('uv');
    const colors = new Float32Array(raw.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) colors.set([shade, shade, shade], i);
    raw.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.parts.push(raw);
  }
  box(p, s, shade = 1) { this.add(new THREE.BoxGeometry(...s), p, undefined, undefined, shade); }
  oval(p, s, shade = 1) {
    const small = Math.max(...s) < 0.09;
    this.add(new THREE.SphereGeometry(1, this.detail && !small ? 20 : 10, this.detail && !small ? 14 : 7), p, s, undefined, shade);
  }
  tube(points, radius, shade = 1) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    this.add(new THREE.TubeGeometry(curve, this.detail ? points.length * 5 : points.length * 2,
      radius, this.detail ? 8 : 5, false), undefined, undefined, undefined, shade);
  }
  limb(a, b, ra, rb = ra) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const dir = end.clone().sub(start);
    const g = new THREE.CylinderGeometry(rb, ra, dir.length(), this.detail ? 16 : 8);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
    this.add(g, start.add(end).multiplyScalar(0.5).toArray());
    this.oval(a, [ra, ra, ra]); this.oval(b, [rb, rb, rb]);
  }
  ring(p, radius, thickness, scale = [1, 1, 1], rotation = [Math.PI / 2, 0, 0]) {
    this.add(new THREE.TorusGeometry(radius, thickness, this.detail ? 8 : 5, this.detail ? 28 : 12), p, scale, rotation);
  }
  profile(points, depth = 1, z = 0) {
    this.add(new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), this.detail ? 32 : 14),
      [0, 0, z], [1, 1, depth]);
  }
  finish() {
    const g = mergeGeometries(this.parts);
    this.parts.forEach(p => p.dispose());
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
}

export function createSculptureMaterial(color = 0x9b896f) {
  // Carved figures have grain and lichen, but no repeating ashlar joints or wallpaper rosettes.
  return worldMaterial(new THREE.MeshStandardMaterial({ color, vertexColors: true, roughness: 0.96 }), shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vCarvedPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCarvedPos = position;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>',
      `#include <common>\n${NOISE_GLSL}\nvarying vec3 vCarvedPos; uniform float uDetail;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float grain = vnoise(vCarvedPos * 92.0);
        float stain = smoothstep(0.46, 0.76, fbm3(vCarvedPos * 3.5 + 8.0));
        diffuseColor.rgb *= (0.82 + 0.22 * grain) * mix(vec3(1.0), vec3(0.52, 0.57, 0.47), stain * 0.55);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec3 dp = -vViewPosition;
        vec3 rx = cross(dFdy(dp), normal), ry = cross(normal, dFdx(dp));
        float determinant = dot(dFdx(dp), rx) * faceDirection;
        float h = grain * 0.0025 * uDetail;
        normal = normalize(abs(determinant) * normal - sign(determinant) * (dFdx(h) * rx + dFdy(h) * ry));`);
  }, 'khmer-carved-sandstone');
}

export function carveFace(c, y, z, size = 1, monkey = false) {
  c.oval([0, y, z], [0.145 * size, 0.195 * size, 0.115 * size]);
  for (const side of [-1, 1]) {
    c.oval([side * 0.151 * size, y - 0.015 * size, z], [0.038 * size, 0.075 * size, 0.035 * size]);
    c.oval([side * 0.058 * size, y + 0.021 * size, z + 0.102 * size], [0.045 * size, 0.011 * size, 0.013 * size], 0.58);
    c.tube([[side * 0.105 * size, y + 0.047 * size, z + 0.075 * size],
      [side * 0.06 * size, y + 0.062 * size, z + 0.107 * size],
      [side * 0.019 * size, y + 0.049 * size, z + 0.11 * size]], 0.011 * size);
  }
  c.oval([0, y - 0.013 * size, z + 0.119 * size], [0.028 * size, 0.057 * size, 0.032 * size]);
  if (monkey) {
    c.oval([0, y - 0.09 * size, z + 0.16 * size], [0.12 * size, 0.058 * size, 0.072 * size]);
    c.oval([0, y - 0.136 * size, z + 0.146 * size], [0.105 * size, 0.037 * size, 0.055 * size]);
    c.tube([[-0.092 * size, y - 0.112 * size, z + 0.18 * size], [0, y - 0.116 * size, z + 0.219 * size],
      [0.092 * size, y - 0.112 * size, z + 0.18 * size]], 0.009 * size, 0.48);
  } else {
    c.tube([[-0.057 * size, y - 0.072 * size, z + 0.098 * size], [0, y - 0.083 * size, z + 0.121 * size],
      [0.057 * size, y - 0.072 * size, z + 0.098 * size]], 0.009 * size, 0.66);
    c.oval([0, y - 0.097 * size, z + 0.106 * size], [0.048 * size, 0.012 * size, 0.016 * size]);
  }
}

function rosette(c, x, y, z, r) {
  const petals = c.detail ? 8 : 5;
  for (let j = 0; j < petals; j++) {
    const a = j * Math.PI * 2 / petals;
    c.add(new THREE.SphereGeometry(1, 8, 6), [x + Math.sin(a) * r * 0.6, y + Math.cos(a) * r * 0.6, z],
      [r * 0.26, r * 0.5, r * 0.22], [0, 0, -a]);
  }
  c.oval([x, y, z + r * 0.12], [r * 0.3, r * 0.3, r * 0.24]);
}

function devataGeometry(detail, variant) {
  const c = new Carver(detail);
  c.box([0, 1.38, -0.045], [1.25, 2.76, 0.16], 0.79);
  // Raised mouldings, lotus vine scrolls, and a recessed niche.
  for (const side of [-1, 1]) {
    c.box([side * 0.594, 1.38, 0.071], [0.055, 2.74, 0.066]);
    c.box([side * 0.44, 1.37, 0.048], [0.024, 2.56, 0.045]);
    for (let j = 0; j < (detail ? 9 : 5); j++) {
      const y = 0.2 + j * (detail ? 0.28 : 0.5);
      c.tube([[side * 0.53, y - 0.12, 0.09], [side * 0.47, y - 0.02, 0.1],
        [side * 0.55, y + 0.09, 0.1], [side * 0.56, y + 0.015, 0.1], [side * 0.52, y, 0.1]], 0.014);
      if (detail) rosette(c, side * 0.522, y + 0.075, 0.112, 0.034);
    }
  }
  c.box([0, 0.076, 0.055], [1.18, 0.095, 0.18]);
  c.box([0, 2.71, 0.055], [1.18, 0.055, 0.12]);
  // Feet, ankles, and pleated sampot silhouette.
  for (const side of [-1, 1]) {
    c.oval([side * 0.125, 0.185, 0.17], [0.086, 0.047, 0.14]);
    c.limb([side * 0.12, 0.22, 0.095], [side * 0.12, 0.53, 0.08], 0.056, 0.065);
    c.ring([side * 0.12, 0.265, 0.095], 0.06, 0.018, [1, 1, 0.75]);
  }
  c.profile([[0.26, 0.44], [0.285, 0.53], [0.27, 0.91], [0.25, 1.1], [0.20, 1.27]], 0.48, 0.095);
  for (let j = -5; j <= 5; j++) {
    if (!detail && j % 2) continue;
    const x = j * 0.045;
    c.tube([[x, 0.47, 0.157], [x * 1.1, 0.82, 0.185], [x * 0.82, 1.22, 0.17]], 0.007, 0.88);
  }
  for (const side of [-1, 1]) {
    c.tube([[side * 0.2, 1.26, 0.15], [side * 0.34, 1.12, 0.16], [side * 0.3, 0.92, 0.15],
      [side * 0.32, 0.48, 0.08], [side * 0.23, 0.4, 0.08]], 0.026);
  }
  c.profile([[0.20, 1.22], [0.155, 1.36], [0.14, 1.5], [0.23, 1.71], [0.235, 1.79], [0.09, 1.88]], 0.42, 0.09);
  for (const side of [-1, 1]) c.oval([side * 0.1, 1.71, 0.145], [0.108, 0.082, 0.069]);
  c.limb([0, 1.83, 0.08], [0, 1.96, 0.08], 0.064);
  carveFace(c, 2.105, 0.103);
  // Three-spired diadem with beaded bands and side hair/ear ornaments.
  c.ring([0, 2.255, 0.08], 0.15, 0.018, [1, 1, 0.55]);
  for (let j = -1; j <= 1; j++) {
    const x = j * 0.105;
    c.add(new THREE.CylinderGeometry(0.011, 0.038, j === 0 ? 0.31 : 0.25, detail ? 12 : 6),
      [x, j === 0 ? 2.46 : 2.425, 0.087]);
    rosette(c, x, 2.295, 0.118, 0.042);
    if (detail) for (let k = 0; k < 4; k++) c.ring([x, 2.33 + k * 0.053, 0.087], 0.03 - k * 0.004, 0.007, [1, 1, 0.65]);
  }
  for (const side of [-1, 1]) {
    c.tube([[side * 0.14, 2.26, 0.056], [side * 0.195, 2.17, 0.07], [side * 0.195, 1.97, 0.067],
      [side * 0.24, 1.94, 0.1]], 0.023);
    c.ring([side * 0.15, 1.995, 0.128], 0.037, 0.012, [0.55, 1, 1], [0, 0, 0]);
  }
  c.tube([[-0.16, 1.815, 0.14], [0, 1.765, 0.208], [0.16, 1.815, 0.14]], 0.018);
  if (detail) for (let j = -4; j <= 4; j++) {
    c.oval([j * 0.035, 1.77 + Math.abs(j) * 0.008, 0.202], [0.015, 0.025, 0.014]);
    c.oval([j * 0.042, 1.245, 0.18], [0.018, 0.025, 0.013]);
  }
  c.ring([0, 1.265, 0.094], 0.202, 0.018, [1, 1, 0.5]);
  const raised = variant % 2 === 0 ? -1 : 1;
  for (const side of [-1, 1]) {
    const a = [side * 0.227, 1.78, 0.095];
    const b = side === raised ? [side * 0.33, 1.49, 0.16] : [side * 0.305, 1.41, 0.15];
    const d = side === raised ? [side * 0.37, 1.86, 0.19] : [side * 0.035, 1.28, 0.24];
    c.limb(a, b, 0.057, 0.044); c.limb(b, d, 0.044, 0.031);
    c.oval(d, [0.045, 0.075, 0.029]);
    if (detail) for (let f = 0; f < 4; f++) {
      c.tube([[d[0] - 0.025 + f * 0.015, d[1], d[2] + 0.025],
        [d[0] - 0.025 + f * 0.015, d[1] + 0.055, d[2] + 0.031]], 0.004, 0.87);
    }
    c.oval([side * 0.26, 1.68, 0.11], [0.067, 0.023, 0.045]);
  }
  if (variant === 2) {
    c.tube([[-0.36, 1.91, 0.19], [-0.36, 2.05, 0.13], [-0.32, 2.1, 0.13]], 0.012);
    rosette(c, -0.32, 2.12, 0.14, 0.05);
  }
  return c.finish();
}

function guardianGeometry(detail, monkey) {
  const c = new Carver(detail);
  // Layered square plinth with lotus/bead moulding.
  c.box([0, 0.12, 0], [1.48, 0.24, 1.24], 0.85);
  c.box([0, 0.275, 0], [1.36, 0.09, 1.13]);
  c.box([0, 0.38, 0], [1.21, 0.12, 1.02], 0.88);
  c.box([0, 0.49, 0], [1.4, 0.1, 1.19]);
  if (detail) for (let j = -5; j <= 5; j++) {
    c.oval([j * 0.12, 0.366, 0.52], [0.046, 0.052, 0.028]);
    c.oval([0.63, 0.366, j * 0.086], [0.025, 0.052, 0.041]);
    c.oval([-0.63, 0.366, j * 0.086], [0.025, 0.052, 0.041]);
  }
  c.oval([0, 0.84, -0.09], [0.34, 0.3, 0.31]);
  c.profile([[0.25, 0.8], [0.24, 1.04], [0.22, 1.25], [0.34, 1.5], [0.34, 1.64], [0.13, 1.73]], 0.75, -0.045);
  for (const side of [-1, 1]) {
    // Thighs rise to spread knees; shins fold down onto the plinth.
    c.limb([side * 0.19, 0.85, -0.12], [side * 0.45, 1.02, 0.23], 0.19, 0.16);
    c.limb([side * 0.45, 1.02, 0.23], [side * 0.37, 0.65, 0.28], 0.14, 0.093);
    c.oval([side * 0.34, 0.59, 0.32], [0.16, 0.068, 0.19]);
    c.ring([side * 0.37, 0.69, 0.28], 0.095, 0.018);
    c.limb([side * 0.34, 1.6, -0.01], [side * 0.42, 1.24, 0.06], 0.095, 0.072);
    c.limb([side * 0.42, 1.24, 0.06], [side * 0.31, 1.2, 0.32], 0.071, 0.052);
    c.oval([side * 0.31, 1.22, 0.33], [0.065, 0.084, 0.068]);
    if (detail) for (let f = 0; f < 4; f++) {
      c.tube([[side * 0.31 - 0.04 + f * 0.025, 1.26, 0.383],
        [side * 0.31 - 0.04 + f * 0.025, 1.21, 0.397]], 0.006, 0.72);
      c.oval([side * 0.34 - 0.08 + f * 0.047, 0.589, 0.474], [0.021, 0.026, 0.035]);
    }
  }
  c.ring([0, 1.035, -0.065], 0.25, 0.025, [1, 1, 0.86]);
  c.oval([0, 0.865, 0.19], [0.25, 0.22, 0.048]);
  if (detail) for (let j = -5; j <= 5; j++) {
    c.tube([[j * 0.043, 1.04, 0.167], [j * 0.045, 0.86, 0.234], [j * 0.036, 0.69, 0.2]], 0.008, 0.86);
  }
  c.limb([0, 1.7, -0.02], [0, 1.83, -0.02], 0.11);
  carveFace(c, 2.04, 0.015, 1.55, monkey);
  // Rows of tight curls framing the animal or human head.
  c.oval([0, 2.2, -0.035], [0.25, 0.19, 0.19], 0.83);
  if (detail) for (let row = 0; row < 4; row++) for (let j = 0; j < 13; j++) {
    const a = j / 12 * Math.PI * 2, r = 0.25 - row * 0.022;
    c.oval([Math.sin(a) * r, 2.03 + row * 0.085, -0.036 + Math.cos(a) * r * 0.72], [0.035, 0.039, 0.03], 0.87);
  }
  if (!monkey) {
    c.profile([[0.19, 2.28], [0.16, 2.38], [0.09, 2.49], [0.009, 2.57]], 0.85, -0.035);
    c.ring([0, 2.35, -0.035], 0.157, 0.02, [1, 1, 0.85]);
  }
  return c.finish();
}

export class KhmerSculptures {
  constructor() {
    this.materials = { relief: createSculptureMaterial(0xb5a48b), guardian: createSculptureMaterial(0x96745c) };
    this.templates = new Map();
    this.lods = [];
    this.guardians = [];
  }
  create(kind, variant = 0) {
    const key = `${kind}-${variant}`;
    if (!this.templates.has(key)) this.templates.set(key, [true, false].map(detail =>
      kind === 'devata' ? devataGeometry(detail, variant) : guardianGeometry(detail, kind === 'monkey')));
    const lod = new THREE.LOD();
    lod.name = `Khmer_${key}`;
    this.templates.get(key).forEach((geometry, i) => {
      const mesh = new THREE.Mesh(geometry, this.materials[kind === 'devata' ? 'relief' : 'guardian']);
      mesh.castShadow = mesh.receiveShadow = true;
      lod.addLevel(mesh, i ? 32 : 0, 0.15);
    });
    this.lods.push(lod);
    return lod;
  }
  build(root, level) {
    // Panels are just in front of solid gallery walls, away from gate openings.
    for (const sign of [-1, 1]) for (const x of [-40, -34, -26, -20, 20, 26, 34, 40]) {
      const panel = this.create('devata', Math.abs(x) % 3);
      panel.position.set(x, level.levels.L2 + 0.12, sign * 44.15);
      panel.rotation.y = sign > 0 ? Math.PI : 0;
      root.add(panel);
    }
    // Three standing divinities together, inspired by grouped devatas in the supplied wall photo.
    for (const sign of [-1, 1]) for (const x of [-12, 12]) {
      const group = new THREE.Group();group.name = 'GroupedDevataRelief';
      group.position.set(x, level.levels.L2 + 0.12, sign * 44.15);
      group.rotation.y = sign > 0 ? Math.PI : 0;
      for (let i = 0; i < 3; i++) {
        const panel = this.create('devata', i);panel.scale.setScalar(0.68);panel.position.x = (i - 1) * 0.86;
        group.add(panel);
      }
      root.add(group);
    }
    for (const x of [-92, -80, -68, -56, -28, -22, 22, 28, 56, 68, 80, 92]) {
      const panel = this.create('devata', Math.abs(x) % 3);
      panel.position.set(x, level.levels.causeway + 0.15, 446.46);
      root.add(panel);
    }
    const entrances = ['Terrace_of_Honour_Stair_Front', 'Gopura_L1_West_Stair', 'Gopura_L1_West_Stair_02',
      'Gopura_L2_West_Stair', 'Gopura_L3_West_Stair', 'Gopura_L3_North_Stair', 'Gopura_L3_South_Stair',
      'Gopura_Outer_West_Main_Stair'];
    for (const stair of level.stairs.filter(s => entrances.includes(s.name))) for (const side of [-1, 1]) {
      const kind = stair.kind === 'bakan' ? 'human' : 'monkey';
      const statue = this.create(kind);
      statue.position.fromArray(stair.o).addScaledVector(new THREE.Vector3(...stair.up), stair.run + 0.8)
        .addScaledVector(new THREE.Vector3(...stair.side), side * (stair.W / 2 + 1.2));
      statue.position.y += stair.H;
      statue.rotation.y = Math.atan2(-stair.up[0], -stair.up[2]);
      root.add(statue); this.guardians.push(statue);
    }
  }
  registerCollision(collision) {
    for (const [i, statue] of this.guardians.entries()) {
      statue.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(statue);
      collision.setBlocker(`khmer-guardian-${i}`, box.min, box.max);
    }
  }
  setLodDistance(scale) {
    for (const lod of this.lods) lod.levels[1].distance = 32 * scale;
  }
}
