import * as THREE from 'three';
import { NOISE_GLSL } from '../shaders/noise.glsl.js';
import { AtmosphereUniforms, worldMaterial } from './WorldShading.js';

/**
 * In-game replacements for the Blender procedural materials. The exporter writes per-vertex
 * data into COLOR_0: r = baked ambient occlusion, g = per-block random, b = stone material id.
 * Colours follow the ramps defined in angkor_wat/build_angkor.py.
 */
const STONE_GLSL = /* glsl */ `
${NOISE_GLSL}
uniform sampler2D uRosette;
varying vec3 vWPos;
varying vec3 vWNrm;
vec3 stoneBase(int id, float br) {
  vec3 lo, hi;
  if (id == 6)      { lo = vec3(0.16, 0.075, 0.037); hi = vec3(0.30, 0.16, 0.085); }   // laterite
  else if (id == 5) { lo = vec3(0.11, 0.10, 0.085); hi = vec3(0.30, 0.25, 0.185); }   // roof
  else if (id == 4) { lo = vec3(0.24, 0.205, 0.16); hi = vec3(0.44, 0.36, 0.25); }    // paving
  else if (id == 7) { return vec3(0.014, 0.012, 0.01); }                              // doorway shadow
  else if (id == 1) { lo = vec3(0.20, 0.165, 0.12); hi = vec3(0.38, 0.30, 0.21); }    // bas-relief
  else              { lo = vec3(0.21, 0.185, 0.15); hi = vec3(0.42, 0.33, 0.215); }   // sandstone
  return mix(lo, hi, br);
}
`;

export function createStoneMaterial(rosetteTex) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 });
  return worldMaterial(m, (shader) => {
    shader.uniforms.uRosette = { value: rosetteTex };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNrm;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vWNrm = normalize(mat3(modelMatrix) * objectNormal);`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uAOStrength;\nuniform float uDetail;\n${STONE_GLSL}`)
      .replace('#include <color_fragment>', `
        float ao = vColor.r;
        int sid = int(vColor.b * 255.0 + 0.5);
        vec3 wp = vWPos;
        vec3 wn = normalize(vWNrm);
        float nL = fbm3(wp * 0.35);
        float nM = vnoise(wp * 2.2);
        float fac = clamp(0.22 * vColor.g + 0.22 * nL + 0.06 * nM + 0.4, 0.0, 1.0);
        vec3 col = stoneBase(sid, fac);
        float vertical = 1.0 - abs(wn.y);
        // horizontal courses of sandstone blocks on walls (ashlar); geometry carries the big blocks
        float course = floor(wp.y / 0.46);
        float joint = 0.0;
        if (sid <= 3 && vertical > 0.6) {
          float fy = abs(fract(wp.y / 0.46) - 0.5);
          float along = dot(wp.xz, normalize(vec2(-wn.z, wn.x) + 1e-4));
          float fx = abs(fract(along / 1.1 + hash12(vec2(course, 3.7)) ) - 0.5);
          joint = max(smoothstep(0.47, 0.5, fy), smoothstep(0.485, 0.5, fx)) * uDetail;
          col *= 0.86 + 0.22 * hash12(vec2(course, floor(along / 1.1 + hash12(vec2(course, 3.7)))));
        }
        col *= 1.0 - joint * 0.35;
        // lichen / biofilm patches, darker low down and on sheltered faces
        float lichen = smoothstep(0.52, 0.78, fbm3(wp * 0.09 + 3.1) + 0.22 * (1.0 - clamp((wp.y + 1.0) * 0.07, 0.0, 1.0)) + (1.0 - ao) * 0.25);
        col = mix(col, col * vec3(0.42, 0.45, 0.37), lichen * 0.6);
        // rain streaks on vertical faces
        float streak = vnoise(vec3(dot(wp.xz, vec2(3.1, 2.7)), wp.y * 0.18, 1.3));
        col *= 1.0 - vertical * smoothstep(0.6, 0.95, streak) * 0.28;
        col *= mix(1.0, ao, uAOStrength);
        diffuseColor.rgb = col;
      `)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(0.82 + 0.1 * nM - 0.08 * lichen, 0.6, 1.0);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          float hgt = vnoise(wp * 4.0) * 0.06 * uDetail - joint * 0.25;
          // carved rosette / relief detail on vertical relief faces
          if ((sid == 1 || sid == 2) && vertical > 0.7 && uDetail > 0.5) {
            vec2 ruv = vec2(dot(wp.xz, normalize(vec2(-wn.z, wn.x) + 1e-4)), wp.y) / 0.62;
            vec3 rn = texture2D(uRosette, ruv).xyz * 2.0 - 1.0;
            vec3 T = normalize(cross(vec3(0.0, 1.0, 0.0), wn));
            vec3 wN2 = normalize(wn + (T * rn.x + vec3(0.0, 1.0, 0.0) * rn.y) * 0.6);
            normal = normalize(mix(normal, (viewMatrix * vec4(wN2, 0.0)).xyz, 0.6));
          }
          vec3 sp = -vViewPosition;
          vec3 sx = dFdx(sp), sy = dFdy(sp);
          float dHx = dFdx(hgt), dHy = dFdy(hgt);
          vec3 R1 = cross(sy, normal), R2 = cross(normal, sx);
          float det = dot(sx, R1) * faceDirection;
          vec3 grad = sign(det) * (dHx * R1 + dHy * R2);
          normal = normalize(abs(det) * normal - grad);
        }`)
      .replace('#include <aomap_fragment>', `#include <aomap_fragment>
        reflectedLight.indirectDiffuse *= mix(1.0, ao * ao, uAOStrength);
        reflectedLight.indirectSpecular *= mix(1.0, ao, uAOStrength);`);
  }, 'stone');
}

export function createGroundMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  return worldMaterial(m, (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>\n vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${NOISE_GLSL}\nvarying vec3 vWPos;\nuniform float uDetail;`)
      .replace('#include <color_fragment>', `
        vec2 gp = vWPos.xz;
        float n1 = fbm2(gp * 0.035);
        float n2 = vnoise2(gp * 0.6);
        float n3 = vnoise2(gp * 4.0);
        vec3 lush = vec3(0.055, 0.10, 0.022);
        vec3 dry = vec3(0.19, 0.16, 0.07);
        vec3 soil = vec3(0.17, 0.115, 0.065);
        vec3 col = mix(lush, dry, smoothstep(0.35, 0.75, n1 + 0.15 * n2));
        // worn earth along the approach axis and around the terrace
        float path = (1.0 - smoothstep(9.0, 16.0, abs(vWPos.x))) * step(vWPos.z, 470.0);
        float soilMask = clamp(smoothstep(0.62, 0.8, n2 * 0.6 + n1 * 0.5) + path * 0.45, 0.0, 1.0);
        col = mix(col, soil, soilMask);
        col *= 0.8 + 0.35 * n3 * uDetail;
        diffuseColor.rgb = col;
      `)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n roughnessFactor = 0.92;`);
  }, 'ground');
}

const FOLIAGE_COLORS = {
  Foliage_Palm: [0x2a4a12, 0x40541c], Foliage_Tropical: [0x1d3a0e, 0x375020], Foliage_Dry_Frond: [0x5c4020, 0x7a5a2c],
  Grass_Blades: [0x1a3409, 0x3f5c16], Foliage_Undergrowth: [0x1e3c10, 0x3a5a1a], Lotus_Leaf: [0x245a1c, 0x3c7424],
  Lotus_Petal: [0xd889a0, 0xf2c4cc], Foliage_Distant_Forest: [0x16280e, 0x24361a], Bark_Palm: [0x3a3128, 0x6a5a48],
  Bark_Tree: [0x2c241c, 0x4e4234],
};

/**
 * Instanced foliage with wind sway. COLOR_0.r = normalised height inside the plant, so only the
 * upper parts move. Instance colour (if present) tints individual plants.
 */
export function createFoliageMaterial(name, { sway = 1, flutter = 1 } = {}) {
  const [c0, c1] = FOLIAGE_COLORS[name] ?? [0x2a4a12, 0x40541c];
  const isBark = name.startsWith('Bark');
  const m = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: isBark ? 0.95 : 0.72, metalness: 0,
    side: isBark ? THREE.FrontSide : THREE.DoubleSide,
  });
  return worldMaterial(m, (shader) => {
    shader.uniforms.uC0 = { value: new THREE.Color(c0) };
    shader.uniforms.uC1 = { value: new THREE.Color(c1) };
    shader.uniforms.uSway = { value: isBark ? sway * 0.4 : sway };
    shader.uniforms.uFlutter = { value: isBark ? 0 : flutter };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec4 color;
        uniform float uTime; uniform float uWind; uniform float uSway; uniform float uFlutter;
        varying float vH; varying float vVar;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vH = color.r; vVar = color.g;
        vec3 ip = vec3(0.0);
        #ifdef USE_INSTANCING
          ip = instanceMatrix[3].xyz;
        #endif
        float ph = ip.x * 0.071 + ip.z * 0.053;
        float h2 = color.r * color.r;
        float gust = 0.6 + 0.4 * sin(uTime * 0.23 + ip.x * 0.01);
        transformed.x += sin(uTime * 1.1 + ph) * h2 * 0.35 * uSway * uWind * gust;
        transformed.z += cos(uTime * 0.9 + ph * 1.3) * h2 * 0.25 * uSway * uWind * gust;
        transformed.y += sin(uTime * 4.1 + position.x * 3.0 + position.z * 2.0 + ph) * color.r * 0.04 * uFlutter * uWind;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform vec3 uC0; uniform vec3 uC1; varying float vH; varying float vVar;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb *= mix(uC0, uC1, clamp(vVar * 0.6 + vH * 0.5, 0.0, 1.0)) * (0.75 + 0.35 * vH);`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        // cheap translucency: leaves glow a little when back-lit
        reflectedLight.indirectDiffuse += diffuseColor.rgb * 0.08;`);
  }, 'foliage_' + name);
}

export function createSimpleWorldMaterial(params) {
  return worldMaterial(new THREE.MeshStandardMaterial(params));
}

export { AtmosphereUniforms };
