import * as THREE from 'three';
import { clamp, damp, easeInOut } from '../core/utils.js';

/**
 * Cinematic third-person camera: orbit (mouse / right stick), smooth follow, zoom, wall collision
 * (never clips through the temple), optional first-person inspection mode, and scripted shots
 * with smooth blends back to gameplay.
 */
const _v = new THREE.Vector3();
const _d = new THREE.Vector3();

export class CameraController {
  constructor(camera, game) {
    this.camera = camera;
    this.game = game;
    this.yaw = 0;
    this.pitch = 0.18;
    this.distance = 4.2;
    this.targetDistance = 4.2;
    this.minDist = 1.4; this.maxDist = 9;
    this.sensitivity = 1;
    this.invertY = false;
    this.firstPerson = false;
    this.pivot = new THREE.Vector3();
    this.currentDist = 4.2;
    this.shot = null;     // scripted shot
    this.blend = null;    // blend from scripted pose back to gameplay
    this.shake = 0;
  }

  setYawBehind(yaw) { this.yaw = yaw + Math.PI; }

  handleInput(dt, input) {
    const s = 0.0022 * this.sensitivity;
    this.yaw -= input.look.x * s;
    this.pitch += input.look.y * s * (this.invertY ? -1 : 1);
    const pad = input.padLook || { x: 0, y: 0 };
    this.yaw -= pad.x * dt * 2.6 * this.sensitivity;
    this.pitch += pad.y * dt * 1.9 * this.sensitivity * (this.invertY ? -1 : 1);
    this.pitch = clamp(this.pitch, this.firstPerson ? -1.3 : -0.95, this.firstPerson ? 1.3 : 1.2);
    if (input.wheel) this.targetDistance = clamp(this.targetDistance + input.wheel * 0.55, this.minDist, this.maxDist);
    if (input.down('zoomIn')) this.targetDistance = clamp(this.targetDistance - dt * 4, this.minDist, this.maxDist);
    if (input.down('zoomOut')) this.targetDistance = clamp(this.targetDistance + dt * 4, this.minDist, this.maxDist);
  }

  toggleFirstPerson(on = !this.firstPerson) {
    this.firstPerson = on;
    this.game.player.setVisible(!on);
    if (on) this.pitch = clamp(this.pitch, -0.6, 0.6);
  }

  /** Gameplay camera pose for the current player state (writes into out position / look target). */
  gameplayPose(dt, outPos, outLook) {
    const player = this.game.player;
    const world = this.game.collision;
    const crouchDrop = player.standH - player.height;
    const target = _v.copy(player.position).setY(player.position.y + 1.55 - crouchDrop * 0.8);
    this.pivot.lerp(target, dt > 0 ? damp(14, dt) : 1);
    if (this.pivot.distanceTo(target) > 3) this.pivot.copy(target);

    const dir = _d.set(Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), Math.cos(this.yaw) * Math.cos(this.pitch));
    if (this.firstPerson) {
      outPos.copy(player.position).setY(player.position.y + player.height - 0.1);
      outLook.copy(outPos).addScaledVector(dir, -10);
      return;
    }
    this.distance += (this.targetDistance - this.distance) * damp(8, dt);
    // shoulder offset to the right so the character doesn't block the view
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).multiplyScalar(0.45 * Math.min(1, this.distance / 4));
    const pivot = this.pivot.clone().add(right);
    // collision: sphere-ish probe with a few rays; pull in quickly, ease back out slowly
    let allowed = this.distance;
    const probes = [[0, 0], [0.25, 0], [-0.25, 0], [0, 0.2], [0, -0.2]];
    const up = new THREE.Vector3(0, 1, 0), side = new THREE.Vector3().crossVectors(dir, up).normalize();
    for (const [sx, sy] of probes) {
      const o = pivot.clone().addScaledVector(side, sx * 0.3).addScaledVector(up, sy * 0.3);
      const hit = world.raycast(o, dir, this.distance + 0.3);
      if (hit) allowed = Math.min(allowed, Math.max(0.35, hit.distance - 0.3));
    }
    if (allowed < this.currentDist) this.currentDist += (allowed - this.currentDist) * damp(30, dt);
    else this.currentDist += (allowed - this.currentDist) * damp(3, dt);
    this.currentDist = Math.min(this.currentDist, allowed + 0.02);
    outPos.copy(pivot).addScaledVector(dir, this.currentDist);
    // don't dip below the ground / floor directly under the camera
    const floor = world.groundBelow(outPos.x, outPos.y + 0.5, outPos.z, 1.5);
    if (floor !== null && outPos.y < floor + 0.3) outPos.y = floor + 0.3;
    outLook.copy(pivot).addScaledVector(dir, -2);
    // fade the character when the camera is very close
    player.object.visible = !this.firstPerson && this.currentDist > 0.6;
  }

  /**
   * Scripted camera shot. keys: [{t, pos:Vector3, look:Vector3, fov?}] ; times in seconds.
   * onDone fires at the end; blendBack (s) smoothly returns to the gameplay camera.
   */
  playShot(keys, { onDone, blendBack = 2.5, loop = false } = {}) {
    this.shot = { keys, t: 0, onDone, blendBack, loop, dur: keys[keys.length - 1].t };
  }

  stopShot() {
    if (!this.shot) return;
    const s = this.shot; this.shot = null;
    this.blend = { from: this.camera.position.clone(), look: this._lastLook?.clone() ?? new THREE.Vector3(), t: 0, dur: s.blendBack };
    s.onDone?.();
  }

  _sample(keys, t, outPos, outLook) {
    let i = 0;
    while (i < keys.length - 2 && t > keys[i + 1].t) i++;
    const a = keys[i], b = keys[i + 1] ?? a;
    const u = b.t > a.t ? clamp((t - a.t) / (b.t - a.t), 0, 1) : 1;
    const e = a.ease === 'linear' ? u : easeInOut(u);
    // Catmull-Rom through neighbouring keys for smooth paths
    const p0 = (keys[i - 1] ?? a).pos, p1 = a.pos, p2 = b.pos, p3 = (keys[i + 2] ?? b).pos;
    catmull(p0, p1, p2, p3, e, outPos);
    const l0 = (keys[i - 1] ?? a).look, l1 = a.look, l2 = b.look, l3 = (keys[i + 2] ?? b).look;
    catmull(l0, l1, l2, l3, e, outLook);
    const fa = a.fov ?? 50, fb = b.fov ?? fa;
    return fa + (fb - fa) * e;
  }

  update(dt, input, inputActive) {
    const cam = this.camera;
    const pos = new THREE.Vector3(), look = new THREE.Vector3();
    if (this.shot) {
      const s = this.shot;
      s.t += dt;
      const fov = this._sample(s.keys, Math.min(s.t, s.dur), pos, look);
      cam.fov += (fov - cam.fov) * damp(6, dt); cam.updateProjectionMatrix();
      cam.position.copy(pos); cam.lookAt(look); this._lastLook = look.clone();
      if (s.t >= s.dur) { if (s.loop) s.t = 0; else this.stopShot(); }
      return;
    }
    if (inputActive) this.handleInput(dt, input);
    this.gameplayPose(dt, pos, look);
    const fovTarget = this.baseFov + (this.game.player.moveSpeed > 6 ? 5 : 0);
    cam.fov += (fovTarget - cam.fov) * damp(4, dt); cam.updateProjectionMatrix();
    if (this.blend) {
      const b = this.blend; b.t += dt;
      const k = easeInOut(clamp(b.t / b.dur, 0, 1));
      pos.lerpVectors(b.from, pos, k);
      look.lerpVectors(b.look, look, k);
      if (b.t >= b.dur) this.blend = null;
    }
    if (this.shake > 0 && this.reduceShake) this.shake = 0;
    if (this.shake > 0) { pos.x += (Math.random() - 0.5) * this.shake; pos.y += (Math.random() - 0.5) * this.shake; this.shake *= 0.9; }
    cam.position.copy(pos);
    cam.lookAt(look);
    this._lastLook = look;
  }

  get baseFov() { return this.game.settings?.values.fov ?? 60; }
}

function catmull(p0, p1, p2, p3, t, out) {
  const t2 = t * t, t3 = t2 * t;
  out.set(0, 0, 0)
    .addScaledVector(p0, -0.5 * t3 + t2 - 0.5 * t)
    .addScaledVector(p1, 1.5 * t3 - 2.5 * t2 + 1)
    .addScaledVector(p2, -1.5 * t3 + 2 * t2 + 0.5 * t)
    .addScaledVector(p3, 0.5 * t3 - 0.5 * t2);
  return out;
}
