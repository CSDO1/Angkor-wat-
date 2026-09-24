import * as THREE from 'three';
import { B } from '../core/utils.js';

/**
 * Scripted camera sequences: the title-screen orbit, the opening establishing shot
 * (moat → causeway → entrance → towers → title), short viewpoint shots and the final sunrise.
 */
const K = (t, pos, look, fov = 50, ease) => ({ t, pos: B(...pos), look: B(...look), fov, ease });

export class CinematicDirector {
  constructor(game) {
    this.game = game;
    this.active = null;
  }

  titleOrbit() {
    const keys = [];
    for (let i = 0; i <= 16; i++) {
      const a = -Math.PI / 2 - 0.9 + (i / 16) * 1.8;
      keys.push({ t: i * 6, pos: B(Math.cos(a) * 330, Math.sin(a) * 330, 48 + Math.sin(i) * 6), look: B(0, -40, 26), fov: 42, ease: 'linear' });
    }
    // loop back smoothly
    for (let i = 15; i >= 0; i--) keys.push({ ...keys[i], t: keys[keys.length - 1].t + 6 });
    this.game.cameraController.playShot(keys, { loop: true });
  }

  intro(onDone) {
    const g = this.game;
    g.setMode('cinematic');
    const keys = [
      K(0, [-70, -565, 5], [0, -520, 2], 46),
      K(6, [-32, -548, 3.5], [0, -470, 4], 46),
      K(12, [0, -488, 5], [0, -444, 9], 50),
      K(18, [0, -436, 4.2], [0, -300, 6], 52),
      K(24, [-62, -262, 3.2], [0, 0, 28], 44),
      K(31, [-10, -175, 16], [0, 0, 38], 40),
      K(37, [0, -150, 28], [0, 0, 44], 38),
    ];
    g.cameraController.playShot(keys, {
      blendBack: 0.01,
      onDone: () => {
        clearTimeout(this.introTitle);
        g.ui.fade(true, 0.8).then(() => {
          g.cameraController.setYawBehind(Math.PI);  // player faces east (-z)
          g.cameraController.pitch = 0.12;
          g.ui.fade(false, 1.2);
          onDone?.();
        });
      },
    });
    g.ui.letterbox(true);
    clearTimeout(this.introTitle);
    this.introTitle = setTimeout(() => { if (this.game.mode === 'cinematic') g.ui.titleCard(g.i18n.t('game.title'), g.i18n.t('game.subtitle'), 6); }, 30500);
    this.skipper = () => { clearTimeout(this.introTitle); g.cameraController.stopShot(); };
  }

  skip() { this.skipper?.(); this.skipper = null; }

  /** Short look from a viewpoint (quests). */
  viewShot(from, lookAt, onDone) {
    const g = this.game;
    g.setMode('cinematic');
    g.ui.letterbox(true);
    const side = new THREE.Vector3().subVectors(lookAt, from).cross(new THREE.Vector3(0, 1, 0)).normalize();
    const keys = [
      { t: 0, pos: g.camera.position.clone(), look: from.clone().lerp(lookAt, 0.05), fov: 55 },
      { t: 2.2, pos: from.clone(), look: lookAt.clone(), fov: 40 },
      { t: 6.5, pos: from.clone().addScaledVector(side, 1.5).add(new THREE.Vector3(0, 0.4, 0)), look: lookAt.clone(), fov: 36 },
    ];
    g.cameraController.playShot(keys, {
      blendBack: 1.5,
      onDone: () => { g.ui.letterbox(false); g.setMode('play'); onDone?.(); },
    });
    this.skipper = () => g.cameraController.stopShot();
  }

  /** Final chapter: sunrise over Angkor from the Bakan. */
  finale(onDone) {
    const g = this.game;
    g.setMode('cinematic');
    g.ui.letterbox(true);
    g.audio.music?.sting('end');
    g.timeOfDay.setPreset('night', 5);
    setTimeout(() => g.timeOfDay.setPreset('sunrise', 14), 5200);
    const p = g.player.position;
    const keys = [
      { t: 0, pos: g.camera.position.clone(), look: p.clone().setY(p.y + 1.6), fov: 55 },
      { t: 5, pos: B(-26, -30, 36), look: B(0, 0, 40), fov: 48 },
      { t: 11, pos: B(-40, 30, 50), look: B(0, 0, 36), fov: 46 },
      { t: 17, pos: B(10, 60, 44), look: B(0, 0, 34), fov: 46 },
      { t: 24, pos: B(-30, -120, 22), look: B(0, 0, 34), fov: 38 },
      { t: 31, pos: B(-60, -250, 4), look: B(0, 0, 30), fov: 34 },
    ];
    g.cameraController.playShot(keys, {
      blendBack: 2,
      onDone: () => {
        g.ui.letterbox(false);
        g.ui.ending.show(() => { g.setMode('play'); onDone?.(); });
      },
    });
    setTimeout(() => g.ui.titleCard(g.i18n.t('end.title'), g.i18n.t('game.title') + ' — ' + g.i18n.t('game.subtitle'), 7), 22000);
    this.skipper = null; // the finale can't be skipped mid-way: it resolves into the ending screen
  }
}
