import { describe, expect, it } from "vitest";
import { computeBudgets, FIRST_LOAD_LIMIT, THREE_LIMIT } from "../../scripts/check-chunk-budget.mjs";

const loadable = { "1": { id: 1, files: ["static/chunks/three.js"] } };
const firstLoad = [
  "static/chunks/a.js",
  "static/chunks/b.js",
  "static/chunks/a.js",
  "static/chunks/three.js",
  "static/css/x.css",
];
const sizes = (map: Record<string, number>) => (f: string) => map[f] ?? 0;

describe("computeBudgets", () => {
  it("splits first-load from 3d files and dedupes", () => {
    const r = computeBudgets({
      loadable,
      firstLoad,
      sizeOf: sizes({ "static/chunks/a.js": 100, "static/chunks/b.js": 50, "static/chunks/three.js": 900 }),
    });
    expect(r.firstLoadBytes).toBe(150);
    expect(r.threeBytes).toBe(900);
    expect(r.threeFiles).toEqual(["static/chunks/three.js"]);
    expect(r.ok).toBe(true);
  });
  it("flags a first-load breach", () => {
    const r = computeBudgets({
      loadable,
      firstLoad,
      sizeOf: sizes({ "static/chunks/a.js": FIRST_LOAD_LIMIT + 1 }),
    });
    expect(r.ok).toBe(false);
  });
  it("flags a 3d breach", () => {
    const r = computeBudgets({
      loadable,
      firstLoad,
      sizeOf: sizes({ "static/chunks/three.js": THREE_LIMIT + 1 }),
    });
    expect(r.ok).toBe(false);
  });
  it("passes exactly at the limits", () => {
    const r = computeBudgets({
      loadable,
      firstLoad,
      sizeOf: sizes({ "static/chunks/a.js": FIRST_LOAD_LIMIT, "static/chunks/three.js": THREE_LIMIT }),
    });
    expect(r.ok).toBe(true);
  });
});
