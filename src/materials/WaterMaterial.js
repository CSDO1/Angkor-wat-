import * as THREE from 'three';
import { NOISE_GLSL } from '../shaders/noise.glsl.js';
import { AtmosphereUniforms } from './WorldShading.js';

/**
 * Moat / reflecting-pond water. Uses a planar reflection texture when reflection quality allows it,
 * otherwise a sky-coloured fresnel. Gentle procedural ripples; calmer on the ponds.
 */
export function createWaterMaterial({ calm = 0, tint = 0x0b1a16 } = {}) {
  const uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      tReflection: { value: null },
      textureMatrix: { value: new THREE.Matrix4() },
      uHasReflection: { value: 0 },
      uWaterColor: { value: new THREE.Color(tint) },
      uSkyColor: { value: new THREE.Color(0.6, 0.7, 0.85) },
      uHorizon: { value: new THREE.Color(0.9, 0.75, 0.6) },
      uSunColor: { value: new THREE.Color(1, 0.8, 0.6) },
      uCalm: { value: calm },
    },
  ]);
  for (const k of Object.keys(AtmosphereUniforms)) uniforms[k] = AtmosphereUniforms[k];

  return new THREE.ShaderMaterial({
    uniforms,
    fog: true,
    transparent: false,
    vertexShader: /* glsl */ `
      uniform mat4 textureMatrix;
      varying vec4 vReflUv;
      varying vec3 vW;
      #include <fog_pars_vertex>
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vW = wp.xyz;
        vReflUv = textureMatrix * wp;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tReflection;
      uniform float uHasReflection;
      uniform vec3 uWaterColor, uSkyColor, uHorizon, uSunColor;
      uniform float uTime, uCalm, uWind;
      varying vec4 vReflUv;
      varying vec3 vW;
      ${NOISE_GLSL}
      #include <fog_pars_fragment>
      float waveH(vec2 p) {
        float t = uTime * (0.35 + 0.35 * (1.0 - uCalm));
        return vnoise2(p * 0.9 + vec2(t, t * 0.6)) * 0.5 + vnoise2(p * 2.3 - vec2(t * 0.8, -t)) * 0.3 + vnoise2(p * 6.0 + t * 1.7) * 0.2;
      }
      void main() {
        vec2 p = vW.xz;
        float amp = mix(0.09, 0.025, uCalm) * (0.6 + 0.4 * uWind);
        float e = 0.08;
        float h = waveH(p);
        vec3 n = normalize(vec3((h - waveH(p + vec2(e, 0.0))) * amp / e * 4.0, 1.0, (h - waveH(p + vec2(0.0, e))) * amp / e * 4.0));
        vec3 V = normalize(cameraPosition - vW);
        float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, V), 0.0), 5.0);
        vec3 R = reflect(-V, n);
        vec3 sky = mix(uHorizon, uSkyColor, clamp(R.y * 2.5, 0.0, 1.0));
        vec3 refl = sky;
        if (uHasReflection > 0.5) {
          vec4 uv = vReflUv; uv.xy += n.xz * 0.35 * uv.w * 0.25;
          refl = texture2DProj(tReflection, uv).rgb;
        }
        float spec = pow(max(dot(R, uSunDir), 0.0), 220.0) * 6.0 + pow(max(dot(R, uSunDir), 0.0), 18.0) * 0.25;
        vec3 deep = uWaterColor * (0.6 + 0.4 * max(dot(n, vec3(0.0, 1.0, 0.0)), 0.0));
        vec3 col = mix(deep, refl, clamp(fres * 1.0 + 0.25, 0.0, 1.0)) + uSunColor * spec * max(uSunDir.y + 0.05, 0.0) * 3.0;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}
