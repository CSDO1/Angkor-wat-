import { DISCOVERIES, RELIEFS } from '../data/history.js';
import { B } from '../core/utils.js';
import { makeMarker, animateMarker } from '../artifacts/ArtifactModels.js';

/**
 * Khmer history discovery points (always-visible glowing markers) and the hidden bas-relief
 * survey markers of Chapter 3 (faint glints only visible up close).
 */
export class DiscoverySystem {
  constructor(game) {
    this.game = game;
    this.markers = [];
  }

  build() {
    const g = this.game;
    for (const d of DISCOVERIES) {
      const pos = g.snapToGround(B(...d.pos), 1.2);
      const m = makeMarker();
      m.position.copy(pos).setY(pos.y + 1.6);
      g.scene.add(m);
      this.markers.push({ m, def: d, kind: 'discovery' });
      g.interaction.register({
        id: 'disc_' + d.id, position: m.position, radius: d.radius, verb: 'hud.discover',
        label: () => g.i18n.pick(d.name),
        onInteract: () => this.open(d),
      });
    }
    for (const r of RELIEFS) {
      const pos = B(...r.pos);
      const m = makeMarker({ color: 0xffe2a8, scale: 0.55, subtle: true });
      m.position.copy(pos);
      g.scene.add(m);
      this.markers.push({ m, def: r, kind: 'relief' });
      g.interaction.register({
        id: 'relief_' + r.id, position: m.position, radius: 3.2, yTolerance: 2.5, verb: 'hud.inspect',
        label: () => g.i18n.pick(r.name),
        enabled: () => !g.reliefsFound.has(r.id),
        onInteract: () => this.openRelief(r),
      });
    }
  }

  open(d) {
    const g = this.game;
    const isNew = !g.discoveries.has(d.id);
    g.discoveries.add(d.id);
    g.journal.log('place', d.id);
    g.ui.discovery.show({
      title: g.i18n.pick(d.name), khmer: d.khmer, period: g.i18n.pick(d.period),
      history: g.i18n.pick(d.history), architecture: g.i18n.pick(d.architecture), illus: d.illus, isNew,
    });
    if (isNew) {
      g.audio.ui('discover');
      g.events.emit('discovered', { id: d.id });
      g.save.autosave('discovery');
    } else g.audio.ui('open');
  }

  openRelief(r) {
    const g = this.game;
    const isNew = !g.reliefsFound.has(r.id);
    g.reliefsFound.add(r.id);
    g.journal.log('relief', r.id);
    g.ui.discovery.show({
      title: g.i18n.pick(r.name), khmer: g.i18n.pick(r.where), period: g.i18n.pick({ en: 'Bas-relief, first half of the 12th century', km: 'ចម្លាក់លៀន ពាក់កណ្តាលទីមួយនៃសតវត្សទី១២' }),
      history: g.i18n.pick(r.text),
      architecture: g.i18n.pick({ en: 'The glowing survey marker is a game device (fictional). The relief it points to is real.', km: 'សញ្ញាស្ទង់ដែលភ្លឺ គឺជាឧបករណ៍ក្នុងហ្គេម (ប្រឌិត)។ ចម្លាក់លៀនដែលវាចង្អុលទៅគឺពិតប្រាកដ។' }),
      illus: r.illus, isNew,
    });
    if (isNew) { g.audio.ui('discover'); g.events.emit('relief-found', { id: r.id }); g.save.autosave('relief'); }
  }

  update(dt, camPos) {
    const g = this.game;
    for (const { m, def, kind } of this.markers) {
      const d = m.position.distanceTo(camPos);
      if (kind === 'relief') {
        const show = !g.reliefsFound.has(def.id) && d < 22;
        animateMarker(m, dt, show);
      } else {
        const seen = g.discoveries.has(def.id);
        animateMarker(m, dt, d < 180);
        m.userData.gem.material.emissiveIntensity = seen ? 0.35 : 1.4;
        m.userData.glow.material.opacity = seen ? 0.25 : 0.9;
      }
    }
  }
}
