import './ui/fonts.js';
import { Game } from './core/Game.js';
import { platform } from './core/platform.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);
window.__angkor = game;   // handy for debugging in the console

if (platform.desktop) {
  // the desktop window remembers fullscreen between launches; F11 / the View menu keep the setting in sync
  if (game.settings.values.fullscreen) platform.setFullscreen(true);
  platform.onFullscreen((on) => { game.settings.values.fullscreen = on; game.settings.save(); });
}

game.boot().catch((e) => {
  console.error(e);
  const msg = document.querySelector('.loading .msg');
  if (msg) msg.textContent = 'Could not load Angkor Wat: ' + (e?.message ?? e);
});
