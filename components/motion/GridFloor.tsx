"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { subscribeScroll } from "@/lib/scroll";

const CELL = 56; // px, one grid square before perspective
const SPEED = 0.5; // grid px per scrolled px

/**
 * A perspective floor of 1 px lines (white at 10%) that slides toward the viewer
 * as the page scrolls (spec 18.6). Scroll writes `--grid-y`; CSS turns it into
 * `background-position`. It sits under the canvas (z-index below the canvas's -1),
 * so the figure draws over it. Static under reduced motion.
 * Its parent must be `relative` and must not create a stacking context.
 */
export function GridFloor({ className }: { className?: string }) {
  const plane = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = plane.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let off: (() => void) | null = null;
    const sync = () => {
      off?.();
      off = null;
      el.style.setProperty("--grid-y", "0px");
      if (reduce.matches) return;
      off = subscribeScroll(({ y }) => {
        el.style.setProperty("--grid-y", `${(y * SPEED) % CELL}px`);
      });
    };
    sync();
    reduce.addEventListener("change", sync);
    return () => {
      reduce.removeEventListener("change", sync);
      off?.();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      data-grid-floor
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[46%] overflow-hidden [perspective:420px] [perspective-origin:50%_0%] [mask-image:linear-gradient(to_bottom,transparent,black_55%)]",
        className,
      )}
    >
      <div
        ref={plane}
        data-grid-plane
        className="absolute -inset-x-1/2 top-0 h-[260%] origin-top [transform:rotateX(72deg)]"
        style={{
          backgroundImage: `linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)`,
          backgroundSize: `${CELL}px ${CELL}px`,
          backgroundPosition: "50% var(--grid-y, 0px)",
        }}
      />
    </div>
  );
}
