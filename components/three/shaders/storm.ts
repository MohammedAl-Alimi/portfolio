// GLSL for the pixel storm, kept as strings so no loader config is needed.
//
// Live uniforms:
//   uLive        1 while the idle shimmer runs, 0 holds the shimmer still
//   uPointSize   CSS px, uDpr device pixel ratio
//   wind uniforms (uTime, uTrail, ...) from shaders/wind.ts
//   uBreeze      0..1 strength of the idle breeze
//   uMorph       blends to aTarget2 (Task 5)
// uPointer, uPointerVel and uStiffness from Task 3 are gone: the trail replaces them.
//
// The response to each sample is closed form, so no state lives on the GPU:
//   disp += dir * A * exp(-uDamping * age) * sin(uOmega * age)
// a velocity kick into a damped spring. It starts at rest, so a new sample never
// makes pixels jump, and falls under 1% of its peak by 1.07 s (lib/pointer-force windResponse).

import { TRAIL_SLOTS, windDispGlsl, windUniformsGlsl } from "./wind";

export { TRAIL_SLOTS };

export const stormVert = /* glsl */ `
${windUniformsGlsl}
uniform float uLive;
uniform float uMorph;
uniform float uPointSize;
uniform float uDpr;
uniform float uBreeze;

attribute vec3 aTarget;
attribute vec3 aTarget2;
attribute float aSeed;
attribute vec3 aColor;

varying vec3 vColor;

${windDispGlsl}

void main() {
  vec3 target = mix(aTarget, aTarget2, uMorph);
  vec3 pos = target;
  float phase = aSeed * 6.2831853;
  pos.xy += uLive * 0.004 * vec2(sin(uTime * 1.3 + phase), cos(uTime * 1.1 + phase));

  // Wind (shaders/wind.ts): each pixel catches a different share of the gust.
  float catchK = 0.5 + fract(aSeed * 13.73);
  vec2 disp = windDisp(target.xy, catchK);
  float dl = length(disp);
  pos.xy += disp;

  // Breeze: a slow drift while nobody touches the storm.
  pos.xy += 0.012 * uBreeze * vec2(
    sin(uTime * 0.6 + phase + target.y * 3.0),
    cos(uTime * 0.5 + phase + target.x * 3.0)
  );

  // A few pixels a little bigger or smaller, so the word reads as squares, not a raster.
  float sizeJitter = 0.7 + 0.6 * fract(aSeed * 7.31);
  // Moving pixels grow a little, so a gust sparkles.
  float sparkle = 1.5 * clamp(dl / MAX_DISP, 0.0, 1.0);
  gl_PointSize = (uPointSize * sizeJitter + sparkle) * uDpr;
  // Brighten slightly as a point drifts, a hint of life in the idle state.
  float drift = 0.5 + 0.5 * sin(uTime * 0.9 + phase * 3.0);
  vColor = aColor * (0.94 + 0.06 * drift);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const stormFrag = /* glsl */ `
varying vec3 vColor;

void main() {
  vec2 c = gl_PointCoord;
  float edge = min(min(c.x, c.y), min(1.0 - c.x, 1.0 - c.y));
  float rim = 0.85 + 0.15 * step(0.1, edge);
  gl_FragColor = vec4(vColor * rim, 1.0);
}
`;
