import * as THREE from 'three';
import { NPCS } from '../data/npcs.js';
import { B, dampAngle } from '../core/utils.js';
import { HumanoidModel } from '../characters/HumanoidModel.js';

/**
 * Peaceful NPCs (all fictional) and the branching dialogue runner.
 * Node actions: flag:<id> · quest:<id> (start optional quest) · questdone:<id>
 */
export class DialogueSystem {
  constructor(game) {
    this.game = game;
    this.npcs = [];
    this.active = null;
  }

  build() {
    const g = this.game;
    for (const def of NPCS) {
      const model = new HumanoidModel(def.look);
      const pos = g.snapToGround(B(...def.pos), 1.5);
      model.root.position.copy(pos);
      const yaw = THREE.MathUtils.degToRad(def.yaw);
      model.root.rotation.y = yaw;
      g.scene.add(model.root);
      const npc = { def, model, pos, baseYaw: yaw, yaw, talking: false };
      this.npcs.push(npc);
      g.collision.addTrunk(pos.x, pos.z, 0.3);
      g.interaction.register({
        id: 'npc_' + def.id, position: pos.clone().setY(pos.y + 1.2), radius: 2.6, verb: 'hud.talk',
        label: () => `${g.i18n.pick(def.name)} · ${g.i18n.pick(def.role)}`,
        onInteract: () => this.start(npc),
      });
    }
  }

  start(npc) {
    const g = this.game;
    this.active = npc;
    npc.talking = true;
    if (!g.flags.has('met_' + npc.def.id)) { g.flags.add('met_' + npc.def.id); g.journal.log('person', npc.def.id); }
    g.audio.duck(true);
    g.setMode('dialogue');
    this.show(npc.def.start(g));
  }

  show(nodeId) {
    const g = this.game, npc = this.active;
    const node = nodeId && npc.def.nodes[nodeId];
    if (!node) { this.end(); return; }
    this.runAction(node.action);
    const choices = node.choices
      ? node.choices.map((c) => ({ text: g.i18n.pick(c), onPick: () => { this.runAction(c.action); this.show(c.next); } }))
      : [{ text: g.i18n.t(node.next ? 'dialogue.continue' : 'dialogue.end'), onPick: () => this.show(node.next) }];
    g.ui.dialogue.show({
      name: g.i18n.pick(npc.def.name), role: g.i18n.pick(npc.def.role), text: g.i18n.pick(node), choices,
      fictional: g.i18n.t('dialogue.fictional'),
    });
  }

  runAction(a) {
    if (!a) return;
    const g = this.game;
    for (const part of a.split(';')) {
      const [k, v] = part.split(':');
      if (k === 'flag') g.flags.add(v);
      if (k === 'quest') g.quests.activate(v);
      if (k === 'questdone') g.quests.finish(v);
    }
    g.events.emit('objective', g.objectives.status());
  }

  end() {
    const g = this.game;
    if (this.active) this.active.talking = false;
    this.active = null;
    g.ui.dialogue.hide();
    g.audio.duck(false);
    g.setMode('play');
  }

  update(dt) {
    const g = this.game;
    const pp = g.player.position;
    for (const n of this.npcs) {
      const d = n.pos.distanceTo(pp);
      // turn toward the player when near, back to their post otherwise
      const want = d < 5 ? Math.atan2(pp.x - n.pos.x, pp.z - n.pos.z) : n.baseYaw;
      n.yaw = dampAngle(n.yaw, want, 3, dt);
      n.model.root.rotation.y = n.yaw;
      n.model.root.visible = d < 250;
      if (d < 120) n.model.animate(dt, { speed: 0, grounded: true, talking: n.talking });
    }
  }
}
