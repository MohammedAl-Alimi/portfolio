import { describe, expect, it } from "vitest";
import { getDeviceTier, type DeviceSignals } from "@/lib/device";

const base: DeviceSignals = {
  reducedMotion: false,
  saveData: false,
  webgl2: true,
  cores: 8,
  memory: 8,
  frameMs: null,
};

describe("getDeviceTier", () => {
  it("is high for a capable device with no frame probe", () => {
    expect(getDeviceTier(base)).toBe("high");
  });
  it("is high for a fast frame probe", () => {
    expect(getDeviceTier({ ...base, frameMs: 16.7 })).toBe("high");
    expect(getDeviceTier({ ...base, frameMs: 20 })).toBe("high");
  });
  it("is low for reduced motion", () => {
    expect(getDeviceTier({ ...base, reducedMotion: true })).toBe("low");
  });
  it("is low without webgl2", () => {
    expect(getDeviceTier({ ...base, webgl2: false })).toBe("low");
  });
  it("is low for save-data", () => {
    expect(getDeviceTier({ ...base, saveData: true })).toBe("low");
  });
  it("is mid when both cores and memory are at most 4", () => {
    expect(getDeviceTier({ ...base, cores: 4, memory: 4 })).toBe("mid");
    expect(getDeviceTier({ ...base, cores: 2, memory: 2 })).toBe("mid");
  });
  it("is high when only one of cores or memory is small", () => {
    expect(getDeviceTier({ ...base, cores: 4, memory: 8 })).toBe("high");
    expect(getDeviceTier({ ...base, cores: 8, memory: 4 })).toBe("high");
  });
  it("is mid for a slow frame probe", () => {
    expect(getDeviceTier({ ...base, frameMs: 20.1 })).toBe("mid");
    expect(getDeviceTier({ ...base, frameMs: 33 })).toBe("mid");
  });
  it("low rules win over mid rules", () => {
    expect(
      getDeviceTier({ ...base, reducedMotion: true, cores: 2, memory: 2, frameMs: 40 }),
    ).toBe("low");
  });
});

import { medianFrameMs, tierAfterProbe } from "@/lib/device";

describe("medianFrameMs", () => {
  it("returns null when only warm-up frames exist", () => {
    expect(medianFrameMs([1, 2, 3, 4, 5])).toBeNull();
  });
  it("drops the first 5 samples and takes the median of the rest", () => {
    expect(medianFrameMs([100, 100, 100, 100, 100, 16, 17, 400])).toBe(17);
    expect(medianFrameMs([0, 0, 0, 0, 0, 10, 20, 30, 40])).toBe(25);
  });
  it("does not sort the caller's array", () => {
    const a = [0, 0, 0, 0, 0, 3, 1, 2];
    medianFrameMs(a);
    expect(a).toEqual([0, 0, 0, 0, 0, 3, 1, 2]);
  });
});

describe("tierAfterProbe", () => {
  const warm = [50, 50, 50, 50, 50];
  it("stays high when the median is 20 ms or less", () => {
    expect(tierAfterProbe(base, [...warm, 16, 16, 16, 90, 90])).toBe("high");
  });
  it("downgrades to mid when the median is over 20 ms", () => {
    expect(tierAfterProbe(base, [...warm, 30, 30, 30, 5, 5])).toBe("mid");
  });
  it("stays high with no usable samples", () => {
    expect(tierAfterProbe(base, warm)).toBe("high");
  });
});
