/**
 * Save system: one manual slot + one autosave, in localStorage.
 * Stores player position/facing, chapter & objectives, artifacts, discoveries, reliefs, puzzles,
 * quests, flags, time of day, plus settings (settings are also persisted on their own).
 */
const SLOTS = { auto: 'angkor.save.auto', manual: 'angkor.save.manual' };
const VERSION = 1;

export class SaveManager {
  constructor(game) {
    this.game = game;
    this.lastAuto = 0;
  }

  snapshot() {
    const g = this.game;
    const p = g.player.position;
    return {
      version: VERSION,
      savedAt: new Date().toISOString(),
      player: { x: p.x, y: p.y, z: p.z, yaw: g.player.yaw, camYaw: g.cameraController.yaw, camPitch: g.cameraController.pitch },
      chapter: g.objectives.chapterIndex,
      objectives: g.objectives.serialize(),
      artifacts: [...g.artifacts.collected],
      discoveries: [...g.discoveries],
      reliefs: [...g.reliefsFound],
      puzzles: g.puzzles.serialize(),
      quests: g.quests.serialize(),
      flags: [...g.flags],
      journal: g.journal.serialize(),
      time: g.timeOfDay.name,
      ended: g.ended,
      settings: g.settings.toJSON(),
      language: g.i18n.lang,
      playTime: g.playTime,
    };
  }

  save(slot = 'manual') {
    try {
      localStorage.setItem(SLOTS[slot], JSON.stringify(this.snapshot()));
      this.game.events.emit('saved', { slot });
      return true;
    } catch (e) {
      console.warn('Save failed', e);
      return false;
    }
  }

  /** Autosave after discoveries / chapter progress; throttled so bursts don't thrash storage. */
  autosave(reason = '') {
    const now = performance.now();
    if (now - this.lastAuto < 1500) { clearTimeout(this._t); this._t = setTimeout(() => this.autosave(reason), 1600); return; }
    this.lastAuto = now;
    if (this.save('auto')) this.game.events.emit('autosaved', { reason });
  }

  read(slot) {
    try {
      const d = JSON.parse(localStorage.getItem(SLOTS[slot]) || 'null');
      return d && d.version === VERSION ? d : null;
    } catch { return null; }
  }

  latest() {
    const a = this.read('auto'), m = this.read('manual');
    if (!a) return m; if (!m) return a;
    return a.savedAt > m.savedAt ? a : m;
  }

  info(slot) {
    const d = this.read(slot);
    return d ? { savedAt: new Date(d.savedAt), chapter: d.chapter, artifacts: d.artifacts.length } : null;
  }
}
