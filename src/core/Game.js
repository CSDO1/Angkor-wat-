import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FXAAPass } from 'three/addons/postprocessing/FXAAPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';

import { EventBus } from './EventBus.js';
import { Input } from './Input.js';
import { B } from './utils.js';
import { installAtmosphereChunks, AtmosphereUniforms } from '../materials/WorldShading.js';
import { TimeOfDay } from '../environment/TimeOfDay.js';
import { CollisionWorld } from '../systems/CollisionWorld.js';
import { PlayerController } from '../systems/PlayerController.js';
import { CameraController } from '../systems/CameraController.js';
import { InteractionSystem } from '../systems/InteractionSystem.js';
import { DiscoverySystem } from '../systems/DiscoverySystem.js';
import { ArtifactManager } from '../systems/ArtifactManager.js';
import { PuzzleManager } from '../systems/PuzzleManager.js';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { ObjectiveManager } from '../systems/ObjectiveManager.js';
import { QuestManager } from '../systems/QuestManager.js';
import { JournalSystem } from '../systems/JournalSystem.js';
import { LocalizationManager } from '../systems/LocalizationManager.js';
import { AudioManager } from '../systems/AudioManager.js';
import { SaveManager } from '../systems/SaveManager.js';
import { SettingsManager } from '../systems/SettingsManager.js';
import { CinematicDirector } from '../systems/CinematicDirector.js';
import { OcclusionCuller, OcclusionPass, FrameClock, OCCLUDED_LAYER } from '../systems/PerformanceManager.js';
import { SceneManager } from '../levels/SceneManager.js';
import { UIManager } from '../ui/UIManager.js';
import { platform } from './platform.js';

const START = { pos: [0, -607, 0.3], yaw: Math.PI };  // western landing, facing east (-z)

/**
 * Game orchestrator: owns the renderer, the scene, the main loop, the high-level mode
 * (title / cinematic / play / panel / dialogue / inspect / menu) and wires the modular systems.
 */
export class Game {
  constructor(canvas) {
    installAtmosphereChunks();
    this.canvas = canvas;
    this.events = new EventBus();
    this.mode = 'loading';
    this.playTime = 0;
    this.ended = false;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 3000);
    this.camera.layers.enable(1);
    this.scene.add(this.camera);

    this.settings = new SettingsManager(this.events);
    this.i18n = new LocalizationManager(this.events);
    this.input = new Input(canvas);
    this.collision = new CollisionWorld();
    this.timeOfDay = new TimeOfDay(this.scene, this.renderer);
    this.timeOfDay.sunLight.shadow.camera.layers.enable(OCCLUDED_LAYER);
    this.player = new PlayerController(this);
    this.cameraController = new CameraController(this.camera, this);
    this.interaction = new InteractionSystem(this);
    this.journal = new JournalSystem(this);
    this.objectives = new ObjectiveManager(this);
    this.quests = new QuestManager(this);
    this.artifacts = new ArtifactManager(this);
    this.puzzles = new PuzzleManager(this);
    this.dialogue = new DialogueSystem(this);
    this.discoverySystem = new DiscoverySystem(this);
    this.audio = new AudioManager(this);
    this.save = new SaveManager(this);
    this.cinematics = new CinematicDirector(this);
    this.sceneManager = new SceneManager(this);
    this.clock = new FrameClock();
    this.i18n.setLanguage(this.settings.values.language);   // before the UI, so the loading screen is localised
    this.ui = new UIManager(this);

    this.discoveries = new Set();
    this.reliefsFound = new Set();
    this.flags = new Set();

    this._buildComposer();
    addEventListener('resize', () => this.resize());
    canvas.addEventListener('click', () => { this.audio.start(); if (this.mode === 'play') this.input.requestLock(); });
    this._wireEvents();
    this.resize();
  }

  // ------------------------------------------------------------------------------ rendering
  _buildComposer() {
    const r = this.renderer;
    const rt = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(r, rt);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    this.culler = new OcclusionCuller(r, this.camera);
    this.occlusionPass = new OcclusionPass(this.culler);
    this.composer.addPass(this.occlusionPass);
    this.gtao = new GTAOPass(this.scene, this.camera, innerWidth, innerHeight);
    this.gtao.enabled = false;
    this.gtao.blendIntensity = 0.7;
    this.composer.addPass(this.gtao);
    this.composer.addPass(new OutputPass());
    this.fxaa = new FXAAPass();
    this.composer.addPass(this.fxaa);
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    const pr = Math.min(devicePixelRatio, 2) * (this.settings.values.resolution ?? 1);
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(pr);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.water?.resize(w * pr, h * pr);
  }

  /** Apply all settings live (no reloads). */
  applySettings() {
    const v = this.settings.values;
    this.resize();
    this.timeOfDay.setShadowQuality(v.shadows);
    this.renderer.shadowMap.enabled = v.shadows > 0;
    const rt = this.composer.renderTarget1;
    const samples = v.aa === 'msaa' ? 4 : 0;
    if (rt.samples !== samples) { this.composer.renderTarget1.samples = samples; this.composer.renderTarget2.samples = samples; this.composer.renderTarget1.dispose(); this.composer.renderTarget2.dispose(); }
    this.fxaa.enabled = v.aa === 'fxaa';
    this.gtao.enabled = v.ao === 'ssao';
    AtmosphereUniforms.uAOStrength.value = v.ao === 'off' ? 0 : 1;
    AtmosphereUniforms.uDetail.value = v.texture === 0 ? 0.4 : 1;
    if (this.environment) {
      const aniso = [1, 4, this.renderer.capabilities.getMaxAnisotropy()][v.texture];
      this.environment.rosette.anisotropy = aniso; this.environment.rosette.needsUpdate = true;
      this.environment.setLodDistance(v.viewDistance / 2000);
    }
    this.water?.setQuality(v.reflections);
    if (this.vegetation) {
      this.vegetation.setDensity(v.vegetation);
      this.vegetation.grassDistance = 30 + 60 * v.vegetation;
      this.vegetation.viewDistance = v.viewDistance;
    }
    this.camera.far = Math.max(1500, v.viewDistance * 1.6);
    this.camera.updateProjectionMatrix();
    this.timeOfDay.mistScale = 1;
    this.culler.setEnabled(v.occlusion);
    this.clock.limit = v.vsync ? v.fpsLimit : (v.fpsLimit || 0);
    this.ui.hud.fps.classList.toggle('hidden', !v.showFps);
    this.cameraController.sensitivity = v.sensitivity;
    this.cameraController.reduceShake = v.reducedMotion;
    this.timeOfDay.brightness = v.brightness;
    if (this.timeOfDay.current) this.renderer.toneMappingExposure = this.timeOfDay.current.exposure * v.brightness;
    const root = document.documentElement;
    root.style.setProperty('--ui-scale', String(v.uiScale));
    document.body.classList.toggle('high-contrast', !!v.highContrast);
    document.body.classList.toggle('reduced-motion', !!v.reducedMotion);
    document.body.classList.toggle('no-objective', !v.showObjective);
    document.body.classList.toggle('free-mode', v.guidance === 'free');
    this.cameraController.invertY = v.invertY;
    this.audio.applyVolumes(v);
    if (this.mode !== 'loading' && v.timeMode !== 'story' && this.timeOfDay.name !== v.timeMode) this.timeOfDay.setPreset(v.timeMode, 8);
  }

  setFullscreen(on) {
    platform.setFullscreen(on);
    this.settings.set('fullscreen', on);
  }

  setLanguage(lang) {
    this.i18n.setLanguage(lang);
    this.settings.set('language', lang);
  }

  // ---------------------------------------------------------------------------------- state
  setMode(m) {
    this.mode = m;
    const playing = m === 'play';
    this.input.enabled = playing;
    if (!playing) this.input.releaseLock();
    this.ui.hud.setVisible(m === 'play' || m === 'panel' || m === 'dialogue');
    if (m === 'play' && !this.ui.letterboxEl.classList.contains('on')) this.ui.hud.setVisible(true);
  }

  snapToGround(p, up = 1.5, depth = 6) {
    const y = this.collision.groundBelow(p.x, p.y + up, p.z, up + depth);
    if (y !== null) p.y = y;
    return p;
  }

  /** Player-placed map waypoint ({x, z} in world metres) shown on the map and compass. */
  setWaypoint(w) {
    this.waypoint = w ? { x: w.x, z: w.z } : null;
    this.events.emit('waypoint', this.waypoint);
  }

  openInspector(a, onCollect) { this.ui.inspect.open(a, onCollect); }

  openMenu(tab = 'map') {
    if (this.mode !== 'play') return;
    this.setMode('menu');
    this.ui.menu.show(tab);
  }

  closeMenu() {
    this.ui.menu.hide();
    if (this.mode === 'title-settings') { this.mode = 'title'; this.ui.titleEl.classList.add('show'); this.ui.titleEl.querySelector('.buttons .btn')?.focus(); return; }
    this.setMode('play');
    this.input.requestLock();
  }

  _wireEvents() {
    const e = this.events;
    e.on('settings', ({ key }) => {
      if (key === 'language') return;
      this.applySettings();
    });
    e.on('chapter', ({ chapter, silent }) => {
      if (this.settings.values.timeMode === 'story') this.timeOfDay.setPreset(chapter.time, 120);
      if (!silent) this.audio.music?.sting('chapter');
    });
    e.on('artifact-collected', () => this.ui.hud.renderArtifacts());
    e.on('story-complete', () => {
      this.ended = true;
      this.cinematics.finale(() => this.save.autosave('ending'));
    });
    e.on('language', () => this.ui.hud.renderArtifacts());
  }

  // ---------------------------------------------------------------------------------- boot
  async boot() {
    this.ui.setLoading(0.02, 'loading.env');
    await this.sceneManager.load((p, key) => this.ui.setLoading(p, key));
    // world content
    this.discoverySystem.build();
    this.artifacts.build();
    this.puzzles.build();
    this.dialogue.build();
    this.quests.build();
    for (const lod of this.environment.lods) if (!lod.userData.isGround) this.culler.add(lod);
    this.applySettings();
    this.player.teleport(this.snapToGround(B(...START.pos), 2), START.yaw);
    this.cameraController.setYawBehind(START.yaw);
    this.ui.setLoading(1, 'loading.world');
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
    this.ui.hideLoading();
    this.showTitle();
    const s = this.environment.stats();
    console.info(`[Angkor] ${s.chunks} chunks, ${Math.round(s.tris / 1000)}k tris (LOD0), collision ${this.levelData.stats.collision_tris} tris`);
  }

  showTitle() {
    this.mode = 'title';
    this.input.enabled = false;
    this.ui.hud.setVisible(false);
    this.timeOfDay.setPreset('sunrise', 0.01);
    this.cinematics.titleOrbit();
    const reveal = () => this.ui.showTitle({
      canContinue: () => !!this.save.latest(),
      onNew: () => this.ui.chooseMode((mode) => { this.settings.set('guidance', mode); this.newGame(); }),
      onContinue: () => this.loadGame(),
      onSettings: () => { this.mode = 'title-settings'; this.ui.titleEl.classList.remove('show'); this.ui.menu.show('settings', true); },
    });
    if (this.settings.values.languageChosen) reveal();
    else this.ui.chooseLanguage(reveal);   // first launch
  }

  resetState() {
    this.discoveries.clear(); this.reliefsFound.clear(); this.flags.clear();
    this.objectives.restore({ chapter: 0, obj: 0, completed: [], finished: false });
    this.artifacts.restore([]);
    this.puzzles.restore({ state: { symbols: { solved: false, seq: [] }, light: { solved: false, k: 0 }, reliefs: { solved: false, seq: [] }, door: { solved: false, placed: 0 } }, keys: [], taken: [] });
    this.quests.restore({});
    this.journal.restore([]);
    this.discoverySystem.syncUnlocks(true);
    this.waypoint = null;
    this.playTime = 0; this.ended = false;
  }

  newGame() {
    this.resetState();
    this.ui.hideTitle();
    this.player.teleport(this.snapToGround(B(...START.pos), 2), START.yaw);
    this.cameraController.setYawBehind(START.yaw);
    this.cameraController.stopShot();
    this.timeOfDay.setPreset('sunrise', 0.01);
    this.cinematics.intro(() => {
      this.ui.letterbox(false);
      this.setMode('play');
      this.objectives.start();
      this.ui.hud.renderArtifacts();
      this.input.requestLock();
      this._tutorial();
      this.save.autosave('start');
    });
  }

  _tutorial() {
    const hint = (k, t) => setTimeout(() => this.mode === 'play' && this.settings.values.hints && this.events.emit('hint', { key: k, time: 7 }), t);
    hint('hint.move', 600); hint('hint.interact', 9000); hint('hint.jump', 20000); hint('hint.menu', 32000);
  }

  loadGame(slot) {
    const d = slot ? this.save.read(slot) : this.save.latest();
    if (!d) return;
    this.resetState();
    this.ui.menu.open && this.ui.menu.hide();
    this.ui.hideTitle();
    this.cameraController.stopShot();
    d.discoveries.forEach((x) => this.discoveries.add(x));
    d.reliefs.forEach((x) => this.reliefsFound.add(x));
    d.flags.forEach((x) => this.flags.add(x));
    this.objectives.restore(d.objectives);
    this.artifacts.restore(d.artifacts);
    this.puzzles.restore(d.puzzles);
    this.quests.restore(d.quests);
    this.journal.restore(d.journal);
    this.discoverySystem.syncUnlocks(true);
    this.waypoint = d.waypoint ?? null;
    this.playTime = d.playTime ?? 0;
    this.ended = !!d.ended;
    this.player.teleport(new THREE.Vector3(d.player.x, d.player.y + 0.05, d.player.z), d.player.yaw);
    this.cameraController.yaw = d.player.camYaw; this.cameraController.pitch = d.player.camPitch;
    this.cameraController.pivot.copy(this.player.position).setY(this.player.position.y + 1.55);
    const tm = this.settings.values.timeMode;
    this.timeOfDay.setPreset(tm === 'story' ? (d.time || this.objectives.chapter.time) : tm, 0.01);
    this.ui.fade(true, 0.01);
    this.ui.letterbox(false);
    this.setMode('play');
    this.objectives.start();
    this.ui.hud.renderArtifacts();
    this.ui.fade(false, 1.5);
    this.input.requestLock();
  }

  exitToTitle() {
    this.save.autosave('exit');
    this.ui.menu.hide();
    this.ui.letterbox(false);
    this.showTitle();
  }

  // ---------------------------------------------------------------------------------- loop
  _loop(now) {
    requestAnimationFrame(this._loop);
    const dt = this.clock.tick(now);
    if (dt === 0) return;
    this.update(dt);
    this.render();
  }

  update(dt) {
    const input = this.input;
    input.poll();
    const m = this.mode;
    const playing = m === 'play';
    if (playing) this.playTime += dt;

    if (playing) {
      if (input.pressed('menu')) this.openMenu('map');
      else if (input.pressed('map')) this.openMenu('map');
      else if (input.pressed('journal')) this.openMenu('journal');
      else if (input.pressed('objectives')) this.openMenu('objectives');
      if (input.pressed('inspect')) this.cameraController.toggleFirstPerson();
      if (input.pressed('time')) {
        if (this.ended || this.settings.values.timeMode !== 'story') {
          const order = ['sunrise', 'day', 'sunset', 'night'];
          this.timeOfDay.setPreset(order[(order.indexOf(this.timeOfDay.name) + 1) % 4], 20);
        }
      }
    } else if (m === 'menu' && input.uiPressed('menu')) this.closeMenu();
    else if (m === 'title-settings' && input.uiPressed('menu')) this.closeMenu();
    else if (m === 'cinematic' && (input.uiPressed('menu') || input.uiPressed('confirm')) && this.cinematics.skipper) this.cinematics.skip();

    if (m !== 'menu' && m !== 'title-settings') {
      const simPlayer = playing || m === 'panel' || m === 'dialogue' || m === 'inspect' || m === 'cinematic';
      if (simPlayer) {
        if (!playing) { input.enabled = false; }
        this.player.enabled = playing;
        this.player.update(dt, input, this.cameraController.yaw);
        input.enabled = playing;
      }
      this.cameraController.update(dt, input, playing);
      this.interaction.update(input, playing);
      if (playing) this.objectives.update(dt);
      this.discoverySystem.update(dt, this.camera.position);
      this.artifacts.update(dt);
      this.puzzles.update(dt);
      this.dialogue.update(dt);
      this.quests.update(dt);
    }
    this.ui.inspect.update(dt, input);
    this.timeOfDay.update(dt, this.camera, this.player.position);
    this.vegetation?.update(this.camera);
    this.wildlife?.update(dt, this.camera);
    this.audio.update(dt, this.camera);
    this.ui.hud.update(dt, this.camera);
    if (this.settings.values.showFps) {
      const cs = this.culler.stats;
      this.ui.hud.fps.textContent = `${Math.round(this.clock.fps)} FPS · ${this.renderer.info.render.calls} draws · ${Math.round(this.renderer.info.render.triangles / 1000)}k tris · occl ${cs.hidden}/${cs.tested}`;
    }
    input.endFrame();
  }

  render() {
    this.culler.update();
    // the reflection pass reuses the sun's shadow map; wait until the main pass has created it
    const L = this.timeOfDay.sunLight;
    const shadowReady = !this.renderer.shadowMap.enabled || !L.castShadow || !!L.shadow.map;
    if (shadowReady) this.water?.update(this.renderer, this.scene, this.camera, this.timeOfDay.info);
    this.renderer.info.autoReset = false;
    this.renderer.info.reset();
    this.composer.render();
    this.ui.inspect.render(this.renderer);
  }
}
