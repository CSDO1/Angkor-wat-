import * as THREE from 'three';
import { Carver } from './KhmerSculptures.js';

export function nagaGeometry(detail) {
  const c = new Carver(detail);
  c.box([0, 0.12, 0], [1.45, 0.24, 1.21], 0.76);
  c.box([0, 0.29, 0], [1.3, 0.1, 1.08]);
  // Three broad serpent coils support the meditating figure.
  for (const y of [0.48, 0.69, 0.9]) {
    c.ring([0, y, 0], 0.49, 0.145, [1.12, 1, 0.82]);
    if (detail) for (let j = 0; j < 32; j++) {
      const a = j * Math.PI * 2 / 32;
      const x = Math.sin(a) * 0.675, z = Math.cos(a) * 0.523;
      c.tube([[x * 0.98, y - 0.065, z * 0.98], [x, y, z], [x * 0.98, y + 0.065, z * 0.98]], 0.005, 0.72);
    }
  }
  // A solid sandstone hood, rather than disconnected floating snake heads.
  const hood = new THREE.Shape();
  hood.moveTo(-0.17, 0.89);
  hood.bezierCurveTo(-0.24, 1.65, -0.81, 2.36, -0.77, 3.11);
  hood.bezierCurveTo(-0.78, 3.42, -0.37, 3.72, 0, 3.77);
  hood.bezierCurveTo(0.37, 3.72, 0.78, 3.42, 0.77, 3.11);
  hood.bezierCurveTo(0.81, 2.36, 0.24, 1.65, 0.17, 0.89);
  hood.closePath();
  c.add(new THREE.ExtrudeGeometry(hood, { depth: 0.12, bevelEnabled: true, bevelSegments: detail ? 3 : 1,
    steps: 1, bevelSize: 0.035, bevelThickness: 0.035, curveSegments: detail ? 18 : 7 }), [0, 0, -0.32], undefined, undefined, 0.82);
  for (let i = -3; i <= 3; i++) {
    const x = i * 0.205, y = 3.61 - Math.abs(i) * 0.15;
    c.tube([[i * 0.016, 1.06, -0.145], [x * 0.64, 2.15, -0.13], [x, y - 0.19, -0.11]], 0.04);
    c.oval([x, y - 0.055, -0.085], [0.13, 0.185, 0.06], 0.86);
    c.oval([x, y + 0.075, -0.027], [0.094, 0.092, 0.083]);
    c.oval([x, y + 0.025, 0.039], [0.071, 0.032, 0.045]);
    for (const side of [-1, 1]) c.oval([x + side * 0.042, y + 0.073, 0.046], [0.011, 0.013, 0.008], 0.38);
    c.tube([[x - 0.058, y + 0.015, 0.06], [x, y + 0.003, 0.081], [x + 0.058, y + 0.015, 0.06]], 0.005, 0.5);
  }
  return c.finish();
}

export function damagedBuddhaGeometry(detail) {
  const c = new Carver(detail);
  c.box([0, 0.1, 0], [0.74, 0.2, 0.64], 0.75);
  c.box([0.025, 0.255, -0.014], [0.62, 0.11, 0.57], 0.83);
  c.profile([[0.23, 0.32], [0.245, 0.51], [0.22, 0.95], [0.195, 1.34], [0.255, 1.73], [0.235, 1.86], [0.075, 1.94]], 0.62);
  // Broken neck and shoulder ends have irregular facets; no invented intact face.
  c.add(new THREE.CylinderGeometry(0.072, 0.084, 0.095, 7), [0, 1.96, 0], undefined, [0.12, 0.08, -0.14], 0.77);
  c.limb([0.24, 1.8, 0], [0.26, 1.45, 0.02], 0.059, 0.043);
  c.limb([0.26, 1.45, 0.02], [0.2, 1.28, 0.14], 0.042, 0.027);
  c.oval([0.2, 1.26, 0.15], [0.035, 0.06, 0.025]);
  c.add(new THREE.CylinderGeometry(0.047, 0.063, 0.15, 7), [-0.24, 1.74, 0], undefined, [0, 0, -0.2], 0.78);
  for (let j = -4; j <= 4; j++) {
    if (!detail && j % 2) continue;
    c.tube([[j * 0.044, 0.35, 0.1], [j * 0.039, 0.94, 0.145], [j * 0.031, 1.4, 0.125]], 0.007, 0.79);
  }
  const g = c.finish(), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (y < 0.32) continue;
    const wear = Math.sin(x * 37 + z * 21) * Math.sin(y * 33 - z * 17) * 0.012;
    p.setXYZ(i, x + wear, y + wear * 0.6, z + wear * 0.75);
  }
  g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
}

export function balusterWindowGeometry(detail) {
  const c = new Carver(detail);
  for (const side of [-1, 1]) c.box([side * 0.86, 0.88, 0], [0.12, 1.92, 0.18], 0.8);
  for (const y of [0, 1.76]) c.box([0, y, 0], [1.84, 0.13, 0.28], 0.86);
  const profile = [[0.075, 0.08], [0.075, 0.14], [0.047, 0.19], [0.055, 0.29], [0.047, 0.34],
    [0.075, 0.4], [0.079, 0.47], [0.057, 0.52], [0.042, 0.66], [0.071, 0.74], [0.071, 0.81],
    [0.045, 0.88], [0.045, 0.99], [0.073, 1.07], [0.073, 1.14], [0.042, 1.22],
    [0.057, 1.39], [0.079, 1.44], [0.075, 1.51], [0.048, 1.57], [0.075, 1.65], [0.075, 1.7]];
  for (let j = -3; j <= 3; j++) {
    c.add(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), detail ? 16 : 8), [j * 0.227, 0, 0]);
  }
  return c.finish();
}
