import * as THREE from 'three';
import { MusicGenerator } from '../music/MusicGenerator.js';

/**
 * Fully procedural, original audio (Web Audio API) — no recordings are used.
 * Buses: music / ambience / sfx / ui → master → compressor. A convolution reverb (generated impulse)
 * is faded in when the player is under a roof, and the outdoor ambience is muffled, so temple
 * interiors sound noticeably different from the open air.
 */
export class AudioManager {
  constructor(game) {
    this.game = game;
    this.ctx = null;
    this.ready = false;
    this.indoor = 0;
    this.stepTimer = 0;
    this.birdTimer = 2;
    this.cricketTimer = 0;
    this.volumes = { master: 0.85, music: 0.5, ambience: 0.8, sfx: 0.8, ui: 0.7 };
    this._v = new THREE.Vector3();
  }

  /** Must be called from a user gesture (browser autoplay policy). */
  start() {
    if (this.ctx) { this.ctx.resume(); return; }
    const ctx = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -14; this.comp.ratio.value = 3;
    this.master = ctx.createGain(); this.master.connect(this.comp); this.comp.connect(ctx.destination);
    this.bus = {};
    for (const k of ['music', 'ambience', 'sfx', 'ui']) { this.bus[k] = ctx.createGain(); this.bus[k].connect(this.master); }

    // reverb
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this._impulse(3.2, 2.6);
    this.reverbWet = ctx.createGain(); this.reverbWet.gain.value = 0.05;
    this.reverb.connect(this.reverbWet); this.reverbWet.connect(this.master);
    this.reverbSend = ctx.createGain(); this.reverbSend.gain.value = 1; this.reverbSend.connect(this.reverb);

    // outdoor ambience goes through a filter that closes when indoors
    this.ambFilter = ctx.createBiquadFilter(); this.ambFilter.type = 'lowpass'; this.ambFilter.frequency.value = 16000;
    this.ambFilter.connect(this.bus.ambience);

    this.noise = this._noiseBuffer(4, 'white');
    this.pink = this._noiseBuffer(6, 'pink');
    this._buildAmbience();
    this.music = new MusicGenerator(ctx, this.bus.music, this.reverbSend);
    this.applyVolumes(this.game.settings.values);
    this.ready = true;
  }

  applyVolumes(v) {
    Object.assign(this.volumes, { master: v.master, music: v.music, ambience: v.ambience, sfx: v.sfx, ui: v.ui });
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.volumes.master, t, 0.1);
    for (const k of ['music', 'ambience', 'sfx', 'ui']) this.bus[k].gain.setTargetAtTime(this.volumes[k], t, 0.1);
  }

  _impulse(seconds, decay) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * seconds);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        // early reflections off stone + a long diffuse tail
        const early = i < ctx.sampleRate * 0.08 && Math.random() < 0.004 ? 0.8 : 0;
        d[i] = ((Math.random() * 2 - 1) * Math.pow(1 - t, decay) + early) * (c ? 0.95 : 1);
      }
    }
    return b;
  }

  _noiseBuffer(seconds, type) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * seconds);
    const b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (type === 'pink') {
        b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913;
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
      } else d[i] = w;
    }
    return b;
  }

  _loop(buffer) {
    const s = this.ctx.createBufferSource(); s.buffer = buffer; s.loop = true;
    s.loopStart = 0; s.start(0, Math.random() * buffer.duration);
    return s;
  }

  _buildAmbience() {
    const ctx = this.ctx;
    // wind: band-passed noise with slow gusts
    const wind = this._loop(this.pink);
    const wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 500; wf.Q.value = 0.6;
    this.windGain = ctx.createGain(); this.windGain.gain.value = 0.12;
    wind.connect(wf); wf.connect(this.windGain); this.windGain.connect(this.ambFilter);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain(); lfoG.gain.value = 260; lfo.connect(lfoG); lfoG.connect(wf.frequency); lfo.start();
    this.windFilter = wf;

    // leaves / forest bed
    const bed = this._loop(this.pink);
    const bf = ctx.createBiquadFilter(); bf.type = 'highpass'; bf.frequency.value = 2500;
    this.leafGain = ctx.createGain(); this.leafGain.gain.value = 0.02;
    bed.connect(bf); bf.connect(this.leafGain); this.leafGain.connect(this.ambFilter);

    // cicadas / insects (daytime): narrow band noise with fast amplitude pulsing
    const ins = this._loop(this.noise);
    const inf = ctx.createBiquadFilter(); inf.type = 'bandpass'; inf.frequency.value = 5200; inf.Q.value = 9;
    const am = ctx.createGain(); am.gain.value = 0;
    const amOsc = ctx.createOscillator(); amOsc.frequency.value = 38; const amDepth = ctx.createGain(); amDepth.gain.value = 0.5;
    amOsc.connect(amDepth); amDepth.connect(am.gain); amOsc.start();
    this.insectGain = ctx.createGain(); this.insectGain.gain.value = 0.0;
    ins.connect(inf); inf.connect(am); am.connect(this.insectGain); this.insectGain.connect(this.ambFilter);

    // water lapping, positioned at the nearest water edge
    const wat = this._loop(this.pink);
    const wlp = ctx.createBiquadFilter(); wlp.type = 'lowpass'; wlp.frequency.value = 700;
    this.waterMod = ctx.createGain(); this.waterMod.gain.value = 0.5;
    const wlfo = ctx.createOscillator(); wlfo.frequency.value = 0.4; const wlg = ctx.createGain(); wlg.gain.value = 0.35;
    wlfo.connect(wlg); wlg.connect(this.waterMod.gain); wlfo.start();
    this.waterPanner = this._panner(12);
    this.waterGain = ctx.createGain(); this.waterGain.gain.value = 0.5;
    wat.connect(wlp); wlp.connect(this.waterMod); this.waterMod.connect(this.waterGain); this.waterGain.connect(this.waterPanner); this.waterPanner.connect(this.ambFilter);
  }

  _panner(ref = 6) {
    const p = this.ctx.createPanner();
    p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = ref; p.maxDistance = 400; p.rolloffFactor = 1.2;
    return p;
  }

  _setPos(p, v) {
    const t = this.ctx.currentTime;
    if (p.positionX) { p.positionX.setTargetAtTime(v.x, t, 0.05); p.positionY.setTargetAtTime(v.y, t, 0.05); p.positionZ.setTargetAtTime(v.z, t, 0.05); }
    else p.setPosition(v.x, v.y, v.z);
  }

  // ------------------------------------------------------------------------------------------ SFX
  _env(gainNode, t, a, peak, d) {
    gainNode.gain.setValueAtTime(0.0001, t);
    gainNode.gain.exponentialRampToValueAtTime(peak, t + a);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  footstep(surface, intensity = 1) {
    if (!this.ready) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    const f = ctx.createBiquadFilter(), g = ctx.createGain();
    if (surface === 'stone') { f.type = 'bandpass'; f.frequency.value = 1800 + Math.random() * 900; f.Q.value = 1.2; this._env(g, t, 0.003, 0.22 * intensity, 0.07); }
    else if (surface === 'water') { f.type = 'lowpass'; f.frequency.value = 1400; this._env(g, t, 0.02, 0.3 * intensity, 0.25); }
    else { f.type = 'lowpass'; f.frequency.value = 2600 + Math.random() * 1200; this._env(g, t, 0.012, 0.16 * intensity, 0.12); }
    src.connect(f); f.connect(g); g.connect(this.bus.sfx); g.connect(this.reverbSend);
    src.start(t, Math.random() * 3, 0.4);
    if (surface === 'stone') {  // a soft low thump for weight
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.06);
      this._env(og, t, 0.002, 0.12 * intensity, 0.06);
      o.connect(og); og.connect(this.bus.sfx); o.start(t); o.stop(t + 0.1);
    }
  }

  playJump() { this.footstep(this.game.player.surface(), 0.7); }
  playSplash(big) { if (big) this.footstep('water', 2.2); }

  _tone(freq, t, dur, { type = 'sine', gain = 0.2, bus = 'ui', partials = null, rev = 0.3 } = {}) {
    const ctx = this.ctx;
    const g = ctx.createGain(); this._env(g, t, 0.005, gain, dur);
    g.connect(this.bus[bus]);
    if (rev) { const s = ctx.createGain(); s.gain.value = rev; g.connect(s); s.connect(this.reverbSend); }
    for (const [mul, amp] of partials ?? [[1, 1]]) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq * mul;
      const pg = ctx.createGain(); pg.gain.value = amp;
      o.connect(pg); pg.connect(g); o.start(t); o.stop(t + dur + 0.05);
    }
  }

  ui(kind) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const mallet = [[1, 1], [3.93, 0.25], [9.2, 0.08]];
    switch (kind) {
      case 'hover': this._tone(1320, t, 0.06, { gain: 0.04, rev: 0 }); break;
      case 'click': this._tone(880, t, 0.09, { gain: 0.08, partials: mallet, rev: 0.1 }); break;
      case 'open': this._tone(587, t, 0.25, { gain: 0.08, partials: mallet }); this._tone(880, t + 0.07, 0.3, { gain: 0.06, partials: mallet }); break;
      case 'close': this._tone(784, t, 0.2, { gain: 0.06, partials: mallet }); this._tone(523, t + 0.06, 0.25, { gain: 0.05, partials: mallet }); break;
      case 'discover': [523.25, 587.33, 659.25, 783.99, 880].forEach((f, i) => this._tone(f, t + i * 0.09, 0.9, { gain: 0.07, partials: mallet, rev: 0.6 })); break;
      case 'objective': [392, 523.25, 659.25].forEach((f) => this._tone(f, t, 1.6, { gain: 0.06, partials: mallet, rev: 0.7 })); break;
      case 'artifact':
        this._tone(196, t, 3.5, { gain: 0.12, partials: [[1, 1], [2.76, 0.4], [5.4, 0.2], [8.9, 0.08]], rev: 0.8, bus: 'sfx' });
        [659.25, 783.99, 880, 1046.5].forEach((f, i) => this._tone(f, t + 0.3 + i * 0.12, 1.2, { gain: 0.06, partials: mallet, rev: 0.6 }));
        break;
      case 'puzzle': [440, 554.37, 659.25, 880].forEach((f, i) => this._tone(f, t + i * 0.14, 1.6, { gain: 0.07, partials: mallet, rev: 0.7 })); break;
      case 'stone': this.footstep('stone', 2.5); this._tone(98, t, 0.6, { gain: 0.1, type: 'triangle', bus: 'sfx', rev: 0.5 }); break;
      case 'wrong': this._tone(220, t, 0.35, { gain: 0.07, type: 'triangle', rev: 0.3 }); this._tone(207.65, t + 0.1, 0.4, { gain: 0.06, type: 'triangle', rev: 0.3 }); break;
      case 'save': this._tone(659.25, t, 0.3, { gain: 0.05, partials: mallet }); break;
      default: break;
    }
  }

  /** Short procedural bird call at a world position. Several call shapes stand in for different species. */
  _bird(pos) {
    const ctx = this.ctx, t = ctx.currentTime;
    const p = this._panner(8); this._setPos(p, pos);
    const g = ctx.createGain(); g.gain.value = 0; g.connect(p); p.connect(this.ambFilter);
    const kind = Math.floor(Math.random() * 4);
    const o = ctx.createOscillator(); o.type = 'sine'; o.connect(g);
    let end = t;
    const note = (st, dur, f0, f1, amp) => {
      o.frequency.setValueAtTime(f0, st); o.frequency.exponentialRampToValueAtTime(f1, st + dur);
      g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(amp, st + dur * 0.2); g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
      end = Math.max(end, st + dur);
    };
    const base = 1800 + Math.random() * 2200;
    if (kind === 0) for (let i = 0; i < 3 + Math.random() * 4; i++) note(t + i * 0.13, 0.09, base, base * 1.4, 0.18);          // trill
    else if (kind === 1) { note(t, 0.35, base * 0.7, base * 1.1, 0.2); note(t + 0.45, 0.4, base * 1.1, base * 0.6, 0.18); }  // two-note whistle
    else if (kind === 2) for (let i = 0; i < 5; i++) note(t + i * 0.07, 0.05, base * 1.5, base * 0.9, 0.12);                  // chatter
    else { note(t, 0.6, 700, 520, 0.22); note(t + 0.8, 0.6, 700, 520, 0.2); }                                               // dove-like coo
    o.start(t); o.stop(end + 0.1);
  }

  _cricket(pos) {
    const ctx = this.ctx, t = ctx.currentTime;
    const p = this._panner(4); this._setPos(p, pos);
    const g = ctx.createGain(); g.gain.value = 0; g.connect(p); p.connect(this.ambFilter);
    const o = ctx.createOscillator(); o.frequency.value = 4200 + Math.random() * 600; o.connect(g);
    for (let i = 0; i < 6; i++) { const s = t + i * 0.06; g.gain.setValueAtTime(0.0001, s); g.gain.linearRampToValueAtTime(0.06, s + 0.01); g.gain.linearRampToValueAtTime(0.0001, s + 0.04); }
    o.start(t); o.stop(t + 0.5);
  }

  // ---------------------------------------------------------------------------------------- update
  update(dt, camera) {
    if (!this.ready) return;
    const ctx = this.ctx, t = ctx.currentTime, L = ctx.listener;
    const g = this.game;
    const cp = camera.position;
    const fwd = this._v.set(0, 0, -1).applyQuaternion(camera.quaternion);
    if (L.positionX) {
      L.positionX.setTargetAtTime(cp.x, t, 0.03); L.positionY.setTargetAtTime(cp.y, t, 0.03); L.positionZ.setTargetAtTime(cp.z, t, 0.03);
      L.forwardX.setTargetAtTime(fwd.x, t, 0.03); L.forwardY.setTargetAtTime(fwd.y, t, 0.03); L.forwardZ.setTargetAtTime(fwd.z, t, 0.03);
      L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
    } else { L.setPosition(cp.x, cp.y, cp.z); L.setOrientation(fwd.x, fwd.y, fwd.z, 0, 1, 0); }

    // indoor detection: roof overhead within 9 m of the player's head
    const player = g.player;
    const head = player.headPosition.clone();
    const roof = g.collision.raycast(head, new THREE.Vector3(0, 1, 0), 9);
    const target = roof ? 1 : 0;
    this.indoor += (target - this.indoor) * Math.min(1, dt * 2.5);
    const tod = g.timeOfDay.current;
    const night = tod.night;
    this.ambFilter.frequency.setTargetAtTime(16000 - this.indoor * 14800, t, 0.2);
    this.reverbWet.gain.setTargetAtTime(0.04 + this.indoor * 0.5, t, 0.2);
    this.windGain.gain.setTargetAtTime((0.05 + 0.1 * tod.wind) * (1 + Math.max(0, player.position.y - 8) * 0.03), t, 0.5);
    this.leafGain.gain.setTargetAtTime(0.012 + 0.025 * tod.wind, t, 0.5);
    const day = 1 - night;
    const heat = day * THREE.MathUtils.smoothstep(tod.el, 15, 50);
    this.insectGain.gain.setTargetAtTime(0.012 + heat * 0.03, t, 1.0);

    // nearest water point for the lapping source
    const wp = this._nearestWater(player.position);
    if (wp) { this._setPos(this.waterPanner, wp); this.waterGain.gain.setTargetAtTime(0.6, t, 0.5); }
    else this.waterGain.gain.setTargetAtTime(0, t, 0.5);

    // birds by day, crickets at night, fewer indoors
    this.birdTimer -= dt;
    if (this.birdTimer <= 0) {
      this.birdTimer = (night > 0.5 ? 12 : 1.2) + Math.random() * (night > 0.5 ? 20 : 4);
      if (day > 0.3) {
        const a = Math.random() * Math.PI * 2, r = 15 + Math.random() * 60;
        this._bird(new THREE.Vector3(cp.x + Math.cos(a) * r, cp.y + 6 + Math.random() * 12, cp.z + Math.sin(a) * r));
      }
    }
    if (night > 0.4) {
      this.cricketTimer -= dt;
      if (this.cricketTimer <= 0) {
        this.cricketTimer = 0.15 + Math.random() * 0.6;
        const a = Math.random() * Math.PI * 2, r = 5 + Math.random() * 30;
        this._cricket(new THREE.Vector3(cp.x + Math.cos(a) * r, player.position.y, cp.z + Math.sin(a) * r));
      }
    }

    // footsteps from distance travelled
    if ((player.grounded || player.onStairs) && player.moveSpeed > 0.4) {
      this.stepTimer -= player.moveSpeed * dt;
      const stride = player.moveSpeed > 5 ? 1.25 : player.moveSpeed > 2.5 ? 1.0 : 0.7;
      if (this.stepTimer <= 0) { this.stepTimer = stride; this.footstep(player.surface(), player.crouching ? 0.5 : Math.min(1.2, 0.6 + player.moveSpeed * 0.1)); }
    }
    this.music?.update(dt, g);
  }

  _nearestWater(p) {
    let best = null, bd = 60;
    for (const w of this.game.levelData?.water ?? []) {
      const x = THREE.MathUtils.clamp(p.x, w.x0, w.x1), z = THREE.MathUtils.clamp(p.z, w.z0, w.z1);
      // the moat is a rectangle under the island; use its ring edge instead of its interior
      let px = x, pz = z;
      if (w.name === 'Water_Moat') {
        const ix0 = -400, ix1 = 400, iz0 = -290, iz1 = 460;
        if (p.x > ix0 && p.x < ix1 && p.z > iz0 && p.z < iz1) {
          const d = [p.x - ix0, ix1 - p.x, p.z - iz0, iz1 - p.z];
          const m = Math.min(...d), k = d.indexOf(m);
          px = k === 0 ? ix0 - 3 : k === 1 ? ix1 + 3 : p.x; pz = k === 2 ? iz0 - 3 : k === 3 ? iz1 + 3 : p.z;
        }
      }
      const d = Math.hypot(px - p.x, pz - p.z);
      if (d < bd) { bd = d; best = new THREE.Vector3(px, w.y + 0.2, pz); }
    }
    return best;
  }

  duck(on) { this.music?.duck(on); }
}
