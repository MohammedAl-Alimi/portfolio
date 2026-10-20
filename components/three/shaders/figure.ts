// GLSL for the hero figure: a point cloud bust that rotates, fogs, scans and glitches.
//
// Attributes (lib/figure-fx buildFigureAttributes):
//   aPos   xyz in -1..1 (int8 / 127 in the file)
//   aLum   0..1 photo luminance, already percentile stretched
//   aSeed  0..1 fixed per point
//   aKind  0 front shell, 1 back shell, 2 interior
// Uniforms, besides the wind set from shaders/wind.ts:
//   uYaw         continuous rotation about Y, radians
//   uOrbit       extra yaw from scroll (Task 5), 0 for now
//   uFog         0..1 strength of the depth fog
//   uScanY       world y of the scanline sweep
//   uGlitch      1 during a glitch slice, else 0
//   uGlitchSeed  0..1, new for every glitch
//   uGlitchBands three bands: x is the centre y, y the horizontal shift (lib/figure-fx glitchBands)
//   uPointScale  size multiplier from the slot height, uDpr device pixel ratio
//   uJitter      1 adds sub-quantisation jitter that hides the int8 depth layers
import { windDispGlsl, windUniformsGlsl } from "./wind";

export const figureVert = /* glsl */ `
${windUniformsGlsl}
#define BAND_HALF 0.04
uniform float uYaw;
uniform float uOrbit;
uniform float uGlitch;
uniform float uGlitchSeed;
uniform vec2 uGlitchBands[3];
uniform float uPointScale;
uniform float uDpr;
uniform float uJitter;

attribute vec3 aPos;
attribute float aLum;
attribute float aSeed;
attribute float aKind;

varying float vLum;
varying float vFacing;
varying float vDepth;
varying float vKind;
varying float vWorldY;

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

${windDispGlsl}

void main() {
  // The file stores xyz as int8, so points sit on 1/127 layers. A fixed random
  // offset under one step per axis breaks the layers up without moving the shape.
  vec3 j = vec3(hash(aSeed * 91.7), hash(aSeed * 47.3 + 3.1), hash(aSeed * 13.9 + 7.7)) - 0.5;
  vec3 p = aPos + j * (1.0 / 127.0) * uJitter;

  float a = uYaw + uOrbit;
  float c = cos(a);
  float s = sin(a);
  vec3 r = vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);

  vFacing = smoothstep(-0.2, 0.2, r.z);
  // 0 at the front of the head, 1 a full head depth behind it.
  vDepth = clamp(0.5 - r.z, 0.0, 1.0);

  // Wind in the camera plane, after the rotation, so a gust always pushes the way the pointer moved.
  float catchK = 0.5 + fract(aSeed * 13.73);
  r.xy += windDisp(r.xy, catchK);

  // Glitch slice: three horizontal bands jump sideways for 120 ms.
  if (uGlitch > 0.5) {
    for (int i = 0; i < 3; i++) {
      vec2 b = uGlitchBands[i];
      if (abs(r.y - b.x) < BAND_HALF) {
        r.x += b.y * (0.85 + 0.3 * hash(aSeed * 7.0 + uGlitchSeed * 101.0));
      }
    }
  }

  vLum = aLum;
  vKind = aKind;
  vWorldY = r.y;
  // Size from luminance, scaled for zoom and density, held to the spec's 1.5 to 3.5 CSS px.
  // Clamped in CSS px, not device px, so a retina screen gets the same coverage.
  gl_PointSize = clamp(mix(1.5, 3.5, aLum) * uPointScale, 1.5, 3.5) * uDpr;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(r, 1.0);
}
`;

export const figureFrag = /* glsl */ `
uniform float uFog;
uniform float uScanY;

varying float vLum;
varying float vFacing;
varying float vDepth;
varying float vKind;
varying float vWorldY;

void main() {
  // Brightness per kind, as the poster (scripts/figure/README.md).
  float b;
  if (vKind < 0.5) b = 0.12 + 0.88 * vLum;
  else if (vKind < 1.5) b = 0.08 + 0.30 * vLum;
  else b = 0.10 + 0.50 * vLum;
  b *= mix(0.25, 1.0, vFacing);
  b *= 1.0 - 0.5 * uFog * vDepth;
  // Scanline: a thin bright band sweeping up, soft at its edges.
  float d = abs(vWorldY - uScanY);
  b += 0.4 * (1.0 - smoothstep(0.012, 0.02, d));
  gl_FragColor = vec4(vec3(min(b, 1.0)), 1.0);
}
`;
