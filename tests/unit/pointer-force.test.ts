import { describe, expect, it } from "vitest";
import {
  breezeLevel,
  clientToSlot,
  pointerVelocity,
  pruneTrail,
  smoothPointer,
  tiltToPointer,
  TRAIL_MAX,
  TRAIL_TTL,
  WindTrail,
  windResponse,
  type TrailSample,
} from "@/lib/pointer-force";

const sample = (t: number, x = 0, y = 0): TrailSample => ({ x, y, vx: 0, vy: 0, t });

describe("smoothPointer", () => {
  it("moves part of the way toward the target", () => {
    const p = smoothPointer({ x: 0, y: 0 }, { x: 1, y: -1 }, 0.016);
    expect(p.x).toBeGreaterThan(0);
    expect(p.x).toBeLessThan(1);
    expect(p.y).toBeCloseTo(-p.x, 10);
  });

  it("converges on a still target", () => {
    let p = { x: 0, y: 0 };
    for (let i = 0; i < 60; i++) p = smoothPointer(p, { x: 0.5, y: 0.25 }, 1 / 60);
    expect(p.x).toBeCloseTo(0.5, 4);
    expect(p.y).toBeCloseTo(0.25, 4);
  });

  it("is dt-aware: one long step equals many short ones", () => {
    const one = smoothPointer({ x: 0, y: 0 }, { x: 1, y: 0 }, 0.06);
    let many = { x: 0, y: 0 };
    for (let i = 0; i < 6; i++) many = smoothPointer(many, { x: 1, y: 0 }, 0.01);
    expect(one.x).toBeCloseTo(many.x, 10);
    // 60 ms is one time constant: 1 - 1/e of the way there.
    expect(one.x).toBeCloseTo(1 - Math.exp(-1), 10);
  });

  it("holds still for a zero or negative dt", () => {
    expect(smoothPointer({ x: 0.2, y: 0.3 }, { x: 1, y: 1 }, 0)).toEqual({ x: 0.2, y: 0.3 });
    expect(smoothPointer({ x: 0.2, y: 0.3 }, { x: 1, y: 1 }, -1)).toEqual({ x: 0.2, y: 0.3 });
  });
});

describe("pointerVelocity", () => {
  it("has the sign and size of the motion per second", () => {
    const v = pointerVelocity({ x: 0, y: 0 }, { x: 0.1, y: -0.05 }, 0.05);
    expect(v.vx).toBeCloseTo(2, 10);
    expect(v.vy).toBeCloseTo(-1, 10);
  });

  it("is zero for a zero dt instead of infinite", () => {
    expect(pointerVelocity({ x: 0, y: 0 }, { x: 1, y: 1 }, 0)).toEqual({ vx: 0, vy: 0 });
  });
});

describe("clientToSlot", () => {
  const rect = { left: 100, top: 50, width: 400, height: 200 };
  it("maps the slot to -1..1 with y up", () => {
    expect(clientToSlot(100, 50, rect)).toEqual({ x: -1, y: 1 });
    expect(clientToSlot(300, 150, rect)).toEqual({ x: 0, y: 0 });
    expect(clientToSlot(500, 250, rect)).toEqual({ x: 1, y: -1 });
  });
});

describe("breezeLevel", () => {
  it("is zero while input is recent", () => {
    expect(breezeLevel(0)).toBe(0);
    expect(breezeLevel(1.99)).toBe(0);
  });

  it("eases from 0 to 1 between 2 s and 3 s", () => {
    expect(breezeLevel(2)).toBe(0);
    const a = breezeLevel(2.25);
    const b = breezeLevel(2.5);
    const c = breezeLevel(2.75);
    expect(a).toBeGreaterThan(0);
    expect(b).toBeCloseTo(0.5, 10);
    expect(c).toBeGreaterThan(b);
    expect(c).toBeLessThan(1);
    // Eased, not linear: slow at both ends.
    expect(a).toBeLessThan(0.25);
    expect(breezeLevel(3)).toBe(1);
    expect(breezeLevel(60)).toBe(1);
  });
});

describe("pruneTrail", () => {
  it("drops samples older than 1.5 s", () => {
    const now = 10;
    const kept = pruneTrail([sample(8), sample(8.49), sample(8.6), sample(9.9)], now);
    expect(kept.map((s) => s.t)).toEqual([8.6, 9.9]);
    expect(TRAIL_TTL).toBe(1.5);
  });

  it("caps at 16 and keeps the newest", () => {
    const many = Array.from({ length: 20 }, (_, i) => sample(9 + i * 0.01));
    const kept = pruneTrail(many, 9.5);
    expect(TRAIL_MAX).toBe(16);
    expect(kept).toHaveLength(16);
    expect(kept[0]?.t).toBeCloseTo(9.04, 10);
    expect(kept[15]?.t).toBeCloseTo(9.19, 10);
  });

  it("honours a smaller cap for software renderers", () => {
    const many = Array.from({ length: 10 }, (_, i) => sample(i * 0.1));
    expect(pruneTrail(many, 1, 6)).toHaveLength(6);
  });
});

describe("WindTrail", () => {
  it("spaces samples by the minimum interval, but always keeps a final one", () => {
    const trail = new WindTrail(16, 0.04);
    expect(trail.push(sample(1))).toBe(true);
    expect(trail.push(sample(1.01))).toBe(false);
    expect(trail.push(sample(1.05))).toBe(true);
    expect(trail.push(sample(1.06), true)).toBe(true);
    expect(trail.count).toBe(3);
    expect(trail.latestTime).toBeCloseTo(1.06, 10);
  });

  it("wakes listeners on a new sample and stops after unsubscribe", () => {
    const trail = new WindTrail();
    let calls = 0;
    const off = trail.subscribe(() => calls++);
    trail.push(sample(1));
    off();
    trail.push(sample(2));
    expect(calls).toBe(1);
  });

  it("prunes by age and cap", () => {
    const trail = new WindTrail(6, 0);
    for (let i = 0; i < 10; i++) trail.push(sample(i * 0.1));
    trail.prune(0.95);
    expect(trail.count).toBe(6);
    trail.prune(2.35);
    expect(trail.count).toBe(1);
  });
});

describe("windResponse", () => {
  it("starts at rest, so a new sample never makes pixels jump", () => {
    expect(windResponse(0)).toBe(0);
  });

  it("settles under 1% of its peak within 1.2 s", () => {
    let peak = 0;
    for (let t = 0; t < 0.5; t += 0.001) peak = Math.max(peak, Math.abs(windResponse(t)));
    for (let t = 1.2; t < 3; t += 0.001) expect(Math.abs(windResponse(t))).toBeLessThan(peak * 0.01);
  });
});

describe("tiltToPointer", () => {
  it("maps plus or minus 30 degrees to the slot edges", () => {
    expect(tiltToPointer(0, 0)).toEqual({ x: 0, y: 0 });
    expect(tiltToPointer(30, 0).x).toBeCloseTo(1, 10);
    expect(tiltToPointer(-15, 0).x).toBeCloseTo(-0.5, 10);
    // Tipping the top edge away (beta up) moves the pointer up.
    expect(tiltToPointer(0, 15).y).toBeCloseTo(0.5, 10);
  });

  it("clamps to -1..1", () => {
    expect(tiltToPointer(90, -90)).toEqual({ x: 1, y: -1 });
    expect(tiltToPointer(-200, 200)).toEqual({ x: -1, y: 1 });
  });

  it("treats a missing reading as level", () => {
    expect(tiltToPointer(Number.NaN, Number.NaN)).toEqual({ x: 0, y: 0 });
  });
});
