// The pointer wind, shared by every point cloud that reacts to the trail.
// Kept as GLSL strings so no loader config is needed.
//
// Uniforms (packed by components/three/useWindUniforms.ts):
//   uTime        seconds on the storm clock (lib/pointer-force stormNow), always advancing
//   uRadius      wind radius in world units (140 px / camera zoom)
//   uTrail[i]    pointer sample i: xy world position, z time taken, w speed (world units/s)
//   uTrailDir[i] unit direction the pointer moved at sample i
//   uTrailCount  samples in use (<= TRAIL)
//   uWindGain    displacement per unit of speed at the sample's centre
//   uDamping     envelope decay per second, uOmega angular frequency (rad/s)
//
// The response to each sample is closed form, so no state lives on the GPU:
//   disp += dir * A * exp(-uDamping * age) * sin(uOmega * age)
// a velocity kick into a damped spring. It starts at rest, so a new sample never
// makes points jump, and falls under 1% of its peak by 1.07 s (lib/pointer-force windResponse).

export const TRAIL_SLOTS = 16;

export const windUniformsGlsl = /* glsl */ `
#define TRAIL ${TRAIL_SLOTS}
#define MAX_DISP 0.35
uniform float uTime;
uniform float uRadius;
uniform vec4 uTrail[TRAIL];
uniform vec2 uTrailDir[TRAIL];
uniform int uTrailCount;
uniform float uWindGain;
uniform float uDamping;
uniform float uOmega;
`;

// Half a radial push away from each sample, half along the pointer's motion.
// Each point catches a different share of the gust (catchK), so the cloud
// scatters instead of shearing. The sum is capped at MAX_DISP.
export const windDispGlsl = /* glsl */ `
vec2 windDisp(vec2 target, float catchK) {
  vec2 disp = vec2(0.0);
  for (int i = 0; i < TRAIL; i++) {
    if (i >= uTrailCount) break;
    vec4 s = uTrail[i];
    vec2 d = target - s.xy;
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
  return disp;
}
`;
