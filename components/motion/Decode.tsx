"use client";

import { useEffect, useRef, type ElementType } from "react";
import { cn } from "@/lib/cn";
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
  /** "load" decodes on hydration (the hero name); "enter" waits until the text scrolls into view. */
  trigger?: "load" | "enter";
}

/**
 * Text that decodes from random glyphs, left to right. The real text is in the
 * DOM from the first byte (visually hidden, for screen readers and crawlers);
 * the glyphs are a decorative, aria-hidden layer.
 * The final text is always the layout box (`data-decode-glyphs`); while decoding
 * it is hidden and the frames draw in an absolute overlay over it, so a frame
 * that wraps differently can never move the content below (no layout shift).
 * Fallbacks (spec 18.4): reduced motion, the low tier (which covers no WebGL)
 * and a CPU renderer get a plain fade of the final text instead of the decode.
 */
export function Decode({
  text,
  as: Tag = "span",
  className,
  id,
  delay = 0,
  charMs = 24,
  maxMs = 900,
  trigger = "load",
}: Props) {
  const root = useRef<HTMLElement>(null);
  const frames = useRef<HTMLSpanElement>(null);

  const tier = useSceneStore((st) => st.tier);
  const software = useSceneStore((st) => st.software);

  useEffect(() => {
    const el = root.current;
    const layer = frames.current;
    // Wait for the device tier; the glyph layer stays hidden until then.
    if (!el || !layer || tier === null) return;
    // Already resolved (a later tier change re-runs this effect): never decode twice.
    if (el.dataset.decode === "done" || el.dataset.decode === "fade") return;
    // Hydrated after the no-script fallback already showed the text: leave it.
    // (An "enter" decode starts later by design, so this only guards "load".)
    if (trigger === "load" && performance.now() > FALLBACK_REVEAL_MS) {
      el.dataset.decode = "done";
      return;
    }
    const plain =
      tier === "low" || software || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (plain) {
      el.dataset.decode = "fade";
      return;
    }
    let io: IntersectionObserver | null = null;
    const rng = mulberry32(text.length * 7919 + 17);
    const duration = decodeDuration(Array.from(text).length, charMs, maxMs);
    let raf = 0;
    let start = -1;
    const step = (now: number) => {
      if (start < 0) start = now;
      const p = duration > 0 ? (now - start - delay) / duration : 1;
      if (p >= 1) {
        layer.textContent = "";
        el.dataset.decode = "done";
        return;
      }
      layer.textContent = decodeFrame(text, p, rng);
      raf = requestAnimationFrame(step);
    };
    const run = () => {
      layer.textContent = decodeFrame(text, 0, rng);
      el.dataset.decode = "run";
      raf = requestAnimationFrame(step);
    };
    if (trigger === "enter") {
      // Shows the final text until it enters the viewport, then decodes once.
      el.dataset.decode = "wait";
      io = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return;
          io?.disconnect();
          run();
        },
        { rootMargin: "0px 0px -10% 0px" },
      );
      io.observe(el);
    } else {
      run();
    }
    return () => {
      io?.disconnect();
      cancelAnimationFrame(raf);
      // Still waiting (a tier change re-runs this effect): wait again, do not skip the decode.
      if (el.dataset.decode === "wait") {
        el.dataset.decode = "";
        return;
      }
      layer.textContent = "";
      el.dataset.decode = "done";
    };
  }, [text, delay, charMs, maxMs, trigger, tier, software]);

  return (
    <Tag ref={root} id={id} className={cn("relative", className)} data-decode="">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" data-decode-glyphs="" className="whitespace-pre-wrap">
        {text}
      </span>
      <span
        ref={frames}
        aria-hidden="true"
        data-decode-frames=""
        className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap"
      />
    </Tag>
  );
}
