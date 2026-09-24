import * as THREE from 'three';
import { el } from '../core/utils.js';
import { illustration } from './Illustrations.js';
import { makeArtifactModel } from '../artifacts/ArtifactModels.js';

/** Discovery panel (history markers, reliefs, clue stela). */
export class DiscoveryPanel {
  constructor(root, game) {
    this.game = game;
    this.el = el('div', { class: 'overlay interactive hidden' });
    root.append(this.el);
  }

  show(d) {
    const g = this.game, t = (k) => g.i18n.t(k);
    this.el.innerHTML = '';
    const close = el('button', { class: 'btn primary', text: t('discovery.close'), onclick: () => this.hide() });
    const card = el('div', { class: 'card panel-frame discovery ui-text' }, [
      el('div', { class: 'kicker', text: d.isNew ? t('discovery.new') : t('hud.discover') }),
      el('h2', { text: d.title }),
      d.khmer ? el('div', { class: 'kname', text: d.khmer }) : null,
      d.illus ? el('img', { src: illustration(d.illus, 720, 300), alt: '' }) : null,
      el('div', { class: 'meta' }, [el('b', { text: t('journal.period') }), el('span', { text: d.period })]),
      el('h3', {}, [t('journal.history'), el('span', { class: 'tag research', text: t('journal.researched') })]),
      el('p', { text: d.history }),
      el('h3', { text: t('journal.architecture') }),
      el('p', { text: d.architecture }),
      el('div', { class: 'actions' }, [close]),
    ]);
    this.el.append(card);
    this.el.classList.remove('hidden');
    requestAnimationFrame(() => this.el.classList.add('show'));
    g.setMode('panel');
    g.audio.duck(true);
    this.onKey = (e) => { if (e.code === 'Escape' || e.code === 'KeyE' || e.code === 'Enter') { e.stopPropagation(); this.hide(); } };
    setTimeout(() => addEventListener('keydown', this.onKey, true), 250);
    close.focus();
    if (d.isNew) g.ui.hud.toast(g.i18n.t('hud.journalUpdated'));
  }

  hide() {
    removeEventListener('keydown', this.onKey, true);
    this.el.classList.remove('show');
    setTimeout(() => this.el.classList.add('hidden'), 300);
    this.game.audio.duck(false);
    this.game.audio.ui('close');
    this.game.setMode('play');
  }
}

/** Bottom-of-screen dialogue box with choices. */
export class DialogueUI {
  constructor(root, game) {
    this.game = game;
    this.el = el('div', { class: 'dialogue card panel-frame interactive hidden ui-text' });
    root.append(this.el);
  }

  show({ name, role, text, choices, fictional }) {
    this.el.innerHTML = '';
    const btns = choices.map((c, i) => el('button', { class: 'btn' + (i === 0 ? ' primary' : ''), text: `${i + 1}. ${c.text}`, onclick: () => { this.game.audio.ui('click'); c.onPick(); } }));
    this.el.append(
      el('div', {}, [el('span', { class: 'who', text: name }), el('span', { class: 'role', text: role }), el('span', { class: 'tag fiction', text: fictional })]),
      el('div', { class: 'line', text }),
      el('div', { class: 'choices' }, btns),
    );
    this.el.classList.remove('hidden');
    requestAnimationFrame(() => this.el.classList.add('show'));
    this.choices = choices;
    btns[0]?.focus();
    removeEventListener('keydown', this.onKey, true);
    this.onKey = (e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= this.choices.length) { e.stopPropagation(); this.choices[n - 1].onPick(); }
      else if ((e.code === 'KeyE' || e.code === 'Space') && this.choices.length === 1) { e.stopPropagation(); e.preventDefault(); this.choices[0].onPick(); }
    };
    setTimeout(() => addEventListener('keydown', this.onKey, true), 200);
  }

  hide() {
    removeEventListener('keydown', this.onKey, true);
    this.el.classList.remove('show');
    setTimeout(() => this.el.classList.add('hidden'), 250);
  }
}

/**
 * Artifact inspection: the object is rendered by the main renderer in a separate small scene over
 * the (dimmed) world — nothing is reloaded. Drag to rotate 360°, wheel to zoom.
 */
export class InspectUI {
  constructor(root, game) {
    this.game = game;
    this.el = el('div', { class: 'inspect interactive hidden' });
    root.append(this.el);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.01, 50);
    this.camera.position.set(0, 0, 1.4);
    const key = new THREE.DirectionalLight(0xfff0dd, 2.4); key.position.set(1, 1.5, 2);
    const rim = new THREE.DirectionalLight(0xffc880, 1.6); rim.position.set(-2, 0.5, -1.5);
    this.scene.add(key, rim, new THREE.HemisphereLight(0xb8c4d8, 0x3a2c20, 0.9));
    const dim = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: 0x0a0806, transparent: true, opacity: 0.72, depthWrite: false }));
    dim.position.z = -5; dim.renderOrder = -1;
    this.scene.add(dim);
    this.dim = dim;
    this.holder = new THREE.Group(); this.scene.add(this.holder);
    this.rot = { x: 0.2, y: 0 }; this.zoom = 1.4; this.dragging = false;
    this.active = false;
  }

  open(a, onCollect) {
    const g = this.game, t = (k) => g.i18n.t(k), p = (o) => g.i18n.pick(o);
    this.holder.clear();
    const m = makeArtifactModel(a.model);
    const box = new THREE.Box3().setFromObject(m); const c = box.getCenter(new THREE.Vector3()); const s = box.getSize(new THREE.Vector3()).length();
    m.position.sub(c); m.scale.setScalar(0.7 / s); m.position.multiplyScalar(0.7 / s);
    this.holder.add(m);
    this.rot = { x: 0.25, y: 0.6 }; this.zoom = 1.4;
    this.el.innerHTML = '';
    const view = el('div', { class: 'view' }, [el('div', { class: 'help', text: t('artifact.rotate') })]);
    const collected = g.artifacts.collected.has(a.id);
    const add = el('button', { class: 'btn primary', text: collected ? t('artifact.close') : t('artifact.add'), onclick: () => { g.audio.ui('click'); this.close(); if (!collected) onCollect?.(); } });
    const side = el('div', { class: 'side ui-text' }, [
      el('div', { class: 'discovery' }, [el('div', { class: 'kicker', text: t('hud.artifactDiscovered') })]),
      el('h2', { text: p(a.name) }),
      el('div', { class: 'meta', style: 'color:var(--text-dim);font-size:13px' }, [`${t('artifact.category')}: ${p(a.category)}`]),
      el('h3', {}, [t('journal.context'), el('span', { class: 'tag research', text: t('journal.researched') })]),
      el('p', { text: p(a.context) }),
      el('h3', {}, [t('journal.ingame'), el('span', { class: 'tag fiction', text: t('journal.fictional') })]),
      el('p', { text: p(a.ingame) }),
      el('div', { style: 'margin-top:22px;display:flex;gap:10px' }, [add]),
    ]);
    this.el.append(view, side);
    view.addEventListener('pointerdown', (e) => { this.dragging = true; this.last = [e.clientX, e.clientY]; view.setPointerCapture(e.pointerId); });
    view.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      this.rot.y += (e.clientX - this.last[0]) * 0.01; this.rot.x += (e.clientY - this.last[1]) * 0.01;
      this.rot.x = Math.max(-1.4, Math.min(1.4, this.rot.x)); this.last = [e.clientX, e.clientY];
    });
    view.addEventListener('pointerup', () => { this.dragging = false; });
    view.addEventListener('wheel', (e) => { this.zoom = Math.max(0.6, Math.min(3, this.zoom + Math.sign(e.deltaY) * 0.12)); e.preventDefault(); }, { passive: false });
    this.view = view;
    this.el.classList.remove('hidden');
    requestAnimationFrame(() => this.el.classList.add('show'));
    this.active = true;
    g.setMode('inspect');
    g.audio.duck(true);
    add.focus();
  }

  close() {
    this.active = false;
    this.el.classList.remove('show');
    setTimeout(() => this.el.classList.add('hidden'), 350);
    this.game.audio.duck(false);
    this.game.setMode('play');
  }

  /** Gamepad / keyboard rotation while open. */
  update(dt, input) {
    if (!this.active) return;
    const pad = input.padLook ?? { x: 0, y: 0 };
    this.rot.y += (pad.x + input.axis.x) * dt * 2;
    this.rot.x += (pad.y - input.axis.y) * dt * 2;
    if (!this.dragging && !pad.x && !input.axis.x) this.rot.y += dt * 0.25;
    this.holder.rotation.set(this.rot.x, this.rot.y, 0);
    this.camera.position.set(0, 0, this.zoom);
    if (input.uiPressed('cancel')) this.close();
  }

  render(renderer) {
    if (!this.active || !this.view) return;
    const r = this.view.getBoundingClientRect();
    this.camera.aspect = r.width / Math.max(1, r.height);
    this.camera.updateProjectionMatrix();
    const W = innerWidth, H = innerHeight;
    renderer.setScissorTest(false);
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.setViewport(0, 0, W, H);
    // full-screen dim first, then the object in the left view area
    this.holder.visible = false;
    renderer.render(this.scene, this.camera);
    this.holder.visible = true;
    renderer.setViewport(r.left, H - r.bottom, r.width, r.height);
    renderer.clearDepth();
    this.dim.visible = false;
    renderer.render(this.scene, this.camera);
    this.dim.visible = true;
    renderer.setViewport(0, 0, W, H);
    renderer.autoClear = true;
  }
}
