import * as THREE from 'three';
import { worldMaterial } from '../materials/WorldShading.js';
import { damp } from '../core/utils.js';

/**
 * Procedural low-poly humanoid used for the player and the NPCs (original, no external assets).
 * Joints are plain Object3Ds; `animate()` drives a walk/run/sprint/crouch/jump/idle cycle.
 */
const matCache = new Map();
function mat(color, rough = 0.85, extra = {}) {
  const key = color + ':' + rough + JSON.stringify(extra);
  if (!matCache.has(key)) matCache.set(key, worldMaterial(new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra })));
  return matCache.get(key);
}

function kramaTexture(c1 = '#b0282a', c2 = '#f1e6d0') {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const g = cv.getContext('2d');
  g.fillStyle = c2; g.fillRect(0, 0, 64, 64);
  g.fillStyle = c1;
  for (let i = 0; i < 64; i += 16) { g.globalAlpha = 0.85; g.fillRect(i, 0, 8, 64); g.fillRect(0, i, 64, 8); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const limb = (r, len, m) => {
  const g = new THREE.CapsuleGeometry(r, Math.max(0.01, len - 2 * r), 3, 8).translate(0, -len / 2, 0);
  const mesh = new THREE.Mesh(g, m); mesh.castShadow = true; return mesh;
};

export class HumanoidModel {
  constructor(opts = {}) {
    const o = {
      skin: 0xa8795a, shirt: 0x8a7a5a, pants: 0x3e3a33, shoes: 0x2e241c, hair: 0x1a1410,
      height: 1.75, build: 1, hat: null, backpack: false, krama: false, vest: null, hardHat: false,
      camera: false, clipboard: false, skirt: null, ...opts,
    };
    this.opts = o;
    const s = o.height / 1.75;
    this.root = new THREE.Group();
    this.root.name = 'Humanoid';
    const R = this.root;
    const skin = mat(o.skin, 0.7), shirt = mat(o.shirt), pants = mat(o.pants), shoes = mat(o.shoes, 0.9);

    this.hips = new THREE.Group(); this.hips.position.y = 0.95 * s; R.add(this.hips);
    const pelvis = new THREE.Mesh(new THREE.CapsuleGeometry(0.15 * o.build, 0.1, 3, 8).rotateZ(Math.PI / 2), o.skirt ? mat(o.skirt) : pants);
    pelvis.scale.set(1, 1, 0.75); pelvis.castShadow = true; this.hips.add(pelvis);

    this.spine = new THREE.Group(); this.spine.position.y = 0.05 * s; this.hips.add(this.spine);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17 * o.build, 0.3 * s, 4, 10).translate(0, 0.28 * s, 0), shirt);
    torso.scale.set(1.05, 1, 0.68); torso.castShadow = true; this.spine.add(torso);
    if (o.vest) {
      const vest = new THREE.Mesh(new THREE.CapsuleGeometry(0.18 * o.build, 0.22 * s, 4, 10).translate(0, 0.3 * s, 0), mat(o.vest, 0.6));
      vest.scale.set(1.07, 1, 0.72); this.spine.add(vest);
    }
    if (o.skirt) {
      const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.26, 0.5 * s, 12, 1, true).translate(0, -0.3 * s, 0), mat(o.skirt));
      sk.material.side = THREE.DoubleSide; this.hips.add(sk);
    }

    this.neck = new THREE.Group(); this.neck.position.y = 0.55 * s; this.spine.add(this.neck);
    this.head = new THREE.Group(); this.head.position.y = 0.08 * s; this.neck.add(this.head);
    const headM = new THREE.Mesh(new THREE.SphereGeometry(0.105 * s, 14, 10), skin);
    headM.scale.set(0.9, 1.08, 1); headM.position.y = 0.08 * s; headM.castShadow = true; this.head.add(headM);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.108 * s, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(o.hair, 0.9));
    hair.scale.set(0.92, 1.1, 1.03); hair.position.set(0, 0.09 * s, -0.005);
    if (!o.hat && !o.hardHat) this.head.add(hair);
    const neckM = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.1 * s, 8), skin); neckM.position.y = 0.0; this.neck.add(neckM);
    // eyes / nose hint so facing direction reads at a distance
    const eyeM = mat(0x16100c, 0.4);
    for (const x of [-0.035, 0.035]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), eyeM); e.position.set(x, 0.1 * s, 0.093 * s); this.head.add(e);
    }
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.035, 5).rotateX(Math.PI / 2), skin);
    nose.position.set(0, 0.075 * s, 0.1 * s); this.head.add(nose);

    if (o.hat === 'explorer') {
      const hm = mat(0x9c8660, 0.9);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.015, 18), hm); brim.position.y = 0.16 * s;
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.11, 0.09, 14), hm); crown.position.y = 0.2 * s;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.112, 0.112, 0.022, 14), mat(0x4a3322)); band.position.y = 0.175 * s;
      this.head.add(brim, crown, band);
    } else if (o.hat === 'sun') {
      const hm = mat(0xe3d7b8, 0.9);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.03, 16), hm); brim.position.y = 0.16 * s;
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), hm); crown.position.y = 0.16 * s;
      this.head.add(brim, crown);
    }
    if (o.hardHat) {
      const hh = new THREE.Mesh(new THREE.SphereGeometry(0.125, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xe8b020, 0.5));
      hh.position.y = 0.13 * s; const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.012, 16), hh.material);
      brim.position.y = 0.135 * s; this.head.add(hh, brim);
    }
    if (o.krama) {
      const km = worldMaterial(new THREE.MeshStandardMaterial({ map: kramaTexture(o.krama[0], o.krama[1]), roughness: 0.95 }));
      const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 6, 14).rotateX(Math.PI / 2), km);
      scarf.position.y = 0.52 * s; scarf.scale.set(1.2, 1, 1); this.spine.add(scarf);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.02), km); tail.position.set(0.06, 0.38 * s, 0.1); tail.rotation.z = 0.15;
      this.spine.add(tail);
    }
    if (o.backpack) {
      const bp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.38, 0.16), mat(0x5a4a30, 0.9));
      bp.position.set(0, 0.32 * s, -0.17); bp.castShadow = true;
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8).rotateZ(Math.PI / 2), mat(0x3c4a3a));
      roll.position.set(0, 0.54 * s, -0.17);
      this.spine.add(bp, roll);
    }
    if (o.camera) {
      const cam = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.07), mat(0x151515, 0.4));
      cam.position.set(0.05, 0.3 * s, 0.14); this.spine.add(cam);
    }

    const arm = (side) => {
      const sh = new THREE.Group(); sh.position.set(side * 0.21 * o.build, 0.47 * s, 0); this.spine.add(sh);
      const up = limb(0.05, 0.3 * s, shirt); sh.add(up);
      const el = new THREE.Group(); el.position.y = -0.3 * s; sh.add(el);
      const fo = limb(0.042, 0.27 * s, skin); el.add(fo);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), skin); hand.position.y = -0.29 * s; hand.scale.set(0.8, 1.1, 0.6); el.add(hand);
      return { sh, el, hand };
    };
    const leg = (side) => {
      const hip = new THREE.Group(); hip.position.set(side * 0.09, -0.02, 0); this.hips.add(hip);
      const th = limb(0.07, 0.45 * s, pants); hip.add(th);
      const kn = new THREE.Group(); kn.position.y = -0.45 * s; hip.add(kn);
      const sh = limb(0.058, 0.43 * s, pants); kn.add(sh);
      const an = new THREE.Group(); an.position.y = -0.43 * s; kn.add(an);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.24), shoes); foot.position.set(0, -0.03, 0.05); foot.castShadow = true; an.add(foot);
      return { hip, kn, an };
    };
    this.armL = arm(1); this.armR = arm(-1);
    this.legL = leg(1); this.legR = leg(-1);
    if (o.clipboard) {
      const cb = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, 0.015), mat(0x7a5a3a)); cb.position.set(0, -0.3, 0.06); cb.rotation.x = -0.4;
      this.armR.el.add(cb);
    }

    this.phase = 0;
    this.st = { speed: 0, crouch: 0, air: 0, lean: 0, climb: 0, talk: 0, look: 0 };
  }

  /**
   * @param dt seconds
   * @param state {speed m/s, grounded, crouch 0..1, climbing, vy, talking}
   */
  animate(dt, state) {
    const st = this.st, k = damp(10, dt);
    st.speed += (state.speed - st.speed) * k;
    st.crouch += ((state.crouch ? 1 : 0) - st.crouch) * damp(8, dt);
    st.air += ((state.grounded ? 0 : 1) - st.air) * damp(12, dt);
    st.climb += ((state.climbing ? 1 : 0) - st.climb) * damp(6, dt);
    st.talk += ((state.talking ? 1 : 0) - st.talk) * damp(4, dt);
    const sp = st.speed;
    const stride = sp < 2.5 ? 1.25 : sp < 5 ? 1.9 : 2.4;
    this.phase += (sp / stride) * dt * Math.PI * 2 * (state.grounded ? 1 : 0.2);
    const ph = this.phase;
    const amt = Math.min(1, sp / 1.4);
    const run = THREE.MathUtils.smoothstep(sp, 2.2, 5.5);
    const t = performance.now() / 1000;

    const swing = (0.45 + 0.35 * run) * amt;
    const cr = st.crouch, air = st.air;
    this.hips.position.y = (0.95 - 0.33 * cr) * (this.opts.height / 1.75) + Math.abs(Math.sin(ph)) * 0.04 * amt * (1 - cr) - 0.03 * run;
    this.hips.rotation.y = Math.sin(ph) * 0.12 * amt;
    this.spine.rotation.x = 0.08 * run + 0.35 * cr + 0.25 * st.climb + Math.sin(t * 1.6) * 0.01;
    this.spine.rotation.y = -Math.sin(ph) * 0.18 * amt;

    for (const [L, sgn] of [[this.legL, 1], [this.legR, -1]]) {
      const p = ph + (sgn > 0 ? 0 : Math.PI);
      const s = Math.sin(p), c = Math.cos(p);
      L.hip.rotation.x = -s * swing - 0.9 * cr - 0.5 * air - 0.35 * st.climb * (0.5 + 0.5 * s);
      L.kn.rotation.x = Math.max(0, c) * (0.9 + 0.6 * run) * amt + 1.5 * cr + 1.0 * air + 0.6 * st.climb * (0.5 + 0.5 * s) + 0.05;
      L.an.rotation.x = -0.3 * cr - 0.2 * air;
    }
    for (const [A, sgn] of [[this.armL, 1], [this.armR, -1]]) {
      const p = ph + (sgn > 0 ? Math.PI : 0);
      A.sh.rotation.x = -Math.sin(p) * (0.5 + 0.5 * run) * amt - 0.4 * air;
      A.sh.rotation.z = sgn * (0.08 + 0.3 * air + 0.05 * Math.sin(t * 1.2));
      A.el.rotation.x = -(0.25 + 0.9 * run) * amt - 0.2 - 0.3 * cr;
    }
    // talking gestures (NPCs)
    if (st.talk > 0.01) {
      this.armR.sh.rotation.x += -0.5 * st.talk + Math.sin(t * 2.3) * 0.25 * st.talk;
      this.armR.el.rotation.x += -0.7 * st.talk;
      this.head.rotation.y = Math.sin(t * 0.9) * 0.15 * st.talk;
    }
    this.head.rotation.x = -0.1 * run - 0.1 * st.climb + (state.lookPitch ?? 0);
    if (state.lookYaw !== undefined) this.head.rotation.y = state.lookYaw;
  }
}
