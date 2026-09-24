import { DISCOVERIES, RELIEFS } from '../data/history.js';
import { PEOPLE, CLAIMS, isUnlocked } from '../data/journal.js';

/**
 * The Angkor Journal: an ordered log of places, bas-reliefs, artifacts, people, quests and facts.
 * Rendering lives in ui/MenuUI.js; this system only records and notifies.
 */
export class JournalSystem {
  constructor(game) {
    this.game = game;
    this.entries = [];   // {type, id, t}
  }

  log(type, id) {
    if (this.entries.some((e) => e.type === type && e.id === id)) return;
    this.entries.push({ type, id, t: this.game.playTime });
    this.game.events.emit('journal', { type, id });
  }

  /** Completion per journal section, for the journal header and the end-of-story summary. */
  progress() {
    const g = this.game;
    const sec = {
      places: { n: DISCOVERIES.filter((d) => g.discoveries.has(d.id)).length, of: DISCOVERIES.length },
      reliefs: { n: RELIEFS.filter((r) => g.reliefsFound.has(r.id)).length, of: RELIEFS.length },
      people: { n: PEOPLE.filter((e) => isUnlocked(g, e)).length, of: PEOPLE.length },
      facts: { n: CLAIMS.filter((e) => isUnlocked(g, e)).length, of: CLAIMS.length },
      artifacts: { n: g.artifacts.mainCount(), of: g.artifacts.mainTotal },
    };
    const n = Object.values(sec).reduce((a, x) => a + x.n, 0), of = Object.values(sec).reduce((a, x) => a + x.of, 0);
    return { ...sec, total: { n, of, pct: of ? Math.round((n / of) * 100) : 0 } };
  }

  has(type, id) { return this.entries.some((e) => e.type === type && e.id === id); }
  list(type) { return this.entries.filter((e) => e.type === type); }
  serialize() { return this.entries.slice(); }
  restore(d) { this.entries = (d ?? []).slice(); }
}
