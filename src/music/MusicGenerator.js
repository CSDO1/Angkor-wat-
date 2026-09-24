/**
 * Original generative music inspired by the timbres of Cambodian ensembles (mallet xylophone
 * similar to the roneat, gong-circle bells similar to the kong vong, a bowed fiddle voice similar
 * to the tro, and a soft skor-like drum) over a quiet drone. It does not reproduce any traditional
 * or recorded piece; phrases are generated from pentatonic scales, with long rests so it stays subtle.
 */
const SCALES = {
  bright: [0, 2, 4, 7, 9],     // anhemitonic pentatonic
  calm: [0, 2, 5, 7, 9],
  dusk: [0, 3, 5, 7, 10],
};
const ROOT = 146.83; // D3

export class MusicGenerator {
  constructor(ctx, out, reverbSend) {
    this.ctx = ctx;
    this.out = ctx.createGain(); this.out.gain.value = 0.9; this.out.connect(out);
    this.send = ctx.createGain(); this.send.gain.value = 0.55; this.out.connect(this.send); this.send.connect(reverbSend);
    this.duckGain = 1;
    this.nextTime = ctx.currentTime + 3;
    this.restUntil = ctx.currentTime + 4;
    this.mood = 'bright';
    this.intensity = 0.4;
    this._drone();
  }

  _drone() {
    const ctx = this.ctx;
    this.droneGain = ctx.createGain(); this.droneGain.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    for (const [f, d] of [[ROOT / 2, -4], [ROOT * 0.75, 3], [ROOT / 2, 5]]) {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = d;
      o.connect(lp); o.start();
    }
    const trem = ctx.createOscillator(); trem.frequency.value = 0.11;
    const tg = ctx.createGain(); tg.gain.value = 0.012; trem.connect(tg); tg.connect(this.droneGain.gain); trem.start();
    lp.connect(this.droneGain); this.droneGain.connect(this.out);
    this.droneGain.gain.setTargetAtTime(0.03, ctx.currentTime + 2, 4);
  }

  freq(deg, oct = 0) {
    const sc = SCALES[this.mood];
    const n = sc.length;
    const o = Math.floor(deg / n) + oct;
    const semi = sc[((deg % n) + n) % n] + 12 * o;
    return ROOT * Math.pow(2, semi / 12);
  }

  _mallet(f, t, amp, dur = 1.0) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(amp, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.out);
    for (const [m, a] of [[1, 1], [3.93, 0.22], [9.2, 0.06], [2.0, 0.1]]) {
      const o = ctx.createOscillator(); o.frequency.value = f * m; const pg = ctx.createGain(); pg.gain.value = a;
      o.connect(pg); pg.connect(g); o.start(t); o.stop(t + dur + 0.05);
    }
  }

  _bell(f, t, amp) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(amp, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
    g.connect(this.out);
    for (const [m, a] of [[1, 1], [2.76, 0.35], [5.4, 0.15], [8.93, 0.05]]) {
      const o = ctx.createOscillator(); o.frequency.value = f * m; const pg = ctx.createGain(); pg.gain.value = a;
      o.connect(pg); pg.connect(g); o.start(t); o.stop(t + 4.1);
    }
  }

  _fiddle(f, t, dur, amp) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
    const vib = ctx.createOscillator(); vib.frequency.value = 5.2; const vg = ctx.createGain(); vg.gain.value = f * 0.004;
    vib.connect(vg); vg.connect(o.frequency);
    // gentle ornament: slide into the note from slightly below
    o.frequency.setValueAtTime(f * 0.97, t); o.frequency.linearRampToValueAtTime(f, t + 0.18);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1300; lp.Q.value = 0.7;
    const bp = ctx.createBiquadFilter(); bp.type = 'peaking'; bp.frequency.value = 900; bp.gain.value = 5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(amp, t + 0.35);
    g.gain.setValueAtTime(amp, t + dur - 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); lp.connect(bp); bp.connect(g); g.connect(this.out);
    o.start(t); vib.start(t); o.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
  }

  _drum(t, amp) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.25);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(amp, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g); g.connect(this.out); o.start(t); o.stop(t + 0.55);
  }

  /** Schedule one phrase starting at time t; returns its length in seconds. */
  _phrase(t) {
    const beat = 60 / (this.mood === 'dusk' ? 62 : 70);
    const len = 8 + Math.floor(Math.random() * 8);
    let deg = Math.floor(Math.random() * 5) + 5, time = t;
    const useFiddle = this.mood !== 'bright' && Math.random() < 0.6;
    if (Math.random() < 0.7) this._drum(t, 0.1);
    for (let i = 0; i < len; i++) {
      const step = [-2, -1, -1, 1, 1, 2, 0][Math.floor(Math.random() * 7)];
      deg = Math.max(2, Math.min(12, deg + step));
      const dur = [0.5, 0.5, 1, 1, 1, 1.5, 2][Math.floor(Math.random() * 7)] * beat;
      const f = this.freq(deg);
      if (useFiddle) {
        if (i % 2 === 0) this._fiddle(f, time, dur * 2.2, 0.035);
      } else {
        this._mallet(f * 2, time, 0.05 * (0.6 + 0.4 * Math.random()), 1.2);
        this._mallet(f, time, 0.03, 1.0);   // octave doubling, as mallet ensembles often play
        if (dur >= beat && Math.random() < 0.5) this._mallet(f * 2, time + dur / 2, 0.025, 0.7);  // light tremolo-like repeat
      }
      if (i === len - 1 || (i % 6 === 0 && Math.random() < 0.4)) this._bell(this.freq(deg - 5), time, 0.035);
      time += dur;
    }
    return time - t;
  }

  update(dt, game) {
    const ctx = this.ctx, now = ctx.currentTime;
    const tod = game.timeOfDay.current;
    this.mood = tod.night > 0.5 ? 'dusk' : tod.el < 12 && tod.az > 180 ? 'dusk' : tod.el < 12 ? 'calm' : 'bright';
    if (now > this.restUntil && now + 0.3 > this.nextTime) {
      const len = this._phrase(Math.max(now + 0.1, this.nextTime));
      this.nextTime = now + len + 0.2;
      // long, varied rests keep the score in the background
      this.restUntil = this.nextTime + 6 + Math.random() * 16;
      this.nextTime = this.restUntil;
    }
    const target = this.duckGain;
    this.out.gain.setTargetAtTime(0.9 * target, now, 0.4);
  }

  duck(on) { this.duckGain = on ? 0.35 : 1; }

  /** Brief swell for discoveries / chapter changes. */
  sting(kind = 'chapter') {
    const t = this.ctx.currentTime + 0.05;
    const degs = kind === 'end' ? [0, 2, 4, 7, 9, 12] : [4, 7, 9];
    degs.forEach((d, i) => this._mallet(this.freq(d, 1), t + i * 0.18, 0.05, 1.8));
    this._bell(this.freq(0), t, 0.06);
  }
}
