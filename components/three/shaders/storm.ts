// GLSL for the pixel storm, kept as strings so no loader config is needed.
//
// Live uniforms:
//   uTime        seconds on the storm clock (lib/pointer-force stormNow), always advancing
//   uLive        1 while the idle shimmer runs, 0 holds the shimmer still
//   uPointSize   CSS px, uDpr device pixel ratio
//   uRadius      wind radius in world units (140 px / camera zoom)
//   uTrail[i]    pointer sample i: xy world position, z time taken, w speed (world units/s)
//   uTrailDir[i] unit direction the pointer moved at sample i
//   uTrailCount  samples in use (<= TRAIL)
//   uWindGain    displacement per unit of speed at the sample's centre
//   uDamping     envelope decay per second, uOmega angular frequency (rad/s)
//   uBreeze      0..1 strength of the idle breeze
//   uMorph       blends to aTarget2 (Task 5)
// uPointer, uPointerVel and uStiffness from Task 3 are gone: the trail replaces them.
//
// The response to each sample is closed form, so no state lives on the GPU:
//   disp += dir * A * exp(-uDamping * age) * sin(uOmega * age)
// a velocity kick into a damped spring. It starts at rest, so a new sample never
// makes pixels jump, and falls under 1% of its peak by 1.07 s (lib/pointer-force windResponse).

export const TRAIL_SLOTS = 16;

export const stormVert = /* glsl */ `
#define TRAIL ${TRAIL_SLOTS}
#define MAX_DISP 0.35
uniform float uTime;
uniform float uLive;
uniform float uMorph;
uniform float uPointSize;
uniform float uDpr;
uniform float uRadius;
uniform vec4 uTrail[TRAIL];
uniform vec2 uTrailDir[TRAIL];
uniform int uTrailCount;
uniform float uWindGain;
uniform float uDamping;
uniform float uOmega;
uniform float uBreeze;

attribute vec3 aTarget;
attribute vec3 aTarget2;
attribute float aSeed;
attribute vec3 aColor;

varying vec3 vColor;

void main() {
  vec3 target = mix(aTarget, aTarget2, uMorph);
  vec3 pos = target;
  float phase = aSeed * 6.2831853;
  pos.xy += uLive * 0.004 * vec2(sin(uTime * 1.3 + phase), cos(uTime * 1.1 + phase));

  // Wind: half a radial push away from each sample, half along the pointer's motion.
  // Each pixel catches a different share of the gust, so the word scatters instead of shearing.
  float catchK = 0.5 + fract(aSeed * 13.73);
  vec2 disp = vec2(0.0);
  for (int i = 0; i < TRAIL; i++) {
    if (i >= uTrailCount) break;
    vec4 s = uTrail[i];
    vec2 d = target.xy - s.xy;
    float dist = length(d);
    if (dist < uRadius) {
      float fall = 1.0 - smoothstep(0.0, uRadius, dist);
      float amp = fall * min(s.w, 3.0) * uWindGain * catchK;
      vec2 radial = dist > 1e-5 ? d / dist : uTrailDir[i];
      vec2 m = mix(radial, uTrailDir[i], 0.5);
      float ml = length(m);
      vec2 dir = ml > 1e-5 ? m / ml : radial;
      float age = max(uTime - s.z, 0.0);
      disp += dir * amp * exp(-uDamping * age) * sin(uOmega * age);
    }
  }
  float dl = length(disp);
  if (dl > MAX_DISP) disp *= MAX_DISP / dl;
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
