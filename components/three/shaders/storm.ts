// GLSL for the pixel storm, kept as strings so no loader config is needed.
// uPointer, uPointerVel, uRadius, uStiffness and uDamping are declared now
// and used by the wind (Task 4). uMorph blends to aTarget2 (Task 5).

export const stormVert = /* glsl */ `
uniform float uTime;
uniform float uMorph;
uniform float uPointSize;
uniform float uDpr;
uniform vec2 uPointer;
uniform vec2 uPointerVel;
uniform float uRadius;
uniform float uStiffness;
uniform float uDamping;

attribute vec3 aTarget;
attribute vec3 aTarget2;
attribute float aSeed;
attribute vec3 aColor;

varying vec3 vColor;

void main() {
  vec3 target = mix(aTarget, aTarget2, uMorph);
  vec3 pos = target;
  float phase = aSeed * 6.2831853;
  pos.xy += 0.004 * vec2(sin(uTime * 1.3 + phase), cos(uTime * 1.1 + phase));
  // A few pixels a little bigger or smaller, so the word reads as squares, not a raster.
  float sizeJitter = 0.7 + 0.6 * fract(aSeed * 7.31);
  gl_PointSize = uPointSize * uDpr * sizeJitter;
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
