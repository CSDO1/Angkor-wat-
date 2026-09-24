import * as THREE from 'three';
import { HumanoidModel } from '../characters/HumanoidModel.js';
import { clamp, damp, dampAngle } from '../core/utils.js';

/**
 * Third-person character controller: walk / run / sprint / crouch / jump, acceleration-based
 * movement, capsule-vs-BVH collision with step-up, analytic stair ramps, water and bounds safety.
 */
const SPEEDS = { walk: 1.7, run: 4.3, sprint: 6.8, crouch: 1.35 };
const GRAVITY = 22;
const JUMP_V = 6.2;
const STEP = 0.42;

const _seg = new THREE.Line3();
const _push = new THREE.Vector3();
const _v = new THREE.Vector3();
const _down = new THREE.Vector3(0, -1, 0);

export class PlayerController {
  constructor(game) {
    this.game = game;
    this.radius = 0.32;
    this.standH = 1.75;
    this.crouchH = 1.15;
    this.height = this.standH;
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.grounded = false;
    this.crouching = false;
    this.walkToggle = false;
    this.onStairs = null;
    this.lastSafe = new THREE.Vector3();
    this.safeTimer = 0;
    this.enabled = true;
    this.moveSpeed = 0;
    this.distanceWalked = 0;
    this.fallTime = 0;

    this.model = new HumanoidModel({
      skin: 0xa0715a, shirt: 0x7d7358, pants: 0x4a4436, shoes: 0x3a2c20, hat: 'explorer', backpack: true,
    });
    this.object = this.model.root;
    this.object.name = 'Player';
    game.scene.add(this.object);
  }

  teleport(p, yaw = this.yaw) {
    this.position.copy(p);
    this.velocity.set(0, 0, 0);
    this.yaw = yaw;
    this.lastSafe.copy(p);
    this.object.position.copy(p);
    this.object.rotation.y = yaw;
  }

  /** Movement intent from input, relative to the camera yaw. */
  update(dt, input, cameraYaw) {
    const world = this.game.collision;
    const wantCrouch = input.pressed('crouch');
    if (wantCrouch) this.crouching = !this.crouching;
    if (input.pressed('walk')) this.walkToggle = !this.walkToggle;
    if (this.crouching && !input.down('crouch') && input.pressed('jump')) this.crouching = false;

    // stand up only if there's head room
    const targetH = this.crouching ? this.crouchH : this.standH;
    if (targetH > this.height) {
      const head = world.raycast(_v.copy(this.position).setY(this.position.y + this.height - 0.1), new THREE.Vector3(0, 1, 0), targetH - this.height + 0.15);
      if (!head) this.height = Math.min(targetH, this.height + dt * 3);
    } else this.height = Math.max(targetH, this.height - dt * 4);

    let ax = 0, ay = 0;
    if (this.enabled) { ax = input.axis.x; ay = input.axis.y; }
    const mag = Math.min(1, Math.hypot(ax, ay));
    const sprint = input.down('sprint') && !this.crouching && ay > 0.3;
    let speed = this.crouching ? SPEEDS.crouch : sprint ? SPEEDS.sprint : this.walkToggle ? SPEEDS.walk : SPEEDS.run;
    if (input.usingPad && !sprint && !this.crouching) speed = mag < 0.55 ? SPEEDS.walk : SPEEDS.run;
    if (this.onStairs) speed = Math.min(speed, SPEEDS.run) * (1 / Math.sqrt(1 + this.onStairs.slope * this.onStairs.slope * 0.6));

    const sin = Math.sin(cameraYaw), cos = Math.cos(cameraYaw);
    // camera looks along -Z at yaw 0; forward = (-sin, -cos)
    const wx = ax * cos - ay * sin;
    const wz = -ax * sin - ay * cos;
    const want = _v.set(wx, 0, wz);
    if (want.lengthSq() > 1) want.normalize();
    want.multiplyScalar(speed * (input.usingPad ? Math.max(mag, 0.35) : 1));

    const accel = this.grounded ? (want.lengthSq() > 0.01 ? 11 : 13) : 2.2;
    const k = damp(accel, dt);
    this.velocity.x += (want.x - this.velocity.x) * k;
    this.velocity.z += (want.z - this.velocity.z) * k;

    if (this.enabled && input.pressed('jump') && this.grounded && !this.crouching) {
      this.velocity.y = JUMP_V; this.grounded = false; this.game.audio?.playJump?.();
    }

    // integrate in sub-steps for robust collision
    const steps = Math.ceil(dt / (1 / 120));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) this._step(h);

    // facing
    const hs = Math.hypot(this.velocity.x, this.velocity.z);
    if (hs > 0.3 && this.enabled) this.yaw = dampAngle(this.yaw, Math.atan2(this.velocity.x, this.velocity.z), 12, dt);
    this.moveSpeed = this.grounded || this.onStairs ? hs : this.moveSpeed;
    this.distanceWalked += hs * dt * (this.grounded ? 1 : 0);

    this.object.position.copy(this.position);
    this.object.rotation.y = this.yaw;
    this.model.animate(dt, {
      speed: hs, grounded: this.grounded || !!this.onStairs, crouch: this.crouching && this.height < this.standH - 0.1,
      climbing: !!this.onStairs && Math.abs(this.velocity.y) < 50 && hs > 0.5,
    });

    this._safety(dt);
  }

  _step(dt) {
    const world = this.game.collision;
    const p = this.position;
    const wasGrounded = this.grounded;
    this.velocity.y -= GRAVITY * dt;
    if (this.velocity.y < -40) this.velocity.y = -40;

    const stair = world.stairAt(p, this.radius, p.y);
    if (stair) {
      // on a stair ramp: follow the analytic slope, keep inside the side walls
      p.x += this.velocity.x * dt; p.z += this.velocity.z * dt; p.y += this.velocity.y * dt;
      const s = stair.s;
      const dx = p.x - s.o.x, dz = p.z - s.o.z;
      const across = dx * s.side.x + dz * s.side.z;
      const lim = s.W / 2 - this.radius;
      if (Math.abs(across) > lim && Math.abs(across) < s.W / 2 + 0.05) {
        const c = Math.sign(across) * lim - across;
        p.x += s.side.x * c; p.z += s.side.z * c;
      }
      const again = world.stairAt(p, this.radius, p.y);
      if (again) {
        let hgt = again.h;
        if (again.along > -this.radius - 0.2) {
          // near the top edge: also respect the real floor (porches are a little higher than the last step)
          const g = world.groundBelow(p.x, again.s.o.y + again.s.H + 0.6, p.z, 1.2);
          if (g !== null) hgt = Math.max(hgt, g);
        }
        if (p.y <= hgt + 0.02) { p.y = hgt; if (this.velocity.y < 0) this.velocity.y = 0; this.grounded = true; }
        else this.grounded = p.y - hgt < 0.08;
        this.onStairs = again;
        world.collideDynamic(p, this.radius, this.height);
        return;
      }
    }
    this.onStairs = null;

    // regular movement: step-up trick (lift, move, collide, drop back to ground)
    const lift = wasGrounded && this.velocity.y <= 0 ? STEP : 0;
    p.y += lift;
    p.x += this.velocity.x * dt; p.z += this.velocity.z * dt; p.y += this.velocity.y * dt;

    _seg.start.set(p.x, p.y + this.radius, p.z);
    _seg.end.set(p.x, p.y + Math.max(this.height - this.radius, this.radius + 0.01), p.z);
    world.collideCapsule(_seg, this.radius, _push);
    p.set(_seg.start.x, _seg.start.y - this.radius, _seg.start.z);
    world.collideDynamic(p, this.radius, this.height);

    this.grounded = false;
    if (lift) {
      const hit = world.raycast(_v.set(p.x, p.y + 0.05, p.z), _down, lift + 0.12);
      if (hit && hit.face && Math.abs(hit.face.normal.y) > 0.55) {
        p.y = hit.point.y; this.grounded = true; if (this.velocity.y < 0) this.velocity.y = 0;
      } else {
        p.y -= lift;
        _seg.start.set(p.x, p.y + this.radius, p.z);
        _seg.end.set(p.x, p.y + Math.max(this.height - this.radius, this.radius + 0.01), p.z);
        world.collideCapsule(_seg, this.radius, _push);
        p.set(_seg.start.x, _seg.start.y - this.radius, _seg.start.z);
      }
    }
    if (!this.grounded && _push.lengthSq() > 0) {
      const n = _v.copy(_push).normalize();
      if (n.y > 0.55) { this.grounded = true; if (this.velocity.y < 0) this.velocity.y = 0; }
      else if (n.y < -0.5 && this.velocity.y > 0) this.velocity.y = 0;  // bumped head
      else {
        // slide along walls: remove the velocity component into the wall
        const d = this.velocity.x * n.x + this.velocity.z * n.z;
        if (d < 0) { this.velocity.x -= n.x * d; this.velocity.z -= n.z * d; }
      }
    }
    if (!this.grounded && this.velocity.y <= 0) {
      // snap to ground when walking down gentle slopes / small steps
      const hit = world.raycast(_v.set(p.x, p.y + 0.05, p.z), _down, 0.25);
      if (hit && hit.face && Math.abs(hit.face.normal.y) > 0.6 && wasGrounded) { p.y = hit.point.y; this.grounded = true; this.velocity.y = 0; }
    }
  }

  _safety(dt) {
    const p = this.position;
    const g = this.game;
    // water: the moat and ponds are too deep to wade into; return to the last safe place
    const wl = g.water?.levelAt(p.x, p.z);
    const bounds = g.levelData?.bounds;
    let reset = null;
    if (wl !== null && wl !== undefined && p.y < wl - 0.35) reset = 'hint.water';
    if (p.y < -30) reset = 'hint.fell';
    if (bounds && (p.x < bounds.x0 || p.x > bounds.x1 || p.z < bounds.z0 || p.z > bounds.z1)) reset = 'hint.bounds';
    // outside the moat the only walkable area is the western landing: keep the player near it
    const onIsland = Math.abs(p.x) < 402 && p.z > -292 && p.z < 462;
    const onMoatCauseway = Math.abs(p.x) < 7 && p.z >= 455 && p.z < 600;
    const onLanding = Math.abs(p.x) < 90 && p.z >= 575 && p.z < 660;
    if (!onIsland && !onMoatCauseway && !onLanding && p.y > -5) reset = 'hint.bounds';
    if (reset) {
      g.events.emit('hint', { key: reset });
      g.audio?.playSplash?.(reset === 'hint.water');
      this.teleport(this.lastSafe.clone(), this.yaw + Math.PI);
      return;
    }
    this.safeTimer -= dt;
    if (this.grounded && this.safeTimer <= 0 && !this.onStairs) {
      // only remember points away from the water's edge
      const edge = [[1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]].every(([dx, dz]) => {
        const w = g.water?.levelAt(p.x + dx, p.z + dz);
        return w === null || w === undefined || p.y > w + 0.3;
      });
      if (edge) { this.lastSafe.copy(p); this.safeTimer = 0.5; }
    }
  }

  get headPosition() { return _v.copy(this.position).setY(this.position.y + this.height - 0.12); }

  /** Surface under the feet for footstep sounds. */
  surface() {
    if (this.onStairs) return 'stone';
    const p = this.position;
    if (p.y > 0.25) return 'stone';
    const wl = this.game.water?.levelAt(p.x, p.z);
    if (wl !== null && wl !== undefined && p.y < wl + 0.2) return 'water';
    if (Math.abs(p.x) < 6.2 && p.z > 130 && p.z < 600) return 'stone';
    return 'grass';
  }

  setVisible(v) { this.object.visible = v; }
  static clampPitch(p) { return clamp(p, -1.2, 1.25); }
}
