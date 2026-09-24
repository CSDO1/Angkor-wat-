import * as THREE from 'three';
import { B } from '../core/utils.js';
import { symbolCanvas, illustrationCanvas } from '../ui/Illustrations.js';
import { makeArtifactModel, makeMarker, animateMarker, glowTexture } from '../artifacts/ArtifactModels.js';
import { worldMaterial } from '../materials/WorldShading.js';

/**
 * Environmental puzzles of Chapter 5. All four are FICTIONAL: in the story they are a visitor
 * programme built by the (fictional) conservation team. None depicts an authentic historical
 * mechanism or practice.
 *
 *  symbols – Stone Symbol Puzzle (Preah Poan): activate four symbol stones in the order of a clue.
 *  light   – Light Puzzle (2nd courtyard, south): turn a mirror to send a sunbeam onto a hidden symbol.
 *  reliefs – Bas-Relief Puzzle (2nd courtyard, north): activate story panels in narrative order.
 *  door    – Ancient Door Puzzle (west stairway of the Bakan): place the three stone keys.
 */
const stoneMat = () => worldMaterial(new THREE.MeshStandardMaterial({ color: 0x8c7b62, roughness: 0.9 }));

export class PuzzleManager {
  constructor(game) {
    this.game = game;
    this.state = {
      symbols: { solved: false, seq: [] },
      light: { solved: false, k: 0 },
      reliefs: { solved: false, seq: [] },
      door: { solved: false, placed: 0 },
    };
    this.keys = new Set();          // stone keys in the player's bag
    this.keysTaken = new Set();     // keys picked up at least once
    this.keyObjects = new Map();
    this.anim = [];
  }

  isSolved(id) { return this.state[id]?.solved; }
  serialize() { return { state: structuredClone(this.state), keys: [...this.keys], taken: [...this.keysTaken] }; }

  restore(d) {
    if (!d) return;
    Object.assign(this.state, structuredClone(d.state));
    this.keys = new Set(d.keys); this.keysTaken = new Set(d.taken);
    this.state.symbols.seq = []; this.state.reliefs.seq = [];
    this._refreshAll();
  }

  build() {
    this._buildSymbols();
    this._buildLight();
    this._buildReliefs();
    this._buildDoor();
    this._buildBarriers();
    this._refreshAll();
  }

  _i(id, o) { return this.game.interaction.register({ id, ...o }); }
  _t(obj) { return this.game.i18n.pick(obj); }
  _fiction() { return { en: 'Fictional puzzle — part of the story\'s visitor programme, not a historical mechanism.', km: 'ល្បែងផ្គុំប្រឌិត — ជាផ្នែកនៃកម្មវិធីភ្ញៀវក្នុងរឿង មិនមែនជាយន្តការប្រវត្តិសាស្ត្រទេ។' }; }

  // ------------------------------------------------------------------------------ symbol stones
  _buildSymbols() {
    const g = this.game;
    const defs = [
      { sym: 'lotus', p: [-20, -77.3, 3.5] }, { sym: 'naga', p: [20, -77.3, 3.5] },
      { sym: 'conch', p: [-20, -65.7, 3.5] }, { sym: 'chakra', p: [20, -65.7, 3.5] },
    ];
    this.symbolOrder = ['naga', 'lotus', 'conch', 'chakra'];
    this.symbolStones = defs.map((d) => {
      const pos = g.snapToGround(B(...d.p), 1.5);
      const grp = new THREE.Group(); grp.position.copy(pos);
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.9), stoneMat()); block.position.y = 0.5; block.castShadow = true; block.receiveShadow = true;
      const tex = new THREE.CanvasTexture(symbolCanvas(d.sym, 256, '#e8c37a', '#2a241c')); tex.colorSpace = THREE.SRGBColorSpace;
      const faceMat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffc070, emissiveIntensity: 0.05, roughness: 0.8 });
      const top = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8).rotateX(-Math.PI / 2), faceMat); top.position.y = 1.001;
      grp.add(block, top);
      g.scene.add(grp);
      const stone = { ...d, grp, faceMat, lit: 0 };
      this._i('sym_' + d.sym, {
        position: pos.clone().setY(pos.y + 1), radius: 2.2, verb: 'hud.activate',
        label: () => this._t({ en: 'Symbol stone', km: 'ថ្មនិមិត្តសញ្ញា' }),
        enabled: () => !this.state.symbols.solved && g.objectives.atLeast('five_towers'),
        onInteract: () => this._pressSymbol(stone),
      });
      return stone;
    });
    // clue stela
    const cp = g.snapToGround(B(-6, -77.6, 3.5), 1.5);
    const stela = new THREE.Group(); stela.position.copy(cp);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.4, 0.2), stoneMat()); slab.position.y = 0.7; slab.castShadow = true;
    stela.add(slab); stela.rotation.y = Math.PI; g.scene.add(stela);
    this._i('sym_clue', {
      position: cp.clone().setY(cp.y + 1), radius: 2.2, verb: 'hud.read',
      label: () => this._t({ en: 'Clue stela', km: 'ស្តម្ភតម្រុយ' }),
      enabled: () => g.objectives.atLeast('five_towers'),
      onInteract: () => g.ui.discovery.show({
        title: this._t({ en: 'Clue stela (fictional)', km: 'ស្តម្ភតម្រុយ (ប្រឌិត)' }),
        khmer: '', period: this._t(this._fiction()),
        history: this._t({
          en: '"First the serpent coils around the mountain. From the water the lotus rises. Then the conch calls, and last of all the wheel turns."',
          km: '«ដំបូង នាគរុំជុំវិញភ្នំ។ ពីទឹក ផ្កាឈូកងើបឡើង។ បន្ទាប់មក ស័ង្ខបន្លឺ ហើយចុងក្រោយ កង់វិល។»',
        }),
        architecture: this._t({ en: 'The four stones stand in the courtyards of the Preah Poan. Touch them in the order of the verse.', km: 'ថ្មទាំងបួនឈរនៅក្នុងទីធ្លានៃព្រះពាន់។ សូមប៉ះវាតាមលំដាប់នៃកំណាព្យ។' }),
        illus: 'buddha', isNew: false,
      }),
    });
    this.symbolKeyPos = cp.clone().add(new THREE.Vector3(1.2, 0, 0));
  }

  _pressSymbol(stone) {
    const g = this.game, s = this.state.symbols;
    s.seq.push(stone.sym);
    stone.lit = 1;
    g.audio.ui('stone');
    const n = s.seq.length;
    if (s.seq[n - 1] !== this.symbolOrder[n - 1]) {
      s.seq = [];
      g.audio.ui('wrong');
      g.events.emit('hint', { key: 'hint.sequenceReset' });
      setTimeout(() => this.symbolStones.forEach((x) => { x.lit = 0; }), 500);
      return;
    }
    if (n === this.symbolOrder.length) this._solve('symbols', 'key_symbols', this.symbolKeyPos);
  }

  // -------------------------------------------------------------------------------------- light
  _buildLight() {
    const g = this.game;
    this.lightSrc = B(52.3, -8.5, 11.7);
    const mp = g.snapToGround(B(44, 0, 10), 1.5);
    this.mirrorPos = mp.clone().setY(mp.y + 1.2);
    this.lightTargets = [-10.5, -3.5, 3.5, 10.5].map((y) => B(37.05, y, 11.2));
    this.lightCorrect = 2;

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.8, 12), stoneMat());
    base.position.copy(mp).setY(mp.y + 0.4); base.castShadow = true;
    this.mirror = new THREE.Group(); this.mirror.position.copy(this.mirrorPos);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 32).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xc9a060, metalness: 1, roughness: 0.15, emissive: 0x3a2a10 }));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.03, 8, 32), new THREE.MeshStandardMaterial({ color: 0x6b4a22, metalness: 0.8, roughness: 0.4 }));
    this.mirror.add(disc, rim);
    g.scene.add(base, this.mirror);

    const beamMat = () => new THREE.MeshBasicMaterial({ color: 0xffd79a, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    this.beamIn = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1, 10, 1, true), beamMat());
    this.beamOut = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1, 10, 1, true), beamMat());
    this.spot = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffe0a0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.spot.scale.setScalar(1.2);
    g.scene.add(this.beamIn, this.beamOut, this.spot);
    this._placeBeam(this.beamIn, this.lightSrc, this.mirrorPos);

    // the hidden carved sun symbol on the Bakan base, revealed when the beam reaches it
    const tex = new THREE.CanvasTexture(symbolCanvas('chakra', 256, '#ffe6a8')); tex.colorSpace = THREE.SRGBColorSpace;
    this.glyph = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.glyph.position.copy(this.lightTargets[this.lightCorrect]);
    this.glyph.rotation.y = Math.PI / 2; // faces +x (toward the courtyard)
    g.scene.add(this.glyph);

    this._i('mirror', {
      position: this.mirrorPos, radius: 2.4, verb: 'hud.rotate',
      label: () => this._t({ en: 'Bronze mirror (fictional)', km: 'កញ្ចក់សំរិទ្ធ (ប្រឌិត)' }),
      enabled: () => !this.state.light.solved && g.objectives.atLeast('five_towers'),
      onInteract: () => { this.state.light.k = (this.state.light.k + 1) % 4; g.audio.ui('click'); this._updateMirror(); },
    });
    this.lightKeyPos = mp.clone().add(B(-1.4, 0, 0));
    this._updateMirror();
  }

  _placeBeam(mesh, a, b) {
    const d = new THREE.Vector3().subVectors(b, a);
    mesh.position.copy(a).addScaledVector(d, 0.5);
    mesh.scale.set(1, d.length(), 1);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  }

  _updateMirror() {
    const k = this.state.light.solved ? this.lightCorrect : this.state.light.k;
    const target = this.lightTargets[k];
    const inDir = new THREE.Vector3().subVectors(this.mirrorPos, this.lightSrc).normalize();
    const outDir = new THREE.Vector3().subVectors(target, this.mirrorPos).normalize();
    const n = new THREE.Vector3().subVectors(outDir, inDir).normalize();
    this.mirror.lookAt(this.mirror.position.clone().add(n));
    this._placeBeam(this.beamOut, this.mirrorPos, target);
    this.spot.position.copy(target).add(new THREE.Vector3(0.05, 0, 0));
    if (k === this.lightCorrect && !this.state.light.solved) this._solve('light', 'key_light', this.lightKeyPos);
  }

  // ----------------------------------------------------------------------------- story panels
  _buildReliefs() {
    const g = this.game;
    const stages = [
      { id: 'stage_pull', name: { en: 'Gods and demons pull the serpent', km: 'ទេវតា និងអសុរទាញនាគ' } },
      { id: 'stage_amrita', name: { en: 'The elixir of immortality appears', km: 'ទឹកអម្រឹតលេចចេញ' } },
      { id: 'stage_turtle', name: { en: 'The mountain rests on the turtle', km: 'ភ្នំតាំងលើអណ្តើក' } },
      { id: 'stage_apsaras', name: { en: 'Apsaras rise from the foam', km: 'អប្សរាងើបចេញពីពពុះ' } },
    ];
    this.reliefOrder = ['stage_turtle', 'stage_pull', 'stage_apsaras', 'stage_amrita'];
    this.panels = stages.map((st, i) => {
      const pos = g.snapToGround(B(-46.5, [-10.5, -3.5, 3.5, 10.5][i], 10), 1.5);
      const grp = new THREE.Group(); grp.position.copy(pos);
      const tex = new THREE.CanvasTexture(illustrationCanvas(st.id, 512, 320)); tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffc070, emissiveIntensity: 0.08, roughness: 0.85 });
      const slab = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.3, 2.0), stoneMat()); slab.position.y = 1.15; slab.castShadow = true;
      const face = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.12), mat); face.position.set(0.101, 1.15, 0); face.rotation.y = Math.PI / 2;
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 2.2), stoneMat()); foot.position.y = 0.25;
      grp.add(slab, face, foot);
      g.scene.add(grp);
      const panel = { ...st, grp, mat, lit: 0 };
      this._i('panel_' + st.id, {
        position: pos.clone().add(new THREE.Vector3(0.8, 1.2, 0)), radius: 2.3, verb: 'hud.activate',
        label: () => this._t(st.name),
        enabled: () => !this.state.reliefs.solved && g.objectives.atLeast('five_towers'),
        onInteract: () => this._pressPanel(panel),
      });
      return panel;
    });
  }

  _pressPanel(panel) {
    const g = this.game, s = this.state.reliefs;
    s.seq.push(panel.id); panel.lit = 1; g.audio.ui('stone');
    const n = s.seq.length;
    if (s.seq[n - 1] !== this.reliefOrder[n - 1]) {
      s.seq = []; g.audio.ui('wrong'); g.events.emit('hint', { key: 'hint.reliefReset' });
      setTimeout(() => this.panels.forEach((p) => { p.lit = 0; }), 500);
      return;
    }
    if (n === this.reliefOrder.length) this._solve('reliefs', 'key_reliefs', this.panels[1].grp.position.clone().add(new THREE.Vector3(1.6, 0, 3.5)));
  }

  // ------------------------------------------------------------------------------------- door
  _buildDoor() {
    const g = this.game;
    const bottom = B(0, -39.35, 10);
    this.doorClosedY = bottom.y;
    this.door = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 0.6), worldMaterial(new THREE.MeshStandardMaterial({ color: 0x75664f, roughness: 0.95 })));
    this.door.position.copy(bottom).setY(bottom.y + 1.6);
    this.door.castShadow = true; this.door.receiveShadow = true;
    const tex = new THREE.CanvasTexture(symbolCanvas('lotus', 256, '#cfa860', '#5e5140')); tex.colorSpace = THREE.SRGBColorSpace;
    const emb = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
    emb.position.set(0, 0.2, 0.301); this.door.add(emb);
    g.scene.add(this.door);
    this.doorBlocker = { min: B(-2.3, -39.9, 10).setY(bottom.y), max: B(2.3, -38.9, 13).setY(bottom.y + 3.2) };
    // B() flips y->z, so fix min/max ordering
    const a = this.doorBlocker.min, b = this.doorBlocker.max;
    this.doorBlocker = { min: new THREE.Vector3(Math.min(a.x, b.x), a.y, Math.min(a.z, b.z)), max: new THREE.Vector3(Math.max(a.x, b.x), b.y, Math.max(a.z, b.z)) };

    const mp = g.snapToGround(B(3.4, -40.6, 10), 1.5);
    const mech = new THREE.Group(); mech.position.copy(mp);
    const ped = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.8), stoneMat()); ped.position.y = 0.55; ped.castShadow = true;
    mech.add(ped);
    this.slots = [];
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 8), new THREE.MeshStandardMaterial({ color: 0x2a241c }));
      s.position.set(-0.24 + i * 0.24, 1.105, 0); mech.add(s);
      const k = makeArtifactModel('key'); k.scale.setScalar(0.7); k.rotation.x = -Math.PI / 2; k.position.set(-0.24 + i * 0.24, 1.14, 0); k.visible = false;
      mech.add(k); this.slots.push(k);
    }
    g.scene.add(mech);
    this._i('door_mech', {
      position: mp.clone().setY(mp.y + 1), radius: 2.3, verb: 'hud.place',
      label: () => this._t({ en: 'Stone mechanism (fictional)', km: 'យន្តការថ្ម (ប្រឌិត)' }),
      enabled: () => !this.state.door.solved,
      onInteract: () => this._useDoor(),
    });
  }

  _useDoor() {
    const g = this.game, d = this.state.door;
    if (!g.objectives.atLeast('five_towers')) { g.events.emit('hint', { key: 'hint.barrier' }); return; }
    if (!this.keys.size) { g.audio.ui('wrong'); g.events.emit('hint', { key: d.placed ? 'hint.needPieces' : 'hint.doorLocked' }); return; }
    const k = [...this.keys][0];
    this.keys.delete(k); d.placed++;
    g.audio.ui('stone');
    this._refreshAll();
    if (d.placed >= 3) {
      d.solved = true;
      g.audio.ui('puzzle');
      g.cameraController.shake = 0.05;
      this.anim.push({ t: 0, dur: 3.5, fn: (k2) => { this.door.position.y = this.doorClosedY + 1.6 - 3.3 * k2; } });
      g.collision.setBlocker('bakan_door', null, null, false);
      g.events.emit('puzzle-solved', { id: 'door' });
      g.journal.log('puzzle', 'door');
      g.save.autosave('puzzle');
    }
  }

  // --------------------------------------------------------------------- conservation barriers
  _buildBarriers() {
    const g = this.game;
    const wood = worldMaterial(new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.85 }));
    const rope = worldMaterial(new THREE.MeshStandardMaterial({ color: 0xb09060, roughness: 0.9 }));
    const signTex = new THREE.CanvasTexture((() => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
      x.fillStyle = '#e8dcc0'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#5a2a1a'; x.font = 'bold 22px sans-serif'; x.textAlign = 'center';
      x.fillText('CONSERVATION', 128, 46); x.fillText('WORK', 128, 74); x.font = '18px sans-serif'; x.fillText('ការងារអភិរក្ស', 128, 104);
      return c;
    })());
    signTex.colorSpace = THREE.SRGBColorSpace;
    const signMat = worldMaterial(new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.8 }));
    let i = 0;
    for (const s of g.collision.stairs) {
      if (s.kind !== 'bakan') continue;
      const isWestMain = Math.abs(s.o.x) < 1 && s.o.z > 25;
      if (isWestMain) continue;
      const c = s.o.clone().addScaledVector(s.up, -s.run - 0.8);
      const grp = new THREE.Group(); grp.position.copy(c);
      grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), s.up);
      for (const x of [-s.W / 2 - 0.3, s.W / 2 + 0.3]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.1, 8), wood); post.position.set(x, 0.55, 0); grp.add(post);
      }
      for (const y of [0.55, 0.95]) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, s.W + 0.6, 6).rotateZ(Math.PI / 2), rope); bar.position.y = y; grp.add(bar);
      }
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), signMat); sign.position.set(0, 0.75, -0.05); sign.rotation.y = Math.PI; grp.add(sign);
      g.scene.add(grp);
      const half = new THREE.Vector3().addScaledVector(s.side, s.W / 2 + 0.5).add(new THREE.Vector3().addScaledVector(s.up, 0.35));
      const a = c.clone().sub(half), b = c.clone().add(half);
      g.collision.setBlocker('barrier_' + i++, new THREE.Vector3(Math.min(a.x, b.x), c.y - 0.5, Math.min(a.z, b.z)), new THREE.Vector3(Math.max(a.x, b.x), c.y + 3, Math.max(a.z, b.z)));
    }
  }

  // ------------------------------------------------------------------------------------ shared
  _solve(id, keyId, keyPos) {
    const g = this.game;
    this.state[id].solved = true;
    g.audio.ui('puzzle');
    g.ui.hud.banner(g.i18n.t('hud.puzzleSolved'), '', 'puzzle');
    g.events.emit('puzzle-solved', { id });
    g.journal.log('puzzle', id);
    this._spawnKey(keyId, keyPos);
    g.save.autosave('puzzle');
  }

  _spawnKey(keyId, pos) {
    const g = this.game;
    if (this.keysTaken.has(keyId) || this.keyObjects.has(keyId)) return;
    const p = g.snapToGround(pos.clone(), 1.5);
    const grp = new THREE.Group(); grp.position.copy(p);
    const k = makeArtifactModel('key'); k.position.y = 0.6; grp.add(k);
    const mk = makeMarker({ scale: 0.5 }); mk.position.y = 1.2; grp.add(mk);
    g.scene.add(grp);
    this.keyObjects.set(keyId, { grp, k, mk });
    this._i('key_' + keyId, {
      position: p.clone().setY(p.y + 0.6), radius: 2.0, verb: 'hud.pickup',
      label: () => this._t({ en: 'Stone key', km: 'កូនសោថ្ម' }),
      enabled: () => !this.keysTaken.has(keyId),
      onInteract: () => {
        this.keysTaken.add(keyId); this.keys.add(keyId);
        grp.visible = false; g.audio.ui('stone');
        g.ui.hud.toast(this._t({ en: 'Stone key collected', km: 'បានប្រមូលកូនសោថ្ម' }));
        g.save.autosave('key');
      },
    });
  }

  _refreshAll() {
    const g = this.game;
    // keys solved but not yet taken should exist in the world
    if (this.state.symbols.solved) this._spawnKey('key_symbols', this.symbolKeyPos);
    if (this.state.light.solved) this._spawnKey('key_light', this.lightKeyPos);
    if (this.state.reliefs.solved) this._spawnKey('key_reliefs', this.panels[1].grp.position.clone().add(new THREE.Vector3(1.6, 0, 3.5)));
    for (const [id, o] of this.keyObjects) o.grp.visible = !this.keysTaken.has(id);
    this.slots?.forEach((s, i) => { s.visible = i < this.state.door.placed; });
    if (this.state.door.solved) {
      this.door.position.y = this.doorClosedY - 1.7;
      g.collision.setBlocker('bakan_door', null, null, false);
    } else {
      this.door.position.y = this.doorClosedY + 1.6;
      g.collision.setBlocker('bakan_door', this.doorBlocker.min, this.doorBlocker.max);
    }
    this._updateMirror?.();
  }

  update(dt) {
    const t = performance.now() / 1000;
    for (const s of this.symbolStones ?? []) {
      const on = this.state.symbols.solved ? 1 : s.lit;
      s.faceMat.emissiveIntensity += ((on ? 1.2 : 0.05 + 0.03 * Math.sin(t * 2)) - s.faceMat.emissiveIntensity) * Math.min(1, dt * 5);
    }
    for (const p of this.panels ?? []) {
      const on = this.state.reliefs.solved ? 1 : p.lit;
      p.mat.emissiveIntensity += ((on ? 0.9 : 0.08) - p.mat.emissiveIntensity) * Math.min(1, dt * 5);
    }
    if (this.glyph) {
      const lit = (this.state.light.solved || this.state.light.k === this.lightCorrect) ? 1 : 0;
      this.glyph.material.opacity += (lit - this.glyph.material.opacity) * Math.min(1, dt * 2);
      const active = this.game.objectives.atLeast('five_towers');
      this.beamIn.visible = this.beamOut.visible = this.spot.visible = active;
      const flick = 0.3 + 0.05 * Math.sin(t * 7) + 0.03 * Math.sin(t * 13);
      this.beamIn.material.opacity = this.beamOut.material.opacity = flick;
    }
    for (const o of this.keyObjects.values()) { o.k.rotation.y += dt; animateMarker(o.mk, dt, o.grp.visible); }
    this.anim = this.anim.filter((a) => { a.t += dt; a.fn(Math.min(1, a.t / a.dur)); return a.t < a.dur; });
  }
}
