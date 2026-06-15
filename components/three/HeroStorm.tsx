"use client";

import { OrthographicCamera } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import { centerAndFit, fitToCount, sampleTextToCount, type SamplerContext } from "@/lib/pixel-sampler";
import { useSceneStore } from "@/lib/scene-store";
import { pointSizeFor, STORM_COLORS } from "@/lib/storm-attributes";
import { PixelStorm } from "./PixelStorm";

const LINES = ["MOHAMMED", "AL-ALIMI"];
const FAMILY = "Unbounded";
const BITMAP_W = 1600;
const BITMAP_H = 600;
const FONT_TIMEOUT_MS = 2000;
const RESIZE_MS = 500;
const MARGIN = 0.08; // the word fills the slot width minus 8%

const COUNT = { high: 40000, mid: 20000 } as const;

function getContext(w: number, h: number): SamplerContext {
  const canvas =
    typeof OffscreenCanvas === "function" ? new OffscreenCanvas(w, h) : Object.assign(document.createElement("canvas"), { width: w, height: h });
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2d context unavailable");
  return ctx as SamplerContext;
}

// Waits for the display face. Falls back to sans-serif after 2 s, silently.
async function displayFamily(): Promise<string> {
  const loaded = Promise.all([document.fonts.load(`700 200px ${FAMILY}`), document.fonts.ready]).then(() =>
    document.fonts.check(`700 200px ${FAMILY}`),
  );
  const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), FONT_TIMEOUT_MS));
  const ok = await Promise.race([loaded, timeout]).catch(() => false);
  return ok ? FAMILY : "sans-serif";
}

const cache = new Map<string, Float32Array>();

export function sampleWord(count: number, family: string): Float32Array {
  const key = `${count}|${family}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const raw = sampleTextToCount(LINES, {
    font: `700 220px ${family}`,
    width: BITMAP_W,
    height: BITMAP_H,
    count,
    getContext,
  });
  const targets = fitToCount(centerAndFit(raw), count);
  cache.set(key, targets);
  return targets;
}

interface Size {
  width: number;
  height: number;
}

function useSlot(selector: string): { size: Size | null; visible: boolean } {
  const [size, setSize] = useState<Size | null>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = document.querySelector(selector);
    if (!el) return;
    let last = 0;
    let timer = 0;
    const measure = () => {
      last = performance.now();
      const r = el.getBoundingClientRect();
      setSize((s) => (s && s.width === r.width && s.height === r.height ? s : { width: r.width, height: r.height }));
    };
    measure();
    // At most one update every 500 ms, with a trailing one so the last size wins.
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer);
      const wait = RESIZE_MS - (performance.now() - last);
      if (wait <= 0) measure();
      else timer = window.setTimeout(measure, wait);
    });
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? true));
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [selector]);
  return { size, visible };
}

interface Props {
  /** CSS selector of the element the view fills, used to size the camera. */
  slot: string;
}

export default function HeroStorm({ slot }: Props) {
  const tier = useSceneStore((s) => s.tier);
  const count = tier === "high" ? COUNT.high : COUNT.mid;
  const { size, visible } = useSlot(slot);
  const [family, setFamily] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void displayFamily().then((f) => {
      if (live) setFamily(f);
    });
    return () => {
      live = false;
    };
  }, []);

  // Re-sampled when the tier changes the count. Cached per count and font.
  const targets = useMemo(() => (family ? sampleWord(count, family) : null), [family, count]);

  if (!size || !targets || size.width === 0) return null;
  const zoom = (size.width * (1 - MARGIN)) / 2;

  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 5]} zoom={zoom} near={0.1} far={20} />
      <PixelStorm
        count={count}
        targets={targets}
        colors={STORM_COLORS}
        pointSize={pointSizeFor(size.height)}
        animate={visible}
      />
    </>
  );
}
