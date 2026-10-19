// Pure helpers and the shared pointer trail behind the storm's wind.
// The vertex shader cannot integrate a spring per point, so the CPU keeps the
// last few pointer samples and the shader sums a closed-form, damped response
// to each one (see components/three/shaders/wind.ts).
// No three.js and no React here: the hint and the tilt hook load it with the page.

export interface Vec {
  x: number;
  y: number;
}

/** One pointer sample in slot units: x and y in -1..1 with y up, velocity per second. */
export interface TrailSample {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds on the storm clock (stormNow). */
  t: number;
}

export interface SlotRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const TRAIL_MAX = 16;
export const TRAIL_MAX_SOFTWARE = 6;
/** A sample stops pushing pixels this long after it was taken. */
export const TRAIL_TTL = 1.5;
/** Pointer smoothing time constant, seconds. */
export const SMOOTH_TAU = 0.06;
/** Minimum spacing between samples. 16 samples then span about 0.64 s, so the
 * oldest has almost settled when it is evicted and its loss is invisible. */
export const SAMPLE_INTERVAL = 0.04;
export const SAMPLE_INTERVAL_SOFTWARE = 0.1;
/** The breeze starts this long after the last sample and takes BREEZE_RAMP to fade in. */
export const QUIET_AFTER = 2;
export const BREEZE_RAMP = 1;
/** Spring constants of the wind response, shared with the shader. */
export const WIND_DAMPING = 5;
export const WIND_OMEGA = 9;

const T0 = typeof performance === "undefined" ? 0 : performance.now();

/** Seconds since this module loaded. The storm's uTime runs on the same clock. */
export function stormNow(): number {
  return (performance.now() - T0) / 1000;
}

// Exponential smoothing that gives the same result for one long step as for many short ones.
export function smoothPointer(prev: Vec, next: Vec, dt: number, tau = SMOOTH_TAU): Vec {
  if (!(dt > 0)) return { x: prev.x, y: prev.y };
  const k = 1 - Math.exp(-dt / tau);
  return { x: prev.x + (next.x - prev.x) * k, y: prev.y + (next.y - prev.y) * k };
}

export function pointerVelocity(prev: Vec, next: Vec, dt: number): { vx: number; vy: number } {
  if (!(dt > 0)) return { vx: 0, vy: 0 };
  return { vx: (next.x - prev.x) / dt, vy: (next.y - prev.y) / dt };
}

// Client pixels to slot units: -1..1 across the slot, y up like the storm.
export function clientToSlot(clientX: number, clientY: number, rect: SlotRect): Vec {
  const x = rect.width > 0 ? ((clientX - rect.left) / rect.width) * 2 - 1 : 0;
  const y = rect.height > 0 ? 1 - ((clientY - rect.top) / rect.height) * 2 : 0;
  return { x, y };
}

// Breeze strength for how long the trail has been quiet: 0 until 2 s, eased to 1 at 3 s.
export function breezeLevel(quietFor: number): number {
  const t = Math.min(1, Math.max(0, (quietFor - QUIET_AFTER) / BREEZE_RAMP));
  return t * t * (3 - 2 * t);
}

// Moves value toward target with a time constant, frame-rate independent.
export function approach(value: number, target: number, dt: number, tau: number): number {
  if (!(dt > 0)) return value;
  return target + (value - target) * Math.exp(-dt / tau);
}

// Keeps samples younger than the TTL, newest last, at most `max` of them.
export function pruneTrail(
  samples: readonly TrailSample[],
  now: number,
  max = TRAIL_MAX,
  ttl = TRAIL_TTL,
): TrailSample[] {
  const fresh = samples.filter((s) => now - s.t <= ttl);
  return fresh.length > max ? fresh.slice(fresh.length - max) : fresh;
}

// Mirror of the shader's response to one sample of unit strength. A velocity
// kick into a damped spring: zero at the kick, peak near 0.12 s, under 1% of
// the peak (about 0.48) after ln(207)/5, about 1.07 s.
export function windResponse(age: number): number {
  if (age < 0) return 0;
  return Math.exp(-WIND_DAMPING * age) * Math.sin(WIND_OMEGA * age);
}

// Tilt in degrees to slot units. Plus or minus 30 degrees reaches the edges.
export function tiltToPointer(gamma: number, beta: number, range = 30): Vec {
  const clamp = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(-1, v / range)) : 0);
  return { x: clamp(gamma), y: clamp(beta) };
}

type Listener = () => void;

// The trail shared by the pointer hook, the tilt hook and the storm.
export class WindTrail {
  samples: TrailSample[] = [];
  /** Time of the newest sample, or the clock start, so the breeze begins 2 s after load. */
  latestTime = 0;
  private listeners = new Set<Listener>();

  constructor(
    public max = TRAIL_MAX,
    public minInterval = SAMPLE_INTERVAL,
  ) {}

  get count(): number {
    return this.samples.length;
  }

  /** Adds a sample unless it comes too soon after the last one. `force` always adds it. */
  push(sample: TrailSample, force = false): boolean {
    const last = this.samples[this.samples.length - 1];
    if (!force && last && sample.t - last.t < this.minInterval) return false;
    this.samples.push(sample);
    if (this.samples.length > this.max) this.samples.splice(0, this.samples.length - this.max);
    this.latestTime = sample.t;
    for (const l of this.listeners) l();
    return true;
  }

  prune(now: number): void {
    this.samples = pruneTrail(this.samples, now, this.max);
  }

  configure(max: number, minInterval: number): void {
    this.max = max;
    this.minInterval = minInterval;
    if (this.samples.length > max) this.samples.splice(0, this.samples.length - max);
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
}

export const windTrail = new WindTrail();
