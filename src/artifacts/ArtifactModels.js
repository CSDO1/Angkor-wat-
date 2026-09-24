import * as THREE from 'three';
import { worldMaterial } from '../materials/WorldShading.js';

/** Procedural 3D models for the (fictional, replica) artifacts, stone keys and puzzle props. */
const M = (p) => worldMaterial(new THREE.MeshStandardMaterial(p));

function carvedTexture(draw, size = 256, base = '#8a7a62') {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`; g.fillRect(Math.random() * size, Math.random() * size, 2, 2); }
  draw?.(g, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeArtifactModel(kind) {
  const grp = new THREE.Group();
  switch (kind) {
    case 'devata': {
      const stone = M({ color: 0xb9ab92, roughness: 0.85 });
      const face = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 16), stone); face.scale.set(0.85, 1.1, 0.9);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 12), stone); neck.position.y = -0.14;
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.05, 16), stone); base.position.y = -0.2;
      const crown = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const tier = new THREE.Mesh(new THREE.CylinderGeometry(0.07 - i * 0.02, 0.1 - i * 0.02, 0.07, 12), stone);
        tier.position.y = 0.12 + i * 0.07; crown.add(tier);
      }
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.1, 10), stone); tip.position.y = 0.34; crown.add(tip);
      for (let k = 0; k < 5; k++) {
        const s = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.07, 6), stone);
        const a = -0.8 + k * 0.4; s.position.set(Math.sin(a) * 0.1, 0.15, Math.cos(a) * 0.09); crown.add(s);
      }
      const eyes = M({ color: 0x6b5e4c, roughness: 0.9 });
      for (const x of [-0.035, 0.035]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), eyes); e.position.set(x, 0.02, 0.1); e.scale.set(1.6, 0.6, 0.5); grp.add(e); }
      grp.add(face, neck, base, crown);
      break;
    }
    case 'stele': {
      const tex = carvedTexture((g, s) => {
        g.fillStyle = '#efe8d8'; g.fillRect(0, 0, s, s);
        g.fillStyle = '#1d1a16';
        // decorative, non-real "script" strokes
        for (let r = 0; r < 12; r++) for (let c = 0; c < 9; c++) {
          const x = 20 + c * 25, y = 20 + r * 19;
          g.beginPath(); g.arc(x, y, 5, Math.PI * (0.2 + (r * c % 3) * 0.3), Math.PI * 1.8); g.lineWidth = 2.5; g.strokeStyle = '#1d1a16'; g.stroke();
          if ((r + c) % 3 === 0) g.fillRect(x - 5, y - 9, 10, 2);
        }
      });
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.46, 8, 8), M({ map: tex, roughness: 0.95, side: THREE.DoubleSide }));
      const pos = sheet.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 9) * 0.01 + Math.sin(pos.getY(i) * 6) * 0.008);
      sheet.geometry.computeVertexNormals();
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.36, 12).rotateZ(Math.PI / 2), M({ color: 0x6a4a2a, roughness: 0.8 }));
      roll.position.y = 0.24;
      grp.add(sheet, roll);
      break;
    }
    case 'conch': {
      const pts = [];
      for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(new THREE.Vector2(0.01 + Math.sin(t * Math.PI) * 0.09 * (1 - t * 0.4), t * 0.3 - 0.15)); }
      const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), M({ color: 0xf1e3cc, roughness: 0.35 }));
      const pos = body.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); const a = Math.atan2(pos.getZ(i), pos.getX(i)); const k = 1 + 0.06 * Math.sin(a * 3 + y * 40); pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k); }
      body.geometry.computeVertexNormals();
      body.rotation.z = Math.PI / 2.4;
      const lip = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 20, Math.PI * 1.3), M({ color: 0xe8b8a0, roughness: 0.3 }));
      lip.position.set(0.02, -0.03, 0.05); lip.rotation.y = 0.6;
      grp.add(body, lip);
      break;
    }
    case 'finial': {
      const stone = M({ color: 0x9b8a70, roughness: 0.9 });
      const pts = [[0.14, 0], [0.14, 0.04], [0.11, 0.06], [0.12, 0.1], [0.09, 0.16], [0.1, 0.2], [0.07, 0.26], [0.075, 0.3], [0.045, 0.36], [0.02, 0.42], [0, 0.46]];
      const body = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y - 0.23)), 8), stone);
      body.rotation.y = Math.PI / 8;
      grp.add(body);
      break;
    }
    case 'manuscript': {
      const leaf = M({ color: 0xcdb27a, roughness: 0.75 });
      const wood = M({ color: 0x5a3822, roughness: 0.7 });
      for (let i = 0; i < 9; i++) {
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.004, 0.055), leaf); l.position.y = -0.02 + i * 0.005; l.rotation.y = (i - 4) * 0.01; grp.add(l);
      }
      for (const y of [-0.028, 0.028]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.01, 0.06), wood); c.position.y = y; grp.add(c); }
      const cord = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.004, 6, 16), M({ color: 0x9a2a22 })); cord.rotation.x = Math.PI / 2; cord.position.x = -0.12; grp.add(cord);
      break;
    }
    case 'letter': {
      const tex = carvedTexture((g, s) => {
        g.fillStyle = '#f2ecdc'; g.fillRect(0, 0, s, s);
        g.strokeStyle = '#8aa'; for (let y = 24; y < s; y += 16) { g.beginPath(); g.moveTo(10, y); g.lineTo(s - 10, y); g.stroke(); }
        g.fillStyle = '#2a2a3a'; g.font = '14px serif'; g.fillText('Preah Poan — 1632', 16, 20);
        for (let y = 40; y < s - 10; y += 16) g.fillRect(16, y - 8, 60 + Math.random() * 150, 2);
      }, 256, '#f2ecdc');
      const page = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.28), M({ map: tex, side: THREE.DoubleSide, roughness: 0.9 }));
      grp.add(page);
      break;
    }
    case 'key': {
      const stone = M({ color: 0xa58c62, roughness: 0.7, emissive: 0x2a1c05 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 8), stone); body.rotation.x = Math.PI / 2;
      const knob = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.08), stone); knob.position.y = -0.16;
      grp.add(body, knob);
      break;
    }
    default: grp.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), M({ color: 0xaaaaaa })));
  }
  grp.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return grp;
}

/** Floating discovery marker: a small gold lotus-diamond with a soft glow. */
let glowTex = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,230,170,1)'); r.addColorStop(0.3, 'rgba(255,200,110,0.45)'); r.addColorStop(1, 'rgba(255,190,90,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  glowTex = new THREE.CanvasTexture(c);
  return glowTex;
}

export function makeMarker({ color = 0xf0c070, scale = 1, subtle = false } = {}) {
  const grp = new THREE.Group();
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.16 * scale, 0),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: subtle ? 0.6 : 1.4, roughness: 0.3, metalness: 0.5, transparent: true, opacity: 0.95 }));
  gem.scale.y = 1.6;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: subtle ? 0.45 : 0.9, fog: false }));
  glow.scale.setScalar(1.1 * scale);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.35 * scale, 0.42 * scale, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: subtle ? 0.15 : 0.35, depthWrite: false, fog: false }));
  ring.position.y = -1.05 * scale;
  grp.add(gem, glow, ring);
  grp.userData = { gem, glow, ring, t: Math.random() * 10 };
  return grp;
}

export function animateMarker(m, dt, active = true) {
  const u = m.userData; u.t += dt;
  u.gem.rotation.y += dt * 1.2;
  u.gem.position.y = Math.sin(u.t * 1.8) * 0.06;
  u.glow.position.y = u.gem.position.y;
  const target = active ? 1 : 0;
  u.fade = (u.fade ?? 1) + (target - (u.fade ?? 1)) * Math.min(1, dt * 3);
  m.visible = u.fade > 0.02;
  m.scale.setScalar(0.4 + 0.6 * u.fade);
}

export { glowTexture };
