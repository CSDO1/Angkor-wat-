/**
 * Schematic line illustrations (canvas 2D) for discovery panels, the journal and puzzle panels.
 * Simple, respectful diagrams in gold on charcoal — drawn in code, no external images.
 */
const GOLD = '#d9b36a', DIM = 'rgba(217,179,106,0.35)', SKY = '#241f1a';

function frame(g, w, h) {
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, '#2b241d'); grd.addColorStop(1, '#17130f');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.strokeStyle = GOLD; g.lineWidth = 2; g.lineJoin = 'round'; g.lineCap = 'round';
}

function tower(g, x, base, w, h) {
  g.beginPath();
  g.moveTo(x - w / 2, base);
  const tiers = 5;
  for (let i = 0; i <= tiers; i++) {
    const t = i / tiers, y = base - h * (0.25 + 0.65 * t), ww = (w / 2) * (1 - 0.75 * t) * (1 + 0.12 * Math.sin(t * 9));
    g.lineTo(x - ww, y);
  }
  g.lineTo(x, base - h);
  for (let i = tiers; i >= 0; i--) {
    const t = i / tiers, y = base - h * (0.25 + 0.65 * t), ww = (w / 2) * (1 - 0.75 * t) * (1 + 0.12 * Math.sin(t * 9));
    g.lineTo(x + ww, y);
  }
  g.lineTo(x + w / 2, base);
  g.stroke();
}

function fiveTowers(g, w, h, reflect = false) {
  const base = h * 0.66;
  g.strokeStyle = DIM; g.beginPath(); g.moveTo(w * 0.05, base); g.lineTo(w * 0.95, base); g.stroke();
  g.strokeStyle = GOLD;
  tower(g, w * 0.5, base, w * 0.13, h * 0.5);
  for (const [dx, s] of [[-0.17, 0.72], [0.17, 0.72], [-0.3, 0.6], [0.3, 0.6]]) tower(g, w * (0.5 + dx), base, w * 0.1 * s + 6, h * 0.5 * s);
  if (reflect) {
    g.save(); g.globalAlpha = 0.25; g.translate(0, base * 2); g.scale(1, -1); fiveTowers(g, w, h, false); g.restore();
  }
}

function naga(g, x, y, s, flip = 1) {
  g.beginPath();
  g.moveTo(x - 90 * flip * s, y);
  g.bezierCurveTo(x - 40 * flip * s, y, x - 20 * flip * s, y - 4, x, y - 10 * s);
  g.stroke();
  for (let k = 0; k < 7; k++) {
    const a = Math.PI * (0.15 + 0.7 * (k / 6));
    g.beginPath(); g.arc(x + Math.cos(a) * 26 * s * flip, y - 30 * s - Math.sin(a) * 28 * s, 6 * s, 0, Math.PI * 2); g.stroke();
  }
  g.beginPath(); g.arc(x, y - 30 * s, 36 * s, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
}

function figure(g, x, y, s, crown = true) {
  g.beginPath(); g.arc(x, y - 58 * s, 7 * s, 0, Math.PI * 2); g.stroke();
  if (crown) { g.beginPath(); g.moveTo(x - 7 * s, y - 64 * s); g.lineTo(x, y - 80 * s); g.lineTo(x + 7 * s, y - 64 * s); g.stroke(); }
  g.beginPath(); g.moveTo(x, y - 50 * s); g.lineTo(x, y - 25 * s);
  g.moveTo(x - 12 * s, y - 25 * s); g.lineTo(x + 12 * s, y - 25 * s); g.lineTo(x + 8 * s, y); g.lineTo(x - 8 * s, y); g.closePath();
  g.moveTo(x, y - 46 * s); g.lineTo(x - 14 * s, y - 34 * s); g.moveTo(x, y - 46 * s); g.lineTo(x + 14 * s, y - 38 * s);
  g.stroke();
}

function lotus(g, x, y, s) {
  for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) {
    g.save(); g.translate(x, y); g.rotate(a); g.beginPath();
    g.moveTo(0, 0); g.quadraticCurveTo(-12 * s, -22 * s, 0, -40 * s); g.quadraticCurveTo(12 * s, -22 * s, 0, 0); g.stroke(); g.restore();
  }
}

export const SYMBOLS = {
  lotus: (g, w, h) => lotus(g, w / 2, h * 0.75, w / 90),
  naga: (g, w, h) => naga(g, w / 2 + 20, h * 0.8, w / 160),
  conch: (g, w, h) => {
    const cx = w / 2, cy = h / 2, s = w / 110;
    g.beginPath();
    for (let a = 0; a < Math.PI * 5; a += 0.1) { const r = 3 * s + a * 3.2 * s; g.lineTo(cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r); }
    g.stroke();
    g.beginPath(); g.moveTo(cx - 10 * s, cy + 30 * s); g.lineTo(cx + 2 * s, cy + 52 * s); g.lineTo(cx + 12 * s, cy + 30 * s); g.stroke();
  },
  chakra: (g, w, h) => {
    const cx = w / 2, cy = h / 2, r = w * 0.32;
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(cx, cy, r * 0.2, 0, Math.PI * 2); g.stroke();
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2); g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.stroke(); }
  },
};

export const ILLUSTRATIONS = {
  towers: (g, w, h) => fiveTowers(g, w, h),
  moat: (g, w, h) => {
    fiveTowers(g, w, h * 0.8, true);
    g.strokeStyle = DIM; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(w * 0.1 + i * 30, h * 0.8 + i * 4); g.lineTo(w * 0.35 + i * 30, h * 0.8 + i * 4); g.stroke(); }
  },
  causeway: (g, w, h) => {
    g.beginPath(); g.moveTo(w * 0.1, h * 0.9); g.lineTo(w * 0.46, h * 0.45); g.moveTo(w * 0.9, h * 0.9); g.lineTo(w * 0.54, h * 0.45); g.stroke();
    tower(g, w * 0.5, h * 0.45, w * 0.08, h * 0.25);
    g.strokeStyle = DIM; for (let i = 1; i < 8; i++) { const t = i / 8; g.beginPath(); g.moveTo(w * (0.1 + 0.36 * t), h * (0.9 - 0.45 * t)); g.lineTo(w * (0.9 - 0.36 * t), h * (0.9 - 0.45 * t)); g.stroke(); }
  },
  gopura: (g, w, h) => {
    const b = h * 0.8;
    g.strokeRect(w * 0.1, b - h * 0.18, w * 0.8, h * 0.18);
    for (const x of [0.3, 0.5, 0.7]) { tower(g, w * x, b - h * 0.18, w * (x === 0.5 ? 0.12 : 0.09), h * (x === 0.5 ? 0.5 : 0.38)); g.strokeRect(w * x - 8, b - h * 0.14, 16, h * 0.14); }
  },
  naga: (g, w, h) => { naga(g, w * 0.35, h * 0.8, 1.2); naga(g, w * 0.65, h * 0.8, 1.2, -1); },
  quarry: (g, w, h) => {
    g.beginPath(); g.moveTo(0, h * 0.5); g.quadraticCurveTo(w * 0.2, h * 0.2, w * 0.4, h * 0.45); g.stroke();
    g.strokeStyle = DIM; g.beginPath(); g.moveTo(w * 0.35, h * 0.55); g.bezierCurveTo(w * 0.5, h * 0.7, w * 0.6, h * 0.6, w * 0.85, h * 0.7); g.stroke();
    g.strokeStyle = GOLD; for (let i = 0; i < 4; i++) g.strokeRect(w * (0.42 + i * 0.1), h * (0.6 + (i % 2) * 0.04) - 14, 20, 12);
    tower(g, w * 0.88, h * 0.66, 18, 50);
  },
  library: (g, w, h) => {
    const b = h * 0.78;
    g.strokeRect(w * 0.2, b - 50, w * 0.6, 50);
    g.beginPath(); g.moveTo(w * 0.18, b - 50); g.quadraticCurveTo(w * 0.5, b - 110, w * 0.82, b - 50); g.stroke();
    for (const x of [0.2, 0.8]) { g.beginPath(); g.moveTo(w * x - 18, b - 50); g.lineTo(w * x, b - 80); g.lineTo(w * x + 18, b - 50); g.stroke(); }
    g.strokeRect(w * 0.1, b, w * 0.8, 10);
  },
  lotus: (g, w, h) => { lotus(g, w * 0.5, h * 0.7, 1.4); g.strokeStyle = DIM; g.beginPath(); g.ellipse(w * 0.3, h * 0.78, 40, 8, 0, 0, Math.PI * 2); g.ellipse(w * 0.72, h * 0.8, 34, 7, 0, 0, Math.PI * 2); g.stroke(); },
  terrace: (g, w, h) => {
    const cx = w / 2, cy = h / 2;
    g.strokeRect(cx - 30, cy - 70, 60, 140); g.strokeRect(cx - 90, cy - 20, 180, 40);
    g.strokeStyle = DIM; for (let i = -60; i <= 60; i += 20) { g.beginPath(); g.arc(cx + (i % 40 === 0 ? 38 : -38), cy + i, 3, 0, 7); g.stroke(); }
  },
  relief: (g, w, h) => {
    g.strokeStyle = DIM; g.strokeRect(w * 0.05, h * 0.2, w * 0.9, h * 0.6);
    g.strokeStyle = GOLD;
    for (let i = 0; i < 9; i++) figure(g, w * (0.12 + i * 0.095), h * 0.75, 0.55 + (i % 3) * 0.05, i % 4 === 0);
  },
  buddha: (g, w, h) => {
    const cx = w / 2, cy = h / 2;
    g.strokeRect(cx - 110, cy - 10, 220, 20); g.strokeRect(cx - 10, cy - 70, 20, 140);
    g.strokeStyle = DIM; for (const [dx, dy] of [[-55, -40], [55, -40], [-55, 40], [55, 40]]) g.strokeRect(cx + dx - 30, cy + dy - 18, 60, 36);
  },
  devata: (g, w, h) => { figure(g, w * 0.35, h * 0.9, 1.1); figure(g, w * 0.65, h * 0.9, 1.1); g.strokeStyle = DIM; g.strokeRect(w * 0.2, h * 0.1, w * 0.6, h * 0.82); },
  stairs: (g, w, h) => {
    const x0 = w * 0.3, y0 = h * 0.9; g.beginPath(); g.moveTo(x0, y0);
    for (let i = 0; i < 12; i++) { g.lineTo(x0 + i * 8, y0 - (i + 1) * 13); g.lineTo(x0 + (i + 1) * 8, y0 - (i + 1) * 13); }
    g.stroke(); tower(g, w * 0.75, h * 0.35, 40, 70);
  },
  wall: (g, w, h) => {
    g.strokeRect(w * 0.05, h * 0.5, w * 0.9, h * 0.18);
    g.strokeStyle = DIM; for (let i = 0; i < 20; i++) g.strokeRect(w * 0.05 + i * (w * 0.045), h * 0.5 + (i % 2) * 12, w * 0.045, 12);
  },
  lanka: (g, w, h) => { for (let i = 0; i < 7; i++) figure(g, w * (0.1 + i * 0.13), h * 0.85, 0.7 + ((i * 7) % 3) * 0.1, i === 3); },
  kurukshetra: (g, w, h) => {
    for (const [x, dir] of [[0.25, 1], [0.75, -1]]) {
      g.beginPath(); g.arc(w * x, h * 0.72, 16, 0, 7); g.stroke();
      g.strokeRect(w * x - 22, h * 0.55, 44, 18); figure(g, w * x, h * 0.55, 0.45);
      for (let i = 1; i < 4; i++) figure(g, w * x - dir * i * 26, h * 0.92, 0.45, false);
    }
  },
  procession: (g, w, h) => {
    g.beginPath(); g.ellipse(w * 0.5, h * 0.65, 60, 30, 0, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(w * 0.5 + 60, h * 0.6); g.quadraticCurveTo(w * 0.5 + 90, h * 0.75, w * 0.5 + 80, h * 0.9); g.stroke();
    for (const x of [-35, -10, 15, 40]) { g.beginPath(); g.moveTo(w * 0.5 + x, h * 0.9); g.lineTo(w * 0.5 + x, h * 0.72); g.stroke(); }
    figure(g, w * 0.5, h * 0.4, 0.55);
    for (const x of [0.2, 0.35, 0.65, 0.8]) { g.beginPath(); g.arc(w * x, h * 0.25, 16, Math.PI, 0); g.moveTo(w * x, h * 0.25); g.lineTo(w * x, h * 0.45); g.stroke(); }
  },
  churning: (g, w, h) => {
    const cx = w / 2;
    g.beginPath(); g.ellipse(cx, h * 0.86, 40, 12, 0, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(cx - 14, h * 0.8); g.lineTo(cx - 6, h * 0.2); g.lineTo(cx + 6, h * 0.2); g.lineTo(cx + 14, h * 0.8); g.stroke();
    g.beginPath(); g.moveTo(w * 0.05, h * 0.55); for (let x = 0.05; x <= 0.95; x += 0.02) g.lineTo(w * x, h * (0.55 + 0.02 * Math.sin(x * 40))); g.stroke();
    for (let i = 0; i < 4; i++) { figure(g, w * (0.1 + i * 0.08), h * 0.72, 0.4); figure(g, w * (0.9 - i * 0.08), h * 0.72, 0.4, false); }
  },
  // story panels for the (fictional) relief puzzle
  stage_turtle: (g, w, h) => { g.beginPath(); g.ellipse(w / 2, h * 0.8, 50, 16, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(w / 2 - 22, h * 0.72); g.lineTo(w / 2, h * 0.2); g.lineTo(w / 2 + 22, h * 0.72); g.stroke(); },
  stage_pull: (g, w, h) => { ILLUSTRATIONS.churning(g, w, h); },
  stage_apsaras: (g, w, h) => {
    g.strokeStyle = DIM; g.beginPath(); for (let x = 0.05; x <= 0.95; x += 0.02) g.lineTo(w * x, h * (0.8 + 0.03 * Math.sin(x * 30))); g.stroke();
    g.strokeStyle = GOLD; for (let i = 0; i < 4; i++) { g.save(); g.translate(w * (0.2 + i * 0.2), h * 0.7); g.rotate((i % 2 ? 0.3 : -0.3)); figure(g, 0, 0, 0.6); g.restore(); }
  },
  stage_amrita: (g, w, h) => {
    const cx = w / 2, cy = h * 0.55;
    g.beginPath(); g.arc(cx, cy, 30, 0.2, Math.PI - 0.2); g.moveTo(cx - 20, cy - 14); g.lineTo(cx + 20, cy - 14); g.stroke();
    g.strokeStyle = DIM; for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 45, cy + Math.sin(a) * 45); g.lineTo(cx + Math.cos(a) * 70, cy + Math.sin(a) * 70); g.stroke(); }
  },
};

const cache = new Map();
/** Returns a data URL for an illustration key (cached). */
export function illustration(key, w = 480, h = 240) {
  const k = `${key}:${w}x${h}`;
  if (cache.has(k)) return cache.get(k);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); frame(g, w, h);
  (ILLUSTRATIONS[key] ?? ILLUSTRATIONS.towers)(g, w, h);
  const url = c.toDataURL();
  cache.set(k, url);
  return url;
}

/** Canvas with a symbol, used as a texture on the puzzle stones. */
export function symbolCanvas(key, size = 256, color = GOLD, bg = null) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, size, size); }
  g.strokeStyle = color; g.lineWidth = size / 40; g.lineCap = 'round'; g.lineJoin = 'round';
  (SYMBOLS[key] ?? ILLUSTRATIONS[key])(g, size, size);
  return c;
}

export function illustrationCanvas(key, w = 512, h = 256) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); frame(g, w, h);
  (ILLUSTRATIONS[key] ?? ILLUSTRATIONS.towers)(g, w, h);
  return c;
}

export { SKY };
