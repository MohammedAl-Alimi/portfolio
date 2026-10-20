"use client";

import { useEffect, useRef } from "react";
import { subscribeScroll } from "@/lib/scroll";

function format(progress: number) {
  const value = Math.min(99.99, Math.max(0, progress * 99.99));
  return value.toFixed(2).padStart(5, "0");
}

export function ScrollReadout() {
  const ref = useRef<HTMLSpanElement>(null);

  // Follows Lenis while it runs, native scroll otherwise (lib/scroll.ts).
  useEffect(
    () =>
      subscribeScroll(({ progress }) => {
        if (ref.current) ref.current.textContent = format(progress);
      }),
    [],
  );

  return (
    <span
      ref={ref}
      aria-hidden="true"
      data-scroll-readout
      className="font-mono text-[10px] tabular-nums tracking-[0.08em] text-muted"
    >
      00.00
    </span>
  );
}
