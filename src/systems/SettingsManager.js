/**
 * Graphics / audio / control settings with Low–Ultra presets. Persisted in localStorage and applied
 * live (nothing is reloaded; the environment stays in memory).
 */
const KEY = 'angkor.settings.v1';

export const PRESET_VALUES = {
  low: { resolution: 0.7, texture: 0, shadows: 0, aa: 'fxaa', ao: 'baked', reflections: 0, vegetation: 0.35, viewDistance: 900, occlusion: true },
  medium: { resolution: 0.85, texture: 1, shadows: 1, aa: 'fxaa', ao: 'baked', reflections: 1, vegetation: 0.6, viewDistance: 1400, occlusion: true },
  high: { resolution: 1, texture: 2, shadows: 2, aa: 'msaa', ao: 'baked', reflections: 2, vegetation: 0.85, viewDistance: 2200, occlusion: true },
  ultra: { resolution: 1, texture: 2, shadows: 3, aa: 'msaa', ao: 'ssao', reflections: 3, vegetation: 1, viewDistance: 3200, occlusion: true },
};

const DEFAULTS = {
  preset: 'high',
  ...PRESET_VALUES.high,
  vsync: true, fpsLimit: 0, fullscreen: false, showFps: false,
  sensitivity: 1, invertY: false, fov: 60,
  brightness: 1, uiScale: 1, autosave: true, hints: true, showObjective: true, guidance: 'guided',
  highContrast: false, reducedMotion: false,
  master: 0.85, music: 0.5, ambience: 0.8, sfx: 0.8, ui: 0.7,
  language: /^km\b/i.test(navigator.language || '') ? 'km' : 'en', languageChosen: false, timeMode: 'story',
};

export class SettingsManager {
  constructor(events) {
    this.events = events;
    this.values = { ...DEFAULTS };
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved) Object.assign(this.values, { languageChosen: true }, saved);   // older saves already picked a language
    } catch { /* storage unavailable */ }
    if (!hasSaved()) this.values.preset = guessPreset();
    if (this.values.preset !== 'custom') Object.assign(this.values, PRESET_VALUES[this.values.preset]);
  }

  set(key, value) {
    this.values[key] = value;
    if (key in PRESET_VALUES.high && key !== 'preset') this.values.preset = 'custom';
    this.save();
    this.events.emit('settings', { key, value, values: this.values });
  }

  applyPreset(name) {
    if (!PRESET_VALUES[name]) return;
    Object.assign(this.values, PRESET_VALUES[name], { preset: name });
    this.save();
    this.events.emit('settings', { key: 'preset', value: name, values: this.values });
  }

  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.values)); } catch { /* ignore */ }
  }

  /** Back to defaults for everything except language (keeps the detected graphics preset). */
  reset() {
    const keep = { language: this.values.language, languageChosen: true };
    this.values = { ...DEFAULTS, ...keep, preset: guessPreset() };
    Object.assign(this.values, PRESET_VALUES[this.values.preset]);
    this.save();
    this.events.emit('settings', { key: 'reset', values: this.values });
  }

  toJSON() { return { ...this.values }; }
}

function hasSaved() { try { return !!localStorage.getItem(KEY); } catch { return false; } }

/** First-run guess from the GPU / device class; players can change it any time. */
function guessPreset() {
  try {
    const c = document.createElement('canvas').getContext('webgl2');
    const info = c?.getExtension('WEBGL_debug_renderer_info');
    const r = info ? String(c.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    if (/Apple M[2-9]|RTX|RX 6|RX 7|Radeon Pro/i.test(r)) return 'high';
    if (/Intel|Mali|Adreno|PowerVR|Apple GPU/i.test(r)) return 'medium';
  } catch { /* ignore */ }
  return 'medium';
}
