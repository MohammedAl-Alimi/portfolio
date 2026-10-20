"use client";

import { useEffect, useState } from "react";

export interface SlotSize {
  width: number;
  height: number;
}

const RESIZE_MS = 500;

/**
 * Size and visibility of the element matching `selector`. Size updates at most
 * every 500 ms, with a trailing update so the last size wins. `visible` follows
 * an IntersectionObserver and starts true, so nothing waits on the first callback.
 */
export function useSlot(selector: string): { size: SlotSize | null; visible: boolean } {
  const [size, setSize] = useState<SlotSize | null>(null);
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
