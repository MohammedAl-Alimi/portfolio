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

const PROBE_WARMUP_FRAMES = 5;

export function medianFrameMs(samples: number[]): number | null {
  const rest = samples.slice(PROBE_WARMUP_FRAMES).sort((a, b) => a - b);
  if (rest.length === 0) return null;
  const mid = Math.floor(rest.length / 2);
  const hi = rest[mid] ?? 0;
  return rest.length % 2 === 1 ? hi : ((rest[mid - 1] ?? 0) + hi) / 2;
}

// Never upgrades: only a high tier can be downgraded to mid.
export function tierAfterProbe(signals: DeviceSignals, samples: number[]): Tier {
  return getDeviceTier({ ...signals, frameMs: medianFrameMs(samples) });
}
