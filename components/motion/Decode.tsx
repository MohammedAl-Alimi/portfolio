"use client";

import { useEffect, useRef, type ElementType } from "react";
import { decodeDuration, decodeFrame } from "@/lib/decode";
import { mulberry32 } from "@/lib/rng";

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
 * the glyphs are a decorative, aria-hidden layer. Reduced motion: final text, no animation.
 */
export function Decode({ text, as: Tag = "span", className, id, delay = 0, charMs = 24, maxMs = 900 }: Props) {
  const root = useRef<HTMLElement>(null);
  const glyphs = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    const layer = glyphs.current;
    if (!el || !layer) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.decode = "done";
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
  }, [text, delay, charMs, maxMs]);

  return (
    <Tag ref={root} id={id} className={className} data-decode="">
      <span className="sr-only">{text}</span>
      <span ref={glyphs} aria-hidden="true" data-decode-glyphs="" className="whitespace-pre">
        {text}
      </span>
    </Tag>
  );
}
