import * as THREE from 'three';
import { QUESTS } from '../data/npcs.js';
import { B } from '../core/utils.js';
import { makeMarker, animateMarker } from '../artifacts/ArtifactModels.js';
import { symbolCanvas } from '../ui/Illustrations.js';

/** Optional side quests given by NPCs (Devata Survey, Five Towers view, A Lost Page). */
export class QuestManager {
  constructor(game) {
    this.game = game;
    this.quests = {};   // id -> {state: 'active'|'done', n}
    this.spots = [];
  }

  state(id) { return this.quests[id]?.state ?? 'none'; }
  progress(id) { return this.quests[id]?.n ?? 0; }
  serialize() { return structuredClone(this.quests); }
  restore(d) { this.quests = structuredClone(d ?? {}); }

  activate(id) {
    if (this.quests[id]) return;
    this.quests[id] = { state: 'active', n: 0 };
    const g = this.game;
    g.ui.hud.toast(`${g.i18n.t('objectives.optional')}: ${g.i18n.pick(QUESTS[id].name)}`);
    g.journal.log('quest', id);
    g.events.emit('quests');
    g.save.autosave('quest');
  }

  advance(id, n = 1) {
    const q = this.quests[id];
    if (!q || q.state !== 'active') return;
    q.n = Math.min(QUESTS[id].goal, q.n + n);
    this.game.events.emit('quests');
    if (id === 'ukondayu' && q.n >= 1) this.finish(id);
  }

  finish(id) {
    const q = this.quests[id] ?? (this.quests[id] = { n: QUESTS[id].goal });
    q.state = 'done';
    const g = this.game;
    g.audio.ui('objective');
    g.ui.hud.toast(`✓ ${g.i18n.pick(QUESTS[id].name)}`);
    g.journal.log('quest-done', id);
    g.events.emit('quests');
    g.save.autosave('quest');
  }

  build() {
    const g = this.game;
    // devata survey spots: a chalk circle and a carved devata panel on the wall
    QUESTS.devata_survey.spots.forEach((p, i) => {
      const pos = B(...p);
      const ground = g.snapToGround(pos.clone(), 1.5);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.6), new THREE.MeshStandardMaterial({
        map: (() => { const t = new THREE.CanvasTexture(symbolCanvas('devata', 256, '#3a3024', '#8f806a')); t.colorSpace = THREE.SRGBColorSpace; return t; })(),
        roughness: 0.95,
      }));
      // the survey panels sit on the inner gallery walls of the second enclosure (|z| = 44.8 in three.js)
      const sgn = Math.sign(ground.z);
      face.position.copy(ground).setY(ground.y + 1.4);
      face.position.z = sgn * 44.7;
      face.rotation.y = sgn > 0 ? Math.PI : 0;
      const circle = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.67, 40), new THREE.MeshBasicMaterial({ color: 0xf2efe6, transparent: true, opacity: 0.8 }));
      circle.position.copy(face.position); circle.position.z -= sgn * 0.01; circle.rotation.y = face.rotation.y;
      g.scene.add(face, circle);
      const id = 'survey_' + i;
      this.spots.push({ id, done: false });
      g.interaction.register({
        id, position: face.position, radius: 2.6, yTolerance: 2, verb: 'hud.photo',
        label: () => g.i18n.pick({ en: 'Devata (survey)', km: 'ទេវតា (ស្ទង់)' }),
        enabled: () => this.state('devata_survey') === 'active' && !(this.quests.devata_survey.photos ?? []).includes(i),
        onInteract: () => {
          const q = this.quests.devata_survey; q.photos = [...(q.photos ?? []), i];
          g.ui.flash(); g.audio.ui('click');
          this.advance('devata_survey', 1);
        },
      });
    });

    // five towers viewpoint
    const vp = g.snapToGround(B(...QUESTS.five_towers_view.spot), 1.5);
    this.viewMarker = makeMarker({ scale: 0.6, color: 0xa8e0ff });
    this.viewMarker.position.copy(vp).setY(vp.y + 1.5);
    g.scene.add(this.viewMarker);
    g.interaction.register({
      id: 'five_view', position: this.viewMarker.position, radius: 3, verb: 'hud.photo',
      label: () => g.i18n.pick({ en: 'Viewpoint', km: 'ចំណុចមើលទេសភាព' }),
      enabled: () => this.state('five_towers_view') === 'active' && this.progress('five_towers_view') < 1,
      onInteract: () => {
        const from = vp.clone().setY(vp.y + 1.7);
        const target = B(0, 0, 32);
        g.cinematics.viewShot(from, target, () => {
          this.advance('five_towers_view', 1);
          g.journal.log('fact', 'five_towers');
        });
      },
    });
  }

  update(dt) {
    if (this.viewMarker) animateMarker(this.viewMarker, dt, this.state('five_towers_view') === 'active' && this.progress('five_towers_view') < 1);
  }
}
