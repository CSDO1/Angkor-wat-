import * as THREE from 'three';

/**
 * Generic interaction registry. Anything the player can use registers
 * { id, position, radius, verb (i18n key), label?, enabled(), onInteract(), yTolerance }.
 * The closest usable target in front of the player gets focus; E / X / (A) triggers it.
 */
const _v = new THREE.Vector3();

export class InteractionSystem {
  constructor(game) {
    this.game = game;
    this.items = new Map();
    this.focus = null;
  }

  register(item) {
    const it = { radius: 2.2, yTolerance: 1.8, verb: 'hud.interact', enabled: () => true, ...item };
    this.items.set(it.id, it);
    return it;
  }

  unregister(id) { this.items.delete(id); if (this.focus?.id === id) this.focus = null; }

  update(input, active) {
    const g = this.game;
    const p = g.player.position;
    const fwd = _v.set(Math.sin(g.player.yaw), 0, Math.cos(g.player.yaw));
    const camFwd = new THREE.Vector3(); g.camera.getWorldDirection(camFwd);
    let best = null, bestScore = Infinity;
    if (active) {
      for (const it of this.items.values()) {
        if (!it.enabled()) continue;
        const pos = typeof it.position === 'function' ? it.position() : it.position;
        const dy = pos.y - (p.y + 1);
        if (Math.abs(dy) > it.yTolerance + 1) continue;
        const dx = pos.x - p.x, dz = pos.z - p.z;
        const d = Math.hypot(dx, dz);
        if (d > it.radius) continue;
        const facing = d > 0.01 ? (dx * fwd.x + dz * fwd.z) / d : 1;
        const camFacing = d > 0.01 ? (dx * camFwd.x + dz * camFwd.z) / Math.hypot(camFwd.x, camFwd.z) / d : 1;
        const score = d - Math.max(facing, camFacing) * 0.8;
        if (score < bestScore) { bestScore = score; best = it; }
      }
    }
    if (best !== this.focus) {
      this.focus = best;
      g.events.emit('interact-focus', best ? { verb: best.verb, label: best.label?.() } : null);
    }
    if (best && active && input.pressed('interact')) {
      best.onInteract();
      g.events.emit('interact-focus', null);
      this.focus = null;
    }
  }
}
