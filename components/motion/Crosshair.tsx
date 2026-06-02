"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useSceneStore } from "@/lib/scene-store";

/*
 * Crosshair cursor (spec 18.6). Desktop only: a fine pointer that can hover, a
 * wide viewport (the coordinate readout lives in the rail), the high tier and
 * no reduced motion. Anything else keeps the native cursor. A tier downgrade or
 * a media change unmounts it, which restores the native cursor at once.
 *
 * One rAF per pointer move writes the position (transform only) and the rail
 * readout (textContent), so React never re-renders while the pointer moves.
 * Layers: overlays 60, this 65, transition overlay 70.
 */

const QUERY =
  "(pointer: fine) and (hover: hover) and (min-width: 1024px) and (prefers-reduced-motion: no-preference)";
/** The native cursor shows over these, so the crosshair hides. */
const FIELD = 'input, textarea, select, [contenteditable="true"]';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const getMatches = () => window.matchMedia(QUERY).matches;
const getServerMatches = () => false;

type CursorState = "cross" | "hidden";

/** `X 0042 Y 0815`: client coordinates, zero-padded to four digits. */
function formatReadout(x: number, y: number): string {
  const pad = (n: number) => String(Math.min(9999, Math.max(0, Math.round(n)))).padStart(4, "0");
  return `X ${pad(x)} Y ${pad(y)}`;
}

export function Crosshair() {
  const media = useSyncExternalStore(subscribe, getMatches, getServerMatches);
  const tierHigh = useSceneStore((s) => s.tier === "high" && !s.reducedMotion);
  if (!media || !tierHigh) return null;
  return <ActiveCrosshair />;
}

function ActiveCrosshair() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const html = document.documentElement;
    const readout = document.querySelector<HTMLElement>("[data-cursor-readout]");
    html.dataset.cursor = "custom";

    let x = 0;
    let y = 0;
    let visible = false;
    let overField = false;
    let frame = 0;

    const render = () => {
      frame = 0;
      const state: CursorState = visible && !overField ? "cross" : "hidden";
      if (el.dataset.state !== state) el.dataset.state = state;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (readout) readout.textContent = formatReadout(x, y);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      x = e.clientX;
      y = e.clientY;
      visible = true;
      schedule();
    };
    const onOver = (e: PointerEvent) => {
      overField = e.target instanceof Element && e.target.closest(FIELD) !== null;
      schedule();
    };
    // No related target: the pointer left the window or went into an iframe.
    const onOut = (e: PointerEvent) => {
      if (e.relatedTarget) return;
      visible = false;
      schedule();
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      cancelAnimationFrame(frame);
      delete html.dataset.cursor;
    };
  }, []);

  return (
    <div
      ref={root}
      aria-hidden="true"
      data-cursor-root
      data-state="hidden"
      className="pointer-events-none fixed left-0 top-0 z-[65] size-0"
    >
      <div data-cursor-cross>
        <span className="absolute left-[-6px] top-0 h-px w-[12px] bg-glow/80" />
        <span className="absolute left-0 top-[-6px] h-[12px] w-px bg-glow/80" />
        <span className="absolute left-[-1px] top-[-1px] size-[3px] bg-glow" />
      </div>
    </div>
  );
}
