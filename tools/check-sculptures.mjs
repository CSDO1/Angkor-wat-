import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KhmerSculptures } from '../src/environment/KhmerSculptures.js';
import { CollisionWorld } from '../src/systems/CollisionWorld.js';

const level = JSON.parse(fs.readFileSync(new URL('../public/assets/environment/angkor_wat/level.json', import.meta.url)));
const data = fs.readFileSync(new URL('../public/assets/environment/angkor_wat/angkor_collision.glb', import.meta.url));
const gltf = await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '');
const collision = new CollisionWorld();
gltf.scene.traverse(o => { if (o.isMesh) collision.setGeometry(o.geometry); });
const sculptures = new KhmerSculptures();
sculptures.build(new THREE.Group(), level);
assert.equal(sculptures.lods.length, 56);
assert.equal(sculptures.guardians.length, 16);
for (let i = 0; i < 3; i++) sculptures.create('devata', i);
for (const [name, geometries] of sculptures.templates) {
  assert.ok(geometries[1].attributes.position.count < geometries[0].attributes.position.count / 2, `${name}: distance simplification`);
  for (const g of geometries) {
    assert.ok(g.attributes.position.array.every(Number.isFinite), `${name}: finite vertices`);
    assert.ok(g.attributes.normal.array.every(Number.isFinite), `${name}: finite normals`);
    assert.equal(g.attributes.color.count, g.attributes.position.count);
    assert.ok(g.boundingBox.min.y >= -0.001, `${name}: base on floor`);
  }
}
sculptures.registerCollision(collision);
assert.equal(collision.blockers.size, 16);
for (const [i, statue] of sculptures.guardians.entries()) {
  const { x, y, z } = statue.position;
  const floor = collision.groundBelow(x, y + 0.1, z, 40);
  assert.ok(floor !== null && Math.abs(floor - y) < 0.03, `Guardian ${i}: supported landing`);
  const feet = new THREE.Vector3(x, y, z);
  assert.equal(collision.collideDynamic(feet, 0.35, 1.8), true, `Guardian ${i}: blocks player`);
  assert.ok(Math.hypot(feet.x - x, feet.z - z) > 0.35);
}
// Every decorated stair retains a clear route along its centre at the top landing.
for (let i = 0; i < sculptures.guardians.length; i += 2) {
  const a = sculptures.guardians[i].position, b = sculptures.guardians[i + 1].position;
  const center = a.clone().add(b).multiplyScalar(0.5);
  assert.equal(collision.collideDynamic(center, 0.35, 1.8), false, `Stair pair ${i / 2}: clear centre`);
}
sculptures.setLodDistance(0.6);
for (const lod of sculptures.lods) assert.equal(lod.levels[1].distance, 19.2);
console.log('Passed: finite sculpture meshes, shared variants, simpler distant models, 16 supported guardian colliders, and 8 clear stairways.');
