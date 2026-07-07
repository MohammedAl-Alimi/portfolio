export type Tier = "high" | "mid" | "low";

export interface DeviceSignals {
  reducedMotion: boolean;
  saveData: boolean;
  webgl2: boolean;
  cores: number;
  memory: number;
  frameMs: number | null;
}

export function getDeviceTier(s: DeviceSignals): Tier {
  if (s.reducedMotion) return "low";
  if (!s.webgl2) return "low";
  if (s.saveData) return "low";
  if (s.cores <= 4 && s.memory <= 4) return "mid";
  if (s.frameMs !== null && s.frameMs > 20) return "mid";
  return "high";
}

interface NavigatorHints extends Navigator {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
}

function hasWebgl2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function readDeviceSignals(): DeviceSignals {
  const nav = navigator as NavigatorHints;
  return {
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: nav.connection?.saveData === true,
    webgl2: hasWebgl2(),
    cores: nav.hardwareConcurrency ?? 8,
    memory: nav.deviceMemory ?? 8,
    frameMs: null,
  };
}
