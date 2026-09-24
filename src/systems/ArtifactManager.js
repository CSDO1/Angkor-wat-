import * as THREE from 'three';
import { ARTIFACTS } from '../data/artifacts.js';
import { B } from '../core/utils.js';
import { makeArtifactModel, glowTexture } from '../artifacts/ArtifactModels.js';

/**
 * Collectible (fictional replica) artifacts: world placement, pickup, "Artifact Discovered" banner,
 * the 3D inspection view and the collection used by the Angkor Journal.
 */
export class ArtifactManager {
  constructor(game) {
    this.game = game;
    this.collected = new Set();
    this.world = new Map();
  }

  build() {
    const g = this.game;
    for (const a of ARTIFACTS) {
      const pos = g.snapToGround(B(...a.pos), 1.5);
      const holder = new THREE.Group();
      holder.position.copy(pos);
      const model = makeArtifactModel(a.model);
      model.position.y = 0.35;
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.2, 10), g.materials.plinth);
      plinth.position.y = 0.1; plinth.receiveShadow = true;
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffd89a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: a.secret ? 0.25 : 0.55 }));
      glow.scale.setScalar(1.3); glow.position.y = 0.4;
      holder.add(plinth, model, glow);
      g.scene.add(holder);
      this.world.set(a.id, { holder, model, glow, def: a });
      g.interaction.register({
        id: 'artifact_' + a.id, position: holder.position.clone().setY(pos.y + 0.4), radius: 2.0, verb: 'hud.pickup',
        label: () => g.i18n.pick(a.name),
        enabled: () => !this.collected.has(a.id),
        onInteract: () => this.discover(a.id),
      });
    }
  }

  discover(id) {
    const g = this.game;
    const a = ARTIFACTS.find((x) => x.id === id);
    g.audio.ui('artifact');
    g.ui.hud.banner(g.i18n.t('hud.artifactDiscovered'), g.i18n.pick(a.name), 'artifact');
    setTimeout(() => g.openInspector(a, () => this.collect(id)), 900);
  }

  collect(id) {
    const g = this.game;
    if (this.collected.has(id)) return;
    this.collected.add(id);
    const w = this.world.get(id);
    if (w) w.holder.visible = false;
    g.journal.log('artifact', id);
    g.events.emit('artifact-collected', { id });
    if (id === 'ukondayu') g.quests.advance('ukondayu', 1);
    g.save.autosave('artifact');
  }

  mainCount() { return ARTIFACTS.filter((a) => a.main && this.collected.has(a.id)).length; }
  get mainTotal() { return ARTIFACTS.filter((a) => a.main).length; }

  restore(ids) {
    this.collected = new Set(ids);
    for (const [id, w] of this.world) w.holder.visible = !this.collected.has(id);
  }

  update(dt) {
    const t = performance.now() / 1000;
    for (const w of this.world.values()) {
      if (!w.holder.visible) continue;
      w.model.rotation.y += dt * 0.6;
      w.model.position.y = 0.38 + Math.sin(t * 1.5) * 0.03;
      w.glow.material.opacity = (w.def.secret ? 0.18 : 0.45) + Math.sin(t * 2.2) * 0.1;
    }
  }
}
