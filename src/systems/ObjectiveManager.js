import { CHAPTERS } from '../data/chapters.js';

/**
 * Chapter / objective progression. Objectives are polled (cheap predicates over game state), so
 * progress made early — e.g. artifacts found before Chapter 4 — counts as soon as a chapter opens.
 */
export class ObjectiveManager {
  constructor(game) {
    this.game = game;
    this.chapterIndex = 0;
    this.objIndex = 0;
    this.completed = new Set();
    this.timer = 0;
    this.finished = false;
  }

  get chapter() { return CHAPTERS[this.chapterIndex]; }
  get current() { return this.chapter; }
  get objective() { return this.chapter?.objectives[this.objIndex]; }
  atLeast(chapterId) { return this.chapterIndex >= CHAPTERS.findIndex((c) => c.id === chapterId); }

  serialize() { return { chapter: this.chapterIndex, obj: this.objIndex, completed: [...this.completed], finished: this.finished }; }

  restore(d) {
    if (!d) return;
    this.chapterIndex = d.chapter; this.objIndex = d.obj; this.completed = new Set(d.completed); this.finished = d.finished;
  }

  start() {
    this.game.events.emit('chapter', { chapter: this.chapter, index: this.chapterIndex, silent: false });
    this.game.events.emit('objective', this.status());
  }

  /** Status for the HUD / menu: current objective text, sub-steps, counters. */
  status() {
    const o = this.objective;
    if (!o) return null;
    const p = o.check(this.game);
    return {
      chapter: this.chapter, objective: o, progress: p,
      sub: o.sub?.map((s) => ({ text: s, done: !!s.check(this.game) })),
    };
  }

  update(dt) {
    if (this.finished) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = 0.25;
    const g = this.game;
    // bookkeeping flags used by predicates
    const p = g.player.position;
    if (Math.abs(p.x) < 12 && p.z < 434 && p.z > 130 && p.y > 1.0) g.flags.add('through_gopura');

    const o = this.objective;
    if (!o) return;
    const st = o.check(g);
    const key = JSON.stringify(st) + (o.sub ? o.sub.map((s) => +!!s.check(g)).join('') : '');
    if (key !== this._last) { this._last = key; g.events.emit('objective', this.status()); }
    if (st.done) this.complete(o);
  }

  complete(o) {
    const g = this.game;
    this.completed.add(o.id);
    g.events.emit('objective-complete', { objective: o });
    g.audio.ui('objective');
    this.objIndex++;
    if (this.objIndex >= this.chapter.objectives.length) {
      this.objIndex = 0;
      this.chapterIndex++;
      if (this.chapterIndex >= CHAPTERS.length) {
        this.chapterIndex = CHAPTERS.length - 1; this.objIndex = 0; this.finished = true;
        g.events.emit('story-complete');
        g.save.autosave('ending');
        return;
      }
      g.events.emit('chapter', { chapter: this.chapter, index: this.chapterIndex });
    }
    g.events.emit('objective', this.status());
    g.save.autosave('objective');
  }
}
