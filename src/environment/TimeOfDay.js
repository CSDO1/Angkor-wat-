import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { AtmosphereUniforms } from '../materials/WorldShading.js';
import { lerp, smoothstep } from '../core/utils.js';

/**
 * Lighting presets. Compass azimuth in degrees (0 = north, 90 = east); the temple faces west.
 * Angkor Wat is at ~13.4° N, so the midday sun stands high and slightly south for much of the year.
 */
export const PRESETS = {
  sunrise: {
    az: 100, el: 5, sun: [1.0, 0.6, 0.34], sunI: 2.6, hemiSky: [0.42, 0.46, 0.6], hemiGround: [0.28, 0.2, 0.13], hemiI: 0.55,
    fog: [0.78, 0.62, 0.5], fogD: 0.0011, sunFog: [1.0, 0.64, 0.38], mist: 0.0075, mistFall: 0.3,
    turbidity: 9, rayleigh: 2.6, mie: 0.008, mieG: 0.86, exposure: 0.62, night: 0, wind: 0.5,
  },
  day: {
    az: 160, el: 62, sun: [1.0, 0.95, 0.87], sunI: 3.1, hemiSky: [0.55, 0.66, 0.85], hemiGround: [0.32, 0.27, 0.18], hemiI: 0.75,
    fog: [0.68, 0.76, 0.86], fogD: 0.00055, sunFog: [1.0, 0.95, 0.85], mist: 0.0012, mistFall: 0.25,
    turbidity: 4, rayleigh: 1.2, mie: 0.004, mieG: 0.8, exposure: 0.45, night: 0, wind: 1.0,
  },
  sunset: {
    az: 262, el: 7, sun: [1.0, 0.52, 0.24], sunI: 2.8, hemiSky: [0.46, 0.42, 0.55], hemiGround: [0.3, 0.2, 0.12], hemiI: 0.55,
    fog: [0.82, 0.58, 0.42], fogD: 0.0008, sunFog: [1.0, 0.56, 0.3], mist: 0.004, mistFall: 0.3,
    turbidity: 7, rayleigh: 2.2, mie: 0.006, mieG: 0.85, exposure: 0.55, night: 0, wind: 0.7,
  },
  night: {
    az: 210, el: 42, sun: [0.55, 0.66, 0.95], sunI: 0.42, hemiSky: [0.12, 0.16, 0.3], hemiGround: [0.05, 0.05, 0.07], hemiI: 0.45,
    fog: [0.045, 0.06, 0.1], fogD: 0.0012, sunFog: [0.12, 0.15, 0.25], mist: 0.008, mistFall: 0.3,
    turbidity: 2, rayleigh: 0.4, mie: 0.002, mieG: 0.7, exposure: 1.0, night: 1, wind: 0.35,
  },
};
const KEYS = ['el', 'sunI', 'hemiI', 'fogD', 'mist', 'mistFall', 'turbidity', 'rayleigh', 'mie', 'mieG', 'exposure', 'night', 'wind'];
const COLS = ['sun', 'hemiSky', 'hemiGround', 'fog', 'sunFog'];

export function compassToDir(azDeg, elDeg, out = new THREE.Vector3()) {
  const az = THREE.MathUtils.degToRad(azDeg), el = THREE.MathUtils.degToRad(elDeg);
  // Blender: north = -X, east = +Y  ->  three: x = -cos(az), z = -sin(az)
  return out.set(-Math.cos(az) * Math.cos(el), Math.sin(el), -Math.sin(az) * Math.cos(el)).normalize();
}

export class TimeOfDay {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.sky = new Sky();
    this.sky.scale.setScalar(20000);
    this.sky.material.depthWrite = false;
    scene.add(this.sky);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 3);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.04;
    scene.add(this.sunLight, this.sunLight.target);
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    scene.add(this.hemi);
    scene.fog = new THREE.FogExp2(0xffffff, 0.001);

    this.current = { ...structuredClone(PRESETS.sunrise), az: PRESETS.sunrise.az };
    this.from = null; this.to = null; this.t = 1; this.duration = 1;
    this.name = 'sunrise';
    this.sunDir = new THREE.Vector3();
    this.info = { zenith: new THREE.Color(), horizon: new THREE.Color(), sunColor: new THREE.Color() };

    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.envScene = new THREE.Scene();
    this.envSky = new Sky(); this.envSky.scale.setScalar(1000);
    this.envScene.add(this.envSky);
    this.envTimer = 0;
    this.envTarget = null;

    this._buildStars();
    this.apply(true);
  }

  _buildStars() {
    const n = 2200, pos = new Float32Array(n * 3), size = new Float32Array(n);
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      const u = rnd(), v = rnd() * 0.95 + 0.05;
      const th = u * Math.PI * 2, y = v;
      const r = Math.sqrt(1 - y * y);
      pos.set([Math.cos(th) * r * 9000, y * 9000, Math.sin(th) * r * 9000], i * 3);
      size[i] = 0.6 + Math.pow(rnd(), 6) * 3.5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('size', new THREE.BufferAttribute(size, 1));
    this.starMat = new THREE.ShaderMaterial({
      uniforms: { uAlpha: { value: 0 }, uTime: AtmosphereUniforms.uTime },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute float size; varying float vS; uniform float uTime;
        void main(){ vS = size; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = size * (1.0 + 0.25 * sin(uTime * 2.0 + position.x)); }`,
      fragmentShader: `uniform float uAlpha; varying float vS;
        void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vec3(0.85, 0.9, 1.0) * a * uAlpha * (0.5 + vS * 0.3), 1.0); }`,
    });
    this.stars = new THREE.Points(g, this.starMat);
    this.stars.frustumCulled = false;
    this.stars.renderOrder = -2;
    this.scene.add(this.stars);

    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe8ecff, transparent: true, opacity: 0, fog: false, depthWrite: false });
    this.moon = new THREE.Mesh(new THREE.CircleGeometry(95, 32), moonMat);
    this.moon.renderOrder = -1;
    this.scene.add(this.moon);
  }

  /** Smoothly move to another preset. Default transitions are deliberately slow. */
  setPreset(name, seconds = 40) {
    if (!PRESETS[name]) return;
    this.name = name;
    this.from = structuredClone(this.current);
    this.to = PRESETS[name];
    this.t = 0; this.duration = Math.max(0.001, seconds);
  }

  update(dt, camera, followTarget) {
    AtmosphereUniforms.uTime.value += dt;
    this.sky.material.uniforms.time.value += dt;
    if (this.to && this.t < 1) {
      this.t = Math.min(1, this.t + dt / this.duration);
      const k = smoothstep(0, 1, this.t);
      for (const key of KEYS) this.current[key] = lerp(this.from[key], this.to[key], k);
      for (const key of COLS) this.current[key] = this.from[key].map((v, i) => lerp(v, this.to[key][i], k));
      let da = this.to.az - this.from.az;
      if (Math.abs(da) > 180) da -= Math.sign(da) * 360;
      this.current.az = this.from.az + da * k;
      // pass the sun through the sky rather than jumping when crossing night
      if (this.from.night !== this.to.night) this.current.el = lerp(this.from.el, this.to.el, k) - Math.sin(k * Math.PI) * 10;
      this.apply(false);
      this.envTimer -= dt;
      if (this.envTimer <= 0) { this.updateEnvironment(); this.envTimer = 1.5; }
    }
    // keep the shadow frustum centred on the player
    if (followTarget) {
      const L = this.sunLight;
      L.target.position.copy(followTarget);
      L.position.copy(followTarget).addScaledVector(this.sunDir, 250);
      L.target.updateMatrixWorld();
    }
    if (camera) {
      const d = camera.far * 0.85;
      this.stars.position.copy(camera.position);
      this.stars.scale.setScalar(d / 9000);
      this.moon.position.copy(camera.position).addScaledVector(this.sunDir, d);
      this.moon.scale.setScalar(d / 8000);
      this.moon.lookAt(camera.position);
    }
  }

  apply(force) {
    const c = this.current;
    const night = c.night;
    const sunDir = compassToDir(c.az, Math.max(c.el, -8), this.sunDir);
    const u = this.sky.material.uniforms;
    u.turbidity.value = c.turbidity; u.rayleigh.value = c.rayleigh;
    u.mieCoefficient.value = c.mie; u.mieDirectionalG.value = c.mieG;
    u.cloudCoverage.value = lerp(0.32, 0.18, night); u.cloudDensity.value = lerp(0.35, 0.15, night);
    u.showSunDisc.value = night > 0.5 ? 0 : 1;
    // at night the "sun" light is the moon; the sky model gets a sun well below the horizon
    const skySun = night > 0.5 ? compassToDir(c.az + 180, -12) : sunDir;
    u.sunPosition.value.copy(skySun);
    this.sky.visible = true;

    this.sunLight.color.setRGB(...c.sun);
    this.sunLight.intensity = c.sunI * smoothstep(-3, 3, c.el);
    this.hemi.color.setRGB(...c.hemiSky);
    this.hemi.groundColor.setRGB(...c.hemiGround);
    this.hemi.intensity = c.hemiI;
    this.scene.fog.color.setRGB(...c.fog);
    this.scene.fog.density = c.fogD;
    this.renderer.toneMappingExposure = c.exposure * (this.brightness ?? 1);
    AtmosphereUniforms.uSunDir.value.copy(sunDir);
    AtmosphereUniforms.uSunFogColor.value.setRGB(...c.sunFog);
    AtmosphereUniforms.uMistDensity.value = c.mist * (this.mistScale ?? 1);
    AtmosphereUniforms.uMistFalloff.value = c.mistFall;
    AtmosphereUniforms.uWind.value = c.wind;
    this.starMat.uniforms.uAlpha.value = night;
    this.moon.material.opacity = night;

    this.info.sunColor.setRGB(...c.sun).multiplyScalar(smoothstep(-3, 3, c.el));
    this.info.horizon.setRGB(...c.fog);
    this.info.zenith.setRGB(...c.hemiSky).multiplyScalar(night > 0.5 ? 0.3 : 1.0);
    if (force) this.updateEnvironment();
  }

  updateEnvironment() {
    const src = this.sky.material.uniforms, dst = this.envSky.material.uniforms;
    for (const k of ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG', 'cloudCoverage', 'cloudDensity']) dst[k].value = src[k].value;
    dst.showSunDisc.value = 0;
    dst.sunPosition.value.copy(src.sunPosition.value);
    const prev = this.envTarget;
    this.envTarget = this.pmrem.fromScene(this.envScene, 0, 1, 2000);
    this.scene.environment = this.envTarget.texture;
    this.scene.environmentIntensity = this.current.night > 0.5 ? 0.25 : 0.55;
    prev?.dispose();
  }

  setShadowQuality(q) {
    const L = this.sunLight;
    if (!q) { L.castShadow = false; return; }
    L.castShadow = true;
    const size = [0, 1024, 2048, 4096][q];
    const ext = [0, 45, 65, 90][q];
    L.shadow.mapSize.set(size, size);
    const cam = L.shadow.camera;
    cam.left = -ext; cam.right = ext; cam.top = ext; cam.bottom = -ext; cam.near = 1; cam.far = 600;
    cam.updateProjectionMatrix();
    L.shadow.map?.dispose(); L.shadow.map = null;
  }
}
