import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';

/**
 * Static collision (BVH over the separate low-poly collision mesh exported from Blender),
 * analytic stair ramps, dynamic box blockers (puzzle doors, conservation barriers) and tree trunks.
 */
const _box = new THREE.Box3();
const _tri = new THREE.Vector3();
const _cap = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _ray = new THREE.Ray();

export class CollisionWorld {
  constructor() {
    this.bvh = null;
    this.stairs = [];
    this.blockers = new Map();
    this.trunkCells = new Map();
    this.cell = 8;
  }

  setGeometry(geometry) {
    this.geometry = geometry;
    this.bvh = new MeshBVH(geometry, { targetLeafSize: 12 });
  }

  setStairs(list) {
    this.stairs = list.map((s) => ({
      ...s,
      o: new THREE.Vector3(...s.o),
      up: new THREE.Vector3(...s.up).setY(0).normalize(),
      side: new THREE.Vector3(...s.side).setY(0).normalize(),
      locked: false,
    }));
  }

  addTrunk(x, z, r) {
    const k = `${Math.floor(x / this.cell)},${Math.floor(z / this.cell)}`;
    if (!this.trunkCells.has(k)) this.trunkCells.set(k, []);
    this.trunkCells.get(k).push({ x, z, r });
  }

  /** Axis-aligned blocker in world space (min/max Vector3). */
  setBlocker(id, min, max, enabled = true) {
    if (!enabled) { this.blockers.delete(id); return; }
    this.blockers.set(id, new THREE.Box3(min.clone(), max.clone()));
  }

  /**
   * Stair ramp under a point: returns { stair, along, across, h(feetAhead) } when (x,z) lies in a stair
   * footprint and the feet are close to the ramp surface.
   */
  stairAt(p, radius, feetY) {
    for (const s of this.stairs) {
      if (s.locked) continue;
      const dx = p.x - s.o.x, dz = p.z - s.o.z;
      const along = dx * s.up.x + dz * s.up.z;          // -run at the bottom, 0 at the top edge
      if (along < -s.run - 0.55 || along > 0.9) continue;
      const across = dx * s.side.x + dz * s.side.z;
      if (Math.abs(across) > s.W / 2 + 0.05) continue;
      const hAt = (a) => s.o.y + THREE.MathUtils.clamp((a + s.run) / s.run, 0, 1) * s.H;
      const h = hAt(along + radius);
      if (feetY < s.o.y - 0.6 || feetY > s.o.y + s.H + 0.8) continue;
      if (feetY < h - 1.3) continue;
      return { s, along, across, h, slope: s.H / s.run };
    }
    return null;
  }

  /**
   * Resolve a capsule (segment start/end + radius) against the static BVH. Mutates the segment.
   * Returns the accumulated push direction so the caller can classify ground vs wall contacts.
   */
  collideCapsule(seg, radius, outPush) {
    outPush.set(0, 0, 0);
    if (!this.bvh) return false;
    let hit = false;
    for (let iter = 0; iter < 3; iter++) {
      _box.makeEmpty();
      _box.expandByPoint(seg.start); _box.expandByPoint(seg.end);
      _box.min.addScalar(-radius); _box.max.addScalar(radius);
      let any = false;
      this.bvh.shapecast({
        intersectsBounds: (box) => box.intersectsBox(_box),
        intersectsTriangle: (tri) => {
          const d = tri.closestPointToSegment(seg, _tri, _cap);
          if (d < radius) {
            const depth = radius - d;
            _dir.subVectors(_cap, _tri);
            if (_dir.lengthSq() < 1e-10) tri.getNormal(_dir); else _dir.normalize();
            seg.start.addScaledVector(_dir, depth);
            seg.end.addScaledVector(_dir, depth);
            outPush.addScaledVector(_dir, depth);
            any = true;
          }
        },
      });
      if (!any) break;
      hit = true;
    }
    return hit;
  }

  /** Push a vertical capsule (feet position) out of blockers and trunks in the XZ plane. */
  collideDynamic(pos, radius, height) {
    let hit = false;
    for (const b of this.blockers.values()) {
      if (pos.y + height < b.min.y || pos.y > b.max.y) continue;
      const cx = THREE.MathUtils.clamp(pos.x, b.min.x, b.max.x);
      const cz = THREE.MathUtils.clamp(pos.z, b.min.z, b.max.z);
      let dx = pos.x - cx, dz = pos.z - cz;
      const d = Math.hypot(dx, dz);
      if (d < radius) {
        if (d < 1e-5) { // inside: push out along the shallowest axis
          const px = Math.min(pos.x - b.min.x, b.max.x - pos.x), pz = Math.min(pos.z - b.min.z, b.max.z - pos.z);
          if (px < pz) pos.x = pos.x - b.min.x < b.max.x - pos.x ? b.min.x - radius : b.max.x + radius;
          else pos.z = pos.z - b.min.z < b.max.z - pos.z ? b.min.z - radius : b.max.z + radius;
        } else {
          pos.x = cx + (dx / d) * radius; pos.z = cz + (dz / d) * radius;
        }
        hit = true;
      }
    }
    const kx = Math.floor(pos.x / this.cell), kz = Math.floor(pos.z / this.cell);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const list = this.trunkCells.get(`${kx + i},${kz + j}`);
      if (!list) continue;
      for (const t of list) {
        const dx = pos.x - t.x, dz = pos.z - t.z, d = Math.hypot(dx, dz), R = t.r + radius;
        if (d < R && d > 1e-4) { pos.x = t.x + (dx / d) * R; pos.z = t.z + (dz / d) * R; hit = true; }
      }
    }
    return hit;
  }

  raycast(origin, dir, far, near = 0) {
    if (!this.bvh) return null;
    _ray.origin.copy(origin); _ray.direction.copy(dir);
    const hit = this.bvh.raycastFirst(_ray, THREE.DoubleSide, near, far);
    return hit && hit.distance <= far ? hit : null;
  }

  /** Ground height below a point (searching down from `from.y`), or null. */
  groundBelow(x, fromY, z, maxDist = 60) {
    const hit = this.raycast(new THREE.Vector3(x, fromY, z), new THREE.Vector3(0, -1, 0), maxDist);
    return hit ? hit.point.y : null;
  }
}
