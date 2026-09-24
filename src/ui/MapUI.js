import { DISCOVERIES } from '../data/history.js';
import { ARTIFACTS } from '../data/artifacts.js';
import { NPCS } from '../data/npcs.js';
import { B } from '../core/utils.js';

/**
 * Exploration map drawn from the building footprints exported by the Blender pipeline.
 * Shows the player, landmarks, discovered places, the current objective area and found artifacts;
 * undiscovered secrets stay hidden. North is up (north = -X in world space).
 */
const OBJECTIVE_AREAS = {
  explore_entrance: [0, -603], cross_causeway: [0, -520], explore_west_entrance: [0, -444],
  find_reliefs: null, recover_artifacts: null, reach_sanctuary: [0, -40], highest_viewpoint: [0, -17],
};

export class MapUI {
  constructor(game) {
    this.game = game;
    this.view = { cx: -175, cy: 0, span: 640 };   // map centre (map-space metres) and visible width
  }

  zoom(f, u = 0.5, v = 0.5) {
    const V = this.view, span = Math.min(1600, Math.max(120, V.span * f));
    // keep the point under the cursor fixed
    V.cx += (u - 0.5) * (V.span - span); V.cy += (v - 0.5) * (V.span - span);
    V.span = span;
  }

  pan(du, dv) { this.view.cx -= du * this.view.span; this.view.cy -= dv * this.view.span; }

  centerOnPlayer() { const p = this.game.player.position; this.view.cx = -p.z; this.view.cy = p.x; }

  /** Map fraction (0..1 across the square canvas) -> world x/z. */
  unproject(u, v) { const V = this.view; return { x: (v - 0.5) * V.span + V.cy, z: -((u - 0.5) * V.span + V.cx) }; }

  /** World (three.js) x/z -> map pixels. Map up = north (-x), map right = east (-z). */
  project(x, z, W, H, view) {
    const u = (-z - view.cx) / view.span + 0.5;
    const v = (x - view.cy) / view.span + 0.5;
    return [u * W, v * H * (W / H)];
  }

  draw(canvas) {
    const g = this.game, lvl = g.levelData;
    const k = +(canvas.dataset.k || 1);   // backing-store scale for sharp lines on HiDPI screens
    const W = canvas.width / k, H = canvas.height / k;
    const c = canvas.getContext('2d');
    c.setTransform(k, 0, 0, k, 0, 0);
    // view: whole island, or zoomed around the temple
    const view = this.view;
    const P = (x, z) => this.project(x, z, W, W, view);
    c.fillStyle = '#12100c'; c.fillRect(0, 0, W, H);

    // water
    c.fillStyle = '#1d2c2c';
    for (const w of lvl.water) {
      const [x0, y0] = P(w.x1, w.z1), [x1, y1] = P(w.x0, w.z0);
      c.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
    }
    // island
    c.fillStyle = '#23201a';
    { const [x0, y0] = P(400, 460), [x1, y1] = P(-400, -290); c.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)); }
    // ponds on top of the island
    c.fillStyle = '#1d2c2c';
    for (const w of lvl.water) if (w.name !== 'Water_Moat') {
      const [x0, y0] = P(w.x1, w.z1), [x1, y1] = P(w.x0, w.z0);
      c.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
    }
    // footprints
    const colors = { platform: '#4a3f31', building: '#8a7556', tower: '#d9b36a', naga: '#6d5c45', stair: '#5d5040' };
    for (const kind of ['platform', 'building', 'stair', 'naga', 'tower']) {
      c.fillStyle = colors[kind];
      for (const f of lvl.footprints) {
        if (f[0] !== kind) continue;
        const [x0, y0] = P(f[3], f[4]), [x1, y1] = P(f[1], f[2]);
        const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0);
        if (w < 0.6 && h < 0.6) continue;
        c.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.max(1, w), Math.max(1, h));
      }
    }

    const diamond = (x, y, r, fill, stroke) => {
      c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath();
      if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.stroke(); }
    };
    c.font = '12px "Source Sans 3", "Noto Sans Khmer", sans-serif';
    // undiscovered places: faint outline only, no name
    for (const d of DISCOVERIES) {
      if (g.discoveries.has(d.id)) continue;
      const p = B(...d.pos); const [x, y] = P(p.x, p.z);
      diamond(x, y, 4, null, 'rgba(217,179,106,.35)');
    }
    const showNames = view.span < 800;
    // discovered places
    for (const d of DISCOVERIES) {
      if (!g.discoveries.has(d.id)) continue;
      const p = B(...d.pos); const [x, y] = P(p.x, p.z);
      diamond(x, y, 5, '#d9b36a', '#1a1510');
      if (showNames || ['angkor_wat', 'west_gopura', 'central_sanctuary'].includes(d.id)) {
        c.fillStyle = '#efe4cc'; c.fillText(g.i18n.pick(d.name), x + 8, y + 4);
      }
    }
    // people
    for (const n of NPCS) {
      if (!g.flags.has('met_' + n.id)) continue;
      const p = B(...n.pos); const [x, y] = P(p.x, p.z);
      c.beginPath(); c.arc(x, y, 4, 0, 7); c.fillStyle = '#a8d8ff'; c.fill();
    }
    // artifacts found
    for (const a of ARTIFACTS) {
      if (!g.artifacts.collected.has(a.id)) continue;
      const p = B(...a.pos); const [x, y] = P(p.x, p.z);
      diamond(x, y, 4, '#7fb07a', '#10150e');
    }
    // objective
    const o = g.objectives.objective;
    const area = o && !g.objectives.finished && g.settings.values.guidance !== 'free' ? OBJECTIVE_AREAS[o.id] : null;
    if (area) {
      const p = B(area[0], area[1]); const [x, y] = P(p.x, p.z);
      const t = performance.now() / 400;
      c.beginPath(); c.arc(x, y, 10 + Math.sin(t) * 3, 0, 7); c.strokeStyle = '#f0cf88'; c.lineWidth = 2; c.stroke();
    }
    // waypoint
    if (g.waypoint) {
      const [x, y] = P(g.waypoint.x, g.waypoint.z);
      c.strokeStyle = '#ff9d5c'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 18); c.stroke();
      c.beginPath(); c.moveTo(x, y - 18); c.lineTo(x + 11, y - 14); c.lineTo(x, y - 10); c.closePath(); c.fillStyle = '#ff9d5c'; c.fill();
      c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill();
    }
    // player
    const pp = g.player.position; const [px, py] = P(pp.x, pp.z);
    const yaw = g.player.yaw;
    // facing in map space: forward (sin yaw, cos yaw) in x/z -> map (u = -z, v = x)
    const fx = -Math.cos(yaw), fy = Math.sin(yaw);
    c.save(); c.translate(px, py); c.rotate(Math.atan2(fy, fx));
    c.beginPath(); c.moveTo(9, 0); c.lineTo(-6, 5); c.lineTo(-3, 0); c.lineTo(-6, -5); c.closePath();
    c.fillStyle = '#ffffff'; c.fill(); c.restore();

    // north arrow
    c.fillStyle = '#d9b36a'; c.font = '14px Marcellus, serif';
    c.fillText(g.i18n.t('map.north'), W - 26, 24);
    c.beginPath(); c.moveTo(W - 20, 30); c.lineTo(W - 25, 42); c.lineTo(W - 15, 42); c.closePath(); c.fill();
  }
}
