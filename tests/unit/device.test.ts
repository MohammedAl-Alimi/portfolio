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
