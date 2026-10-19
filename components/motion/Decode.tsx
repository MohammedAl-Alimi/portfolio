"use client";

import { useEffect, useRef, type ElementType } from "react";
import { decodeDuration, decodeFrame } from "@/lib/decode";
import { mulberry32 } from "@/lib/rng";
import { useSceneStore } from "@/lib/scene-store";

// The no-script fallback (app/globals.css) reveals the final text this late.
const FALLBACK_REVEAL_MS = 1200;

interface Props {
  text: string;
  as?: ElementType;
  className?: string;
  id?: string;
  /** ms of scrambling before the first character resolves. */
  delay?: number;
  charMs?: number;
  maxMs?: number;
}

/**
 * Text that decodes from random glyphs, left to right. The real text is in the
 * DOM from the first byte (visually hidden, for screen readers and crawlers);
 * the glyphs are a decorative, aria-hidden layer.
 * Fallbacks (spec 18.4): reduced motion, the low tier (which covers no WebGL)
 * and a CPU renderer get a plain fade of the final text instead of the decode.
 */
export function Decode({ text, as: Tag = "span", className, id, delay = 0, charMs = 24, maxMs = 900 }: Props) {
  const root = useRef<HTMLElement>(null);
  const glyphs = useRef<HTMLSpanElement>(null);

  const tier = useSceneStore((st) => st.tier);
  const software = useSceneStore((st) => st.software);

  useEffect(() => {
    const el = root.current;
    const layer = glyphs.current;
    // Wait for the device tier; the glyph layer stays hidden until then.
    if (!el || !layer || tier === null) return;
    // Already resolved (a later tier change re-runs this effect): never decode twice.
    if (el.dataset.decode === "done" || el.dataset.decode === "fade") return;
    // Hydrated after the no-script fallback already showed the text: leave it.
    if (performance.now() > FALLBACK_REVEAL_MS) {
      el.dataset.decode = "done";
      return;
    }
    const plain =
      tier === "low" || software || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (plain) {
      layer.textContent = text;
      el.dataset.decode = "fade";
      return;
    }
    const rng = mulberry32(text.length * 7919 + 17);
    const duration = decodeDuration(Array.from(text).length, charMs, maxMs);
    let raf = 0;
    let start = -1;
    const step = (now: number) => {
      if (start < 0) start = now;
      const p = duration > 0 ? (now - start - delay) / duration : 1;
      if (p >= 1) {
        layer.textContent = text;
        el.dataset.decode = "done";
        return;
      }
      layer.textContent = decodeFrame(text, p, rng);
      raf = requestAnimationFrame(step);
    };
    layer.textContent = decodeFrame(text, 0, rng);
    el.dataset.decode = "run";
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      layer.textContent = text;
      el.dataset.decode = "done";
    };
  }, [text, delay, charMs, maxMs, tier, software]);

  return (
    <Tag ref={root} id={id} className={className} data-decode="">
      <span className="sr-only">{text}</span>
      <span ref={glyphs} aria-hidden="true" data-decode-glyphs="" className="whitespace-pre">
        {text}
      </span>
    </Tag>
  );
}
