import * as THREE from 'three';

/**
 * Global atmosphere: replaces three.js' fog chunks with distance fog + low-lying morning mist
 * (height fog) + sun in-scattering. Every material created through `worldMaterial()` shares
 * these uniforms so the time-of-day system can drive them from one place.
 */
export const AtmosphereUniforms = {
  uSunDir: { value: new THREE.Vector3(0, 0.2, -1).normalize() },
  uSunFogColor: { value: new THREE.Color(1.0, 0.7, 0.45) },
  uMistDensity: { value: 0.01 },
  uMistFalloff: { value: 0.35 },
  uMistBase: { value: -1.0 },
  uTime: { value: 0 },
  uWind: { value: 1 },
  uAOStrength: { value: 1 },
  uDetail: { value: 1 },
};

let installed = false;
export function installAtmosphereChunks() {
  if (installed) return;
  installed = true;
  const S = THREE.ShaderChunk;
  S.fog_pars_vertex = `
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogWorld;
#endif`;
  S.fog_vertex = `
#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  vFogWorld = (inverse(viewMatrix) * mvPosition).xyz;
#endif`;
  S.fog_pars_fragment = `
#ifdef USE_FOG
  uniform vec3 fogColor;
  varying float vFogDepth;
  varying vec3 vFogWorld;
  uniform vec3 uSunDir;
  uniform vec3 uSunFogColor;
  uniform float uMistDensity;
  uniform float uMistFalloff;
  uniform float uMistBase;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear;
    uniform float fogFar;
  #endif
#endif`;
  S.fog_fragment = `
#ifdef USE_FOG
  vec3 fogRay = vFogWorld - cameraPosition;
  float fogDist = max(length(fogRay), 1e-3);
  #ifdef FOG_EXP2
    float fogAmt = 1.0 - exp(- fogDensity * fogDensity * fogDist * fogDist);
  #else
    float fogAmt = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
  float mk = max(uMistFalloff, 1e-3);
  float h0 = cameraPosition.y - uMistBase;
  float h1 = vFogWorld.y - uMistBase;
  float dh = h1 - h0;
  float mistInt = abs(dh) > 0.02 ? (exp(-mk * max(h0, 0.0)) - exp(-mk * max(h1, 0.0))) / (mk * dh) : exp(-mk * max(h0, 0.0));
  float mist = 1.0 - exp(- uMistDensity * fogDist * clamp(mistInt, 0.0, 1.0));
  fogAmt = 1.0 - (1.0 - fogAmt) * (1.0 - mist);
  float sunAmt = pow(max(dot(fogRay / fogDist, uSunDir), 0.0), 6.0);
  vec3 fogCol = mix(fogColor, uSunFogColor, sunAmt * 0.85);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogCol, clamp(fogAmt, 0.0, 1.0));
#endif`;
}

/**
 * Wraps a material so it receives the shared atmosphere uniforms, then runs an optional extra
 * onBeforeCompile hook. `key` keeps the program cache correct for customised shaders.
 */
export function worldMaterial(material, hook, key = '') {
  material.onBeforeCompile = (shader, renderer) => {
    Object.assign(shader.uniforms, AtmosphereUniforms);
    hook?.(shader, renderer);
  };
  if (key) material.customProgramCacheKey = () => key;
  return material;
}
