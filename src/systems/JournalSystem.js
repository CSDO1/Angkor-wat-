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

  has(type, id) { return this.entries.some((e) => e.type === type && e.id === id); }
  list(type) { return this.entries.filter((e) => e.type === type); }
  serialize() { return this.entries.slice(); }
  restore(d) { this.entries = (d ?? []).slice(); }
}
