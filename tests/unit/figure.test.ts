import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FigureFormatError,
  loadFigure,
  parseFigure,
  subsample,
  type Figure,
} from "@/lib/figure";
import { makeTiny, TINY_POINTS } from "../fixtures/figure/make-tiny.mjs";

const TINY = TINY_POINTS;

function tinyBuffer(): ArrayBuffer {
  const file = readFileSync(path.resolve(__dirname, "../fixtures/figure/tiny.bin"));
  return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
}

function makeBuffer(count: number, records = count, magic = "MA01"): ArrayBuffer {
  const buf = new ArrayBuffer(8 + records * 4);
  const view = new DataView(buf);
  for (let i = 0; i < 4; i++) view.setUint8(i, magic.charCodeAt(i));
  view.setUint32(4, count, true);
  for (let i = 0; i < records; i++) {
    // The index is recoverable from y and luminance: i = (y + 127) * 256 + lum.
    view.setInt8(8 + i * 4, (i % 255) - 127);
    view.setInt8(9 + i * 4, Math.floor(i / 256) - 127);
    view.setInt8(10 + i * 4, 0);
    view.setUint8(11 + i * 4, i % 256);
  }
  return buf;
}

describe("parseFigure", () => {
  it("reads the count, positions and luminance of the fixture", () => {
    const fig = parseFigure(tinyBuffer());
    expect(fig.count).toBe(8);
    expect(fig.positions).toBeInstanceOf(Float32Array);
    expect(fig.positions).toHaveLength(24);
    expect(fig.luminance).toBeInstanceOf(Uint8Array);
    expect(Array.from(fig.luminance)).toEqual(TINY.map((p) => p[3]));
    TINY.forEach(([x, y, z], i) => {
      expect(fig.positions[i * 3]).toBeCloseTo(x / 127, 6);
      expect(fig.positions[i * 3 + 1]).toBeCloseTo(y / 127, 6);
      expect(fig.positions[i * 3 + 2]).toBeCloseTo(z / 127, 6);
    });
    expect(fig.positions[0]).toBe(-1);
    expect(fig.positions[3]).toBe(1);
  });

  it("rejects a bad magic", () => {
    expect(() => parseFigure(makeBuffer(4, 4, "MA02"))).toThrow(FigureFormatError);
  });

  it("rejects a truncated file", () => {
    expect(() => parseFigure(tinyBuffer().slice(0, 8 + 7 * 4 + 2))).toThrow(FigureFormatError);
    expect(() => parseFigure(new ArrayBuffer(6))).toThrow(FigureFormatError);
  });

  it("rejects trailing bytes", () => {
    expect(() => parseFigure(makeBuffer(4, 5))).toThrow(FigureFormatError);
  });

  it("rejects a count of zero", () => {
    expect(() => parseFigure(makeBuffer(0))).toThrow(FigureFormatError);
  });
});

describe("fixtures", () => {
  it("tiny.bin matches its generator", () => {
    const committed = readFileSync(path.resolve(__dirname, "../fixtures/figure/tiny.bin"));
    expect(Buffer.compare(makeTiny(), committed)).toBe(0);
  });

  it("parses the shipped figure", () => {
    const file = readFileSync(path.resolve(__dirname, "../../public/figure/bust.bin"));
    expect(file.byteLength).toBeLessThanOrEqual(256000);
    const fig = parseFigure(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength));
    expect(fig.count).toBe(56000);
    let min = Infinity;
    let max = -Infinity;
    for (const v of fig.positions) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    expect(min).toBeGreaterThanOrEqual(-1);
    expect(max).toBeLessThanOrEqual(1);
  });
});

describe("subsample", () => {
  const fig = parseFigure(makeBuffer(1000));

  it("returns exactly the requested count", () => {
    const sub = subsample(fig, 300, 7);
    expect(sub.count).toBe(300);
    expect(sub.positions).toHaveLength(900);
    expect(sub.luminance).toHaveLength(300);
  });

  it("is deterministic for a seed and differs across seeds", () => {
    const a = subsample(fig, 300, 7);
    const b = subsample(fig, 300, 7);
    const c = subsample(fig, 300, 8);
    expect(Array.from(a.luminance)).toEqual(Array.from(b.luminance));
    expect(Array.from(a.positions)).toEqual(Array.from(b.positions));
    expect(Array.from(a.luminance)).not.toEqual(Array.from(c.luminance));
  });

  it("keeps each point's position and luminance together, without repeats", () => {
    const sub = subsample(fig, 300, 7);
    const seen = new Set<number>();
    for (let k = 0; k < sub.count; k++) {
      const y = Math.round((sub.positions[k * 3 + 1] ?? 0) * 127);
      const index = (y + 127) * 256 + (sub.luminance[k] ?? 0);
      expect(index).toBeLessThan(1000);
      expect(Math.round((sub.positions[k * 3] ?? 0) * 127)).toBe((index % 255) - 127);
      expect(seen.has(index)).toBe(false);
      seen.add(index);
    }
  });

  it("returns the figure itself when the count is not smaller", () => {
    expect(subsample(fig, 1000, 7)).toBe(fig);
    expect(subsample(fig, 5000, 7)).toBe(fig);
  });
});

describe("loadFigure", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(impl: () => Promise<Response>) {
    const fn = vi.fn(impl);
    vi.stubGlobal("fetch", fn);
    return fn;
  }

  it("fetches with force-cache and subsamples to the count", async () => {
    const fn = stubFetch(async () => new Response(tinyBuffer(), { status: 200 }));
    const fig = (await loadFigure("/figure/bust.bin", { count: 4 })) as Figure;
    expect(fn).toHaveBeenCalledWith(
      "/figure/bust.bin",
      expect.objectContaining({ cache: "force-cache" }),
    );
    expect(fig.count).toBe(4);
  });

  it("passes the abort signal through", async () => {
    const fn = stubFetch(async () => new Response(tinyBuffer(), { status: 200 }));
    const controller = new AbortController();
    await loadFigure("/figure/bust.bin", { count: 8, signal: controller.signal });
    expect(fn).toHaveBeenCalledWith(
      "/figure/bust.bin",
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("returns null on a 404", async () => {
    stubFetch(async () => new Response("nope", { status: 404 }));
    await expect(loadFigure("/figure/bust.bin", { count: 8 })).resolves.toBeNull();
  });

  it("returns null on bad bytes", async () => {
    stubFetch(async () => new Response(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]), { status: 200 }));
    await expect(loadFigure("/figure/bust.bin", { count: 8 })).resolves.toBeNull();
  });

  it("returns null when the network fails", async () => {
    stubFetch(async () => {
      throw new TypeError("network down");
    });
    await expect(loadFigure("/figure/bust.bin", { count: 8 })).resolves.toBeNull();
  });
});
