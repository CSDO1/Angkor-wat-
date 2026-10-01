import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KhmerSculptures } from '../src/environment/KhmerSculptures.js';
import { TempleInteriors } from '../src/environment/TempleInteriors.js';
import { CollisionWorld } from '../src/systems/CollisionWorld.js';
const level = JSON.parse(fs.readFileSync(new URL('../public/assets/environment/angkor_wat/level.json', import.meta.url)));
const data = fs.readFileSync(new URL('../public/assets/environment/angkor_wat/angkor_collision.glb', import.meta.url));
const gltf = await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '');
const collision = new CollisionWorld();gltf.scene.traverse(o => { if (o.isMesh) collision.setGeometry(o.geometry); });
const sculptures = new KhmerSculptures(), interiors = new TempleInteriors(sculptures);
interiors.build(new THREE.Group(), level);interiors.registerCollision(collision);
assert.equal(interiors.lods.length, 15);
assert.equal(interiors.blockers.length, 24);
let buddhas = 0, windows = 0;
interiors.root.traverse(o => { if (o.name.startsWith('Buddha_')) buddhas++; if (o.name === 'CarvedBalusterWindow') windows++; });
assert.equal(buddhas, 11);assert.equal(windows, 4);
assert.ok(interiors.statueGeometries.naga[0].boundingBox.max.y > 3.7);
const meshes = new Set();
interiors.root.traverse(o => {
  if (!o.isMesh || meshes.has(o.geometry)) return;
  meshes.add(o.geometry);
  assert.ok(o.geometry.attributes.position.array.every(Number.isFinite), `${o.name}: finite vertices`);
  assert.ok(o.geometry.attributes.normal.array.every(Number.isFinite), `${o.name}: finite normals`);
});
// Both walking lanes around the original support columns remain clear.
for (const x of [-0.8, 0.8]) for (let z = 63; z < 80; z += 0.2) {
  const p = new THREE.Vector3(x, 3.514, z);
  assert.equal(collision.collideDynamic(p, 0.32, 1.8), false, `Clear corridor at ${x},${z}`);
  const segment = new THREE.Line3(p.clone().add(new THREE.Vector3(0, 0.32, 0)), p.clone().add(new THREE.Vector3(0, 1.48, 0)));
  const push = new THREE.Vector3();collision.collideCapsule(segment, 0.32, push);
  assert.ok(Math.hypot(push.x, push.z) < 0.03, `Existing architecture leaves lane clear at ${x},${z}`);
}
for (let x = -42; x < 42; x += 0.2) {
  const p = new THREE.Vector3(x, 3.514, 71.3);
  assert.equal(collision.collideDynamic(p, 0.35, 1.8), false, `Clear cross gallery at x=${x}`);
}
for (const { box, label } of interiors.blockers) assert.ok(!box.isEmpty(), `${label}: valid blocker`);
const feet = new THREE.Vector3(30, 3.57, 69.95);
assert.equal(collision.collideDynamic(feet, 0.35, 1.8), true, 'Shrine Buddha blocks player');
interiors.root.traverse(o => {
  if (o.name.startsWith('Buddha_') && o.parent !== interiors.root) {
    const p = o.getWorldPosition(new THREE.Vector3());
    const y = collision.groundBelow(p.x, p.y + 0.1, p.z, 5);
    assert.ok(y !== null && Math.abs(p.y - y) < 0.1, 'Statue base is supported');
  }
});
interiors.setLodDistance(0.5);
for (const lod of interiors.lods) assert.equal(lod.levels[1].distance, 12);
console.log(`Passed: ${meshes.size} valid shared interior meshes, 11 Buddha statues, 4 baluster windows, 24 collision blockers, and clear corridor/junction routes.`);
