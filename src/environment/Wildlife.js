import * as THREE from 'three';
import { NOISE_GLSL } from '../shaders/noise.glsl.js';
import { AtmosphereUniforms, worldMaterial } from '../materials/WorldShading.js';
import { glowTexture } from '../artifacts/ArtifactModels.js';

/**
 * Peaceful life: bird flocks circling the towers, egrets over the moat, butterflies and
 * dragonflies near the player, gnats in the sun, fireflies at night and drifting morning mist.
 * Everything is pooled / instanced and recycled around the player.
 */
export class Wildlife {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3(1, 1, 1); this._p = new THREE.Vector3();
    this._birds(); this._butterflies(); this._particles(); this._mist();
  }

  // ---------------------------------------------------------------------------------- birds
  _birds() {
    const geo = new THREE.BufferGeometry();
    // body + two wings; wing tips carry uv.x = 1 so the shader flaps them
    const v = [0, 0, 0.35, 0, 0, -0.3, -0.06, 0, 0,   0, 0, 0.15, 0, 0, -0.1, -0.9, 0, -0.05,   0, 0, 0.15, 0, 0, -0.1, 0.9, 0, -0.05,  0.06, 0, 0, 0, 0, 0.35, 0, 0, -0.3];
    const f = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1];
    geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    geo.setAttribute('flap', new THREE.Float32BufferAttribute(f, 1));
    geo.computeVertexNormals();
    const mat = worldMaterial(new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 1, side: THREE.DoubleSide }), (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float flap;\nuniform float uTime;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float ph = float(gl_InstanceID) * 1.7;
          transformed.y += flap * sin(uTime * 9.0 + ph) * 0.55;`);
    }, 'bird');
    this.birdCount = 46;
    this.birdMesh = new THREE.InstancedMesh(geo, mat, this.birdCount);
    this.birdMesh.frustumCulled = false;
    this.birds = [];
    for (let i = 0; i < this.birdCount; i++) {
      const flock = i % 4;
      const egret = flock === 3;
      this.birds.push({
        flock, egret,
        r: egret ? 180 + Math.random() * 120 : 45 + flock * 25 + Math.random() * 15,
        h: egret ? 4 + Math.random() * 6 : 45 + flock * 12 + Math.random() * 10,
        a: Math.random() * Math.PI * 2, sp: (egret ? 0.03 : 0.12) * (0.8 + Math.random() * 0.4) * (flock % 2 ? 1 : -1),
        wob: Math.random() * 10, scale: egret ? 1.6 : 0.55,
        cx: egret ? (Math.random() < 0.5 ? -250 : 250) : 0, cz: egret ? 520 : 0,
      });
    }
    this.egretMat = null;
    this.scene.add(this.birdMesh);
  }

  // ----------------------------------------------------------------------------- butterflies
  _butterflies() {
    const geo = new THREE.BufferGeometry();
    const v = [0, 0, 0, -0.07, 0, 0.05, -0.06, 0, -0.05,  0, 0, 0, 0.07, 0, 0.05, 0.06, 0, -0.05];
    const side = [0, -1, -1, 0, 1, 1];
    geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    geo.setAttribute('side', new THREE.Float32BufferAttribute(side, 1));
    geo.computeVertexNormals();
    const mat = worldMaterial(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, side: THREE.DoubleSide, emissive: 0x221100 }), (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float side;\nuniform float uTime;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float ph = float(gl_InstanceID) * 2.3;
          float a = sin(uTime * 14.0 + ph) * 1.1;
          transformed.y += abs(side) * abs(transformed.x) * sin(a) * 1.3;
          transformed.x *= cos(a) * 0.6 + 0.4;`);
    }, 'butterfly');
    this.flyCount = 36;
    this.flyMesh = new THREE.InstancedMesh(geo, mat, this.flyCount);
    this.flyMesh.frustumCulled = false;
    this.flyMesh.layers.set(1);
    const palette = [0xf2c14e, 0xf28c28, 0xffffff, 0x5aa9e6, 0xe86a5a, 0x9ad07a];
    this.flies = [];
    for (let i = 0; i < this.flyCount; i++) {
      this.flyMesh.setColorAt(i, new THREE.Color(palette[i % palette.length]));
      const dragon = i >= 28;
      this.flies.push({ p: new THREE.Vector3(0, -1000, 0), v: new THREE.Vector3(), t: Math.random() * 10, dragon, alive: false });
    }
    this.scene.add(this.flyMesh);
  }

  // --------------------------------------------------------------------- fireflies and gnats
  _particles() {
    const n = 220;
    const pos = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos.set([(Math.random() - 0.5) * 60, Math.random() * 3, (Math.random() - 0.5) * 60], i * 3); seed[i] = Math.random() * 100; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    this.fireMat = new THREE.ShaderMaterial({
      uniforms: { uTime: AtmosphereUniforms.uTime, uAlpha: { value: 0 }, uMap: { value: glowTexture() }, uColor: { value: new THREE.Color(0xd8ff7a) }, uSize: { value: 14 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute float seed; uniform float uTime; uniform float uSize; varying float vA;
        void main(){ vec3 p = position; p.x += sin(uTime*0.3+seed)*1.5; p.y += sin(uTime*0.5+seed*2.0)*0.6; p.z += cos(uTime*0.27+seed)*1.5;
        vec4 mv = modelViewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mv; vA = 0.5+0.5*sin(uTime*2.0+seed*5.0);
        gl_PointSize = uSize * vA / max(1.0, -mv.z*0.15); }`,
      fragmentShader: `uniform sampler2D uMap; uniform float uAlpha; uniform vec3 uColor; varying float vA;
        void main(){ vec4 t = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(uColor * t.a * uAlpha * vA, 1.0); }`,
    });
    this.fireflies = new THREE.Points(g, this.fireMat);
    this.fireflies.frustumCulled = false;
    this.fireflies.layers.set(1);
    this.scene.add(this.fireflies);

    this.gnatMat = this.fireMat.clone();
    this.gnatMat.uniforms.uTime = AtmosphereUniforms.uTime;
    this.gnatMat.uniforms.uColor.value = new THREE.Color(0xfff2d0);
    this.gnatMat.uniforms.uSize.value = 3;
    this.gnatMat.uniforms.uMap.value = glowTexture();
    this.gnats = new THREE.Points(g, this.gnatMat);
    this.gnats.scale.set(0.12, 0.6, 0.12);
    this.gnats.frustumCulled = false;
    this.gnats.layers.set(1);
    this.scene.add(this.gnats);
  }

  // -------------------------------------------------------------------------------------- mist
  _mist() {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: AtmosphereUniforms.uTime, uAmt: { value: 1 }, uColor: { value: new THREE.Color() } },
      transparent: true, depthWrite: false,
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
      fragmentShader: `uniform float uTime; uniform float uAmt; uniform vec3 uColor; varying vec3 vW;
        ${NOISE_GLSL}
        void main(){ vec2 p = vW.xz*0.02 + vec2(uTime*0.006, uTime*0.004);
          float n = fbm2(p) * 0.7 + fbm2(p*3.0 - uTime*0.01) * 0.3;
          float d = length(vW.xz - cameraPosition.xz);
          float edge = smoothstep(260.0, 120.0, d) * smoothstep(2.0, 18.0, d);
          float lowCam = 1.0 - smoothstep(6.0, 30.0, cameraPosition.y);
          float a = smoothstep(0.45, 0.85, n) * uAmt * edge * 0.3 * lowCam;
          gl_FragColor = vec4(uColor, a); }`,
    });
    this.mistMat = mat;
    this.mist = [];
    for (const y of [-0.9, 0.6, 2.2]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), mat);
      m.position.y = y; m.renderOrder = 2; m.frustumCulled = false; m.layers.set(1);
      this.scene.add(m); this.mist.push(m);
    }
  }

  setDensity(d) { this.density = d; }

  update(dt, camera) {
    const g = this.game;
    const t = AtmosphereUniforms.uTime.value;
    const tod = g.timeOfDay.current;
    const night = tod.night, day = 1 - night;
    const cp = camera.position, pp = g.player.position;

    // birds
    for (let i = 0; i < this.birdCount; i++) {
      const b = this.birds[i];
      b.a += b.sp * dt;
      const x = b.cx + Math.cos(b.a) * b.r, z = b.cz + Math.sin(b.a) * b.r * (b.egret ? 0.3 : 1);
      const y = b.h + Math.sin(t * 0.5 + b.wob) * 3;
      const dir = this._p.set(-Math.sin(b.a) * Math.sign(b.sp), 0, Math.cos(b.a) * Math.sign(b.sp) * (b.egret ? 0.3 : 1)).normalize();
      this._q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      const s = b.scale * (night > 0.5 ? 0 : 1);
      this._s.setScalar(s);
      this._m.compose(new THREE.Vector3(x, y, z), this._q, this._s);
      this.birdMesh.setMatrixAt(i, this._m);
    }
    this.birdMesh.instanceMatrix.needsUpdate = true;

    // butterflies / dragonflies around the player (outdoors, daytime)
    const outdoors = g.audio.indoor < 0.5 && pp.y < 6;
    for (let i = 0; i < this.flyCount; i++) {
      const f = this.flies[i];
      f.t += dt;
      const far = f.p.distanceTo(pp) > 40;
      if (!f.alive || far) {
        if (day > 0.5 && outdoors && Math.random() < dt * 0.8) {
          const a = Math.random() * Math.PI * 2, r = 10 + Math.random() * 20;
          f.p.set(pp.x + Math.cos(a) * r, pp.y + 0.4 + Math.random() * 1.2, pp.z + Math.sin(a) * r);
          f.alive = true;
        } else { f.alive = false; f.p.y = -1000; }
      }
      if (f.alive) {
        const sp = f.dragon ? 3 : 0.9;
        f.v.x += (Math.sin(f.t * 0.7 + i) + Math.sin(f.t * 1.9 + i * 3) * 0.5) * dt * sp;
        f.v.z += (Math.cos(f.t * 0.6 + i * 2) + Math.cos(f.t * 2.3 + i) * 0.5) * dt * sp;
        f.v.y += (Math.sin(f.t * 1.3 + i * 5) * 0.8 - (f.p.y - pp.y - 1.0) * 0.6) * dt;
        f.v.multiplyScalar(0.97);
        f.p.addScaledVector(f.v, dt);
        if (day < 0.5) f.alive = false;
      }
      const dir = this._p.copy(f.v).setY(0);
      if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
      this._q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.normalize());
      this._s.setScalar(f.alive ? (f.dragon ? 1.3 : 1) : 0);
      this._m.compose(f.p, this._q, this._s);
      this.flyMesh.setMatrixAt(i, this._m);
    }
    this.flyMesh.instanceMatrix.needsUpdate = true;

    // particles follow the player
    this.fireflies.position.set(pp.x, pp.y - 0.5, pp.z);
    this.fireMat.uniforms.uAlpha.value = night * (outdoors ? 1 : 0.2);
    this.fireflies.visible = night > 0.05;
    this.gnats.position.set(pp.x + 3, pp.y + 0.8, pp.z - 2);
    this.gnatMat.uniforms.uAlpha.value = day * 0.25;
    this.gnats.visible = day > 0.1 && outdoors;

    // mist amount follows the atmosphere (strong at sunrise)
    const amt = THREE.MathUtils.clamp(AtmosphereUniforms.uMistDensity.value * 45, 0, 1);
    this.mistMat.uniforms.uAmt.value = amt;
    this.mistMat.uniforms.uColor.value.copy(g.scene.fog.color).lerp(AtmosphereUniforms.uSunFogColor.value, 0.25);
    for (const m of this.mist) { m.position.x = cp.x; m.position.z = cp.z; m.visible = amt > 0.02; }
  }
}
