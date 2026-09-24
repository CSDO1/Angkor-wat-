import * as THREE from 'three';
import { el } from '../core/utils.js';
import { QUESTS } from '../data/npcs.js';

/**
 * Minimal HUD: objective (top-left), artifacts (top-right), interaction prompt, contextual hints,
 * banners, toasts, a thin compass and small markers over nearby points of interest.
 */
export class HUD {
  constructor(root, game) {
    this.game = game;
    this.root = el('div', { class: 'hud' });
    this.obj = el('div', { class: 'hud-objective ui-text' });
    this.art = el('div', { class: 'hud-artifacts ui-text' });
    this.fps = el('div', { class: 'hud-fps hidden' });
    this.prompt = el('div', { class: 'hud-prompt' }, [el('div', { class: 'key', text: 'E' }), el('div', {}, [el('div', { class: 'verb' }), el('div', { class: 'what' })])]);
    this.hint = el('div', { class: 'hud-hint ui-text' });
    this.banner = this._banner.bind(this);
    this.bannerEl = el('div', { class: 'hud-banner' }, [el('div', { class: 'small' }), el('div', { class: 'big' })]);
    this.toasts = el('div', { class: 'hud-toasts' });
    this.compass = el('div', { class: 'hud-compass' }, [el('div', { class: 'strip' }), el('i', { class: 'wp hidden' })]);
    this.wpLabel = el('div', { class: 'hud-wp hidden' });
    this.discEl = el('div', { class: 'hud-discovery' }, [el('div', { class: 'kicker' }), el('div', { class: 'name' }), el('div', { class: 'kname' }), el('div', { class: 'foot' })]);
    this.savingEl = el('div', { class: 'hud-saving' }, [el('i'), el('span')]);
    this.markers = el('div', { class: 'world-markers' });
    this.root.append(this.markers, this.obj, this.art, this.fps, this.compass, this.wpLabel, this.prompt, this.hint, this.bannerEl, this.discEl, this.toasts, this.savingEl);
    root.append(this.root);
    this._buildCompass();
    this.hintTimer = 0;
    this.visible = true;
    this.markerEls = new Map();
    this._v = new THREE.Vector3();

    const e = game.events;
    e.on('objective', (s) => this.renderObjective(s));
    e.on('quests', () => this.renderObjective(game.objectives.status()));
    e.on('language', () => { this.renderObjective(game.objectives.status()); this.renderArtifacts(); this._buildCompass(); });
    e.on('artifact-collected', () => this.renderArtifacts());
    e.on('interact-focus', (f) => this.setPrompt(f));
    e.on('hint', ({ key, text, time }) => this.showHint(text ?? game.i18n.t(key), time));
    e.on('saved', ({ slot }) => slot === 'manual' && this.toast(game.i18n.t('hud.saved')));
    e.on('saving', () => this.showSaving());
    e.on('new-discovery', ({ name }) => this.showDiscovery(name));
    e.on('journal-unlock', ({ kind, entry }) => this.toast(`${game.i18n.t(kind === 'people' ? 'hud.journalPeople' : 'hud.journalFacts')}${entry.name ? ' — ' + game.i18n.pick(entry.name) : ''}`));
    e.on('objective-complete', ({ objective }) => this._banner(game.i18n.t('hud.objectiveDone'), game.i18n.pick(objective.text)));
    e.on('chapter', ({ chapter }) => setTimeout(() => this._banner(game.i18n.t('hud.chapter'), game.i18n.pick(chapter.title), 'chapter'), 1800));
    e.on('journal', () => {});
  }

  setVisible(v) { this.visible = v; this.root.style.display = v ? '' : 'none'; }

  renderObjective(s) {
    const g = this.game;
    this.obj.innerHTML = '';
    if (!s || g.objectives.finished) {
      if (g.objectives.finished) this.obj.append(el('div', { class: 'label', text: g.i18n.t('hud.objective') }), el('div', { class: 'text', text: g.i18n.t('end.continue') }));
      return;
    }
    const counter = s.progress.of ? el('span', { class: 'counter', text: `${g.i18n.num(s.progress.n)} / ${g.i18n.num(s.progress.of)}` }) : null;
    this.obj.append(
      el('div', { class: 'label', text: g.i18n.t('hud.objective') }),
      el('div', { class: 'chapter', text: g.i18n.pick(s.chapter.title) }),
      el('div', { class: 'text' }, [g.i18n.pick(s.objective.text), counter]),
    );
    if (s.sub) this.obj.append(el('ul', { class: 'subs' }, s.sub.map((x) => el('li', { class: x.done ? 'done' : '', text: g.i18n.pick(x.text) }))));
    const active = Object.entries(g.quests.quests).filter(([, q]) => q.state === 'active');
    if (active.length) {
      this.obj.append(el('div', { class: 'optional' }, active.map(([id, q]) => el('div', {}, [
        el('b', { text: g.i18n.t('objectives.optional') + ' · ' }), `${g.i18n.pick(QUESTS[id].desc)} (${g.i18n.num(q.n)}/${g.i18n.num(QUESTS[id].goal)})`]))));
    }
  }

  renderArtifacts() {
    const g = this.game;
    const keys = g.puzzles.keys.size;
    this.art.innerHTML = '';
    this.art.append(
      el('div', { class: 'label', text: g.i18n.t('hud.artifacts') }),
      el('div', { class: 'value', text: `${g.i18n.num(g.artifacts.mainCount())} / ${g.i18n.num(g.artifacts.mainTotal)}` }),
    );
    if (keys) this.art.append(el('div', { class: 'keys', text: `◆ × ${g.i18n.num(keys)}` }));
  }

  setPrompt(f) {
    const g = this.game;
    if (!f) { this.prompt.classList.remove('show'); return; }
    this.prompt.querySelector('.key').textContent = g.input.usingPad ? 'X' : 'E';
    this.prompt.querySelector('.verb').textContent = g.i18n.t(f.verb);
    this.prompt.querySelector('.what').textContent = f.label ?? '';
    this.prompt.classList.add('show');
  }

  showHint(text, time = 5) {
    this.hint.textContent = text;
    this.hint.classList.add('show');
    this.hintTimer = time;
  }

  _banner(small, big, kind = '') {
    const [s, b] = this.bannerEl.children;
    s.textContent = small; b.textContent = big;
    this.bannerEl.classList.remove('show'); void this.bannerEl.offsetWidth;
    this.bannerEl.classList.add('show');
    clearTimeout(this._bt);
    this._bt = setTimeout(() => this.bannerEl.classList.remove('show'), kind === 'chapter' ? 4200 : 3000);
  }

  /** Non-blocking "new discovery" card: bilingual name, fades by itself, never pauses play. */
  showDiscovery(name) {
    const g = this.game, [k, n, kn, f] = this.discEl.children;
    const km = g.i18n.lang === 'km';
    k.textContent = g.i18n.t('hud.newDiscovery');
    n.textContent = km ? name.km : name.en;
    kn.textContent = km ? name.en : name.km;
    f.textContent = g.i18n.t('hud.journalUpdated');
    this.discEl.classList.remove('show'); void this.discEl.offsetWidth;
    this.discEl.classList.add('show');
    clearTimeout(this._dt);
    this._dt = setTimeout(() => this.discEl.classList.remove('show'), 4200);
  }

  showSaving() {
    this.savingEl.lastChild.textContent = this.game.i18n.t('hud.saving');
    this.savingEl.classList.add('show');
    clearTimeout(this._st);
    this._st = setTimeout(() => this.savingEl.classList.remove('show'), 1400);
  }

  toast(text) {
    const t = el('div', { class: 'toast', text });
    this.toasts.append(t);
    setTimeout(() => t.remove(), 4100);
  }

  _buildCompass() {
    const strip = this.compass.firstChild;
    strip.innerHTML = '';
    const km = this.game.i18n.lang === 'km';
    const names = km ? { 0: 'ជ', 90: 'ក', 180: 'ត', 270: 'ល' } : { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
    for (let r = 0; r < 3; r++) for (let d = 0; d < 360; d += 15) {
      const n = names[d];
      strip.append(el('span', { class: n ? 'cardinal' : '', text: n ?? (d % 45 === 0 ? '·' : '') }));
    }
  }

  update(dt, camera) {
    if (this.hintTimer > 0) { this.hintTimer -= dt; if (this.hintTimer <= 0) this.hint.classList.remove('show'); }
    const g = this.game;
    // compass: camera heading (compass: 0 = north = -X, 90 = east = -Z)
    const d = camera.getWorldDirection(this._v);
    let heading = THREE.MathUtils.radToDeg(Math.atan2(-d.z, -d.x));
    heading = (heading + 360) % 360;
    const px = (heading / 15) * 50 + 360 / 15 * 50;
    this.compass.firstChild.style.transform = `translateX(${150 - px - 25}px)`;
    this._waypoint(heading);
    // small floating labels for nearby undiscovered places and the current objective area
    this._markers(camera);
  }

  /** Waypoint pip on the compass plus its distance; cleared automatically on arrival. */
  _waypoint(heading) {
    const g = this.game, wp = g.waypoint, pip = this.compass.lastChild;
    if (!wp) { pip.classList.add('hidden'); this.wpLabel.classList.add('hidden'); return; }
    const p = g.player.position, dx = wp.x - p.x, dz = wp.z - p.z, dist = Math.hypot(dx, dz);
    if (dist < 6) { g.setWaypoint(null); return; }
    const bearing = (THREE.MathUtils.radToDeg(Math.atan2(-dz, -dx)) + 360) % 360;
    const delta = ((bearing - heading + 540) % 360) - 180;
    pip.classList.remove('hidden');
    pip.style.left = `${150 + Math.max(-140, Math.min(140, delta * (50 / 15)))}px`;
    this.wpLabel.classList.remove('hidden');
    this.wpLabel.textContent = `${g.i18n.t('hud.waypoint')} · ${g.i18n.num(Math.round(dist))} m`;
  }

  _markers(camera) {
    const g = this.game;
    const ui = g.settings.values.uiScale || 1;   // #ui-root is zoomed; convert screen px to its space
    const w = innerWidth / ui, h = innerHeight / ui;
    const seen = new Set();
    for (const it of g.interaction.items.values()) {
      if (!it.id.startsWith('disc_') && !it.id.startsWith('npc_') && !it.id.startsWith('artifact_')) continue;
      if (!it.enabled()) continue;
      const pos = it.position;
      const dist = pos.distanceTo(camera.position);
      if (dist > 40 || dist < 3.5) continue;
      if (it.id.startsWith('disc_') && g.discoveries.has(it.id.slice(5))) continue;
      const v = this._v.copy(pos).project(camera);
      if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) continue;
      let e = this.markerEls.get(it.id);
      if (!e) { e = el('div', { class: 'wm' }, [el('i', { class: 'd' }), el('span')]); this.markers.append(e); this.markerEls.set(it.id, e); }
      e.lastChild.textContent = dist < 18 ? (it.label?.() ?? '') : '';
      e.style.left = `${(v.x * 0.5 + 0.5) * w}px`;
      e.style.top = `${(-v.y * 0.5 + 0.5) * h - 18}px`;
      e.style.opacity = String(Math.min(1, (40 - dist) / 10));
      seen.add(it.id);
    }
    for (const [id, e] of this.markerEls) if (!seen.has(id)) { e.remove(); this.markerEls.delete(id); }
  }
}
