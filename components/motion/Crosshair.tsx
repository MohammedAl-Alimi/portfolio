"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { useSceneStore } from "@/lib/scene-store";
import { subscribeScroll } from "@/lib/scroll";

/*
 * Crosshair cursor (spec 18.6). Desktop only: a fine pointer that can hover, a
 * wide viewport (the coordinate readout lives in the rail), the high tier and
 * no reduced motion. Anything else keeps the native cursor. A tier downgrade or
 * a media change unmounts it, which restores the native cursor at once.
 *
 * One rAF per pointer move writes the position (transform only) and the rail
 * readout (textContent), so React never re-renders while the pointer moves.
 * Over a link or a button the crosshair morphs into four corner brackets fitted
 * to the target (4 px outset, 10 px arms, 120 ms CSS spring on the corners).
 * While bracketed the root sits on the target's centre and follows its rect on
 * scroll, so the brackets stay attached while Lenis glides.
 * Layers: overlays 60, this 65, transition overlay 70.
 */

const QUERY =
  "(pointer: fine) and (hover: hover) and (min-width: 1024px) and (prefers-reduced-motion: no-preference)";
const TARGET = 'a, button, [data-cursor="brackets"]';
const OUTSET = 4;
const ARM = 10;
/** The native cursor shows over these, so the crosshair hides. */
const FIELD = 'input, textarea, select, [contenteditable="true"]';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const getMatches = () => window.matchMedia(QUERY).matches;
const getServerMatches = () => false;

type CursorState = "cross" | "brackets" | "hidden";
type Corner = "tl" | "tr" | "bl" | "br";
const CORNERS: Corner[] = ["tl", "tr", "bl", "br"];

/** Moves each corner so its outer point sits on the bracket box (half sizes from the centre). */
function cornerTransform(corner: Corner, hw: number, hh: number): string {
  const left = corner === "tl" || corner === "bl" ? -hw : hw - ARM;
  const top = corner === "tl" || corner === "tr" ? -hh : hh - ARM;
  return `translate3d(${left}px, ${top}px, 0)`;
}

/** `X 0042 Y 0815`: client coordinates, zero-padded to four digits. */
function formatReadout(x: number, y: number): string {
  const pad = (n: number) => String(Math.min(9999, Math.max(0, Math.round(n)))).padStart(4, "0");
  return `X ${pad(x)} Y ${pad(y)}`;
}

const CORNER_BORDERS: Record<Corner, string> = {
  tl: "border-l border-t",
  tr: "border-r border-t",
  bl: "border-b border-l",
  br: "border-b border-r",
};

export function Crosshair() {
  const media = useSyncExternalStore(subscribe, getMatches, getServerMatches);
  const tierHigh = useSceneStore((s) => s.tier === "high" && !s.reducedMotion);
  if (!media || !tierHigh) return null;
  return <ActiveCrosshair />;
}

function ActiveCrosshair() {
  const root = useRef<HTMLDivElement>(null);
  const corners = useRef<Partial<Record<Corner, HTMLSpanElement | null>>>({});
  const reset = useRef<() => void>(() => {});
  const pathname = usePathname();

  // A route change drops any bracket target: the page under the pointer is new.
  useEffect(() => reset.current(), [pathname]);

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
    let target: Element | null = null;
    let frame = 0;

    const place = (left: number, top: number, hw: number, hh: number) => {
      el.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      for (const corner of CORNERS) {
        const node = corners.current[corner];
        if (node) node.style.transform = cornerTransform(corner, hw, hh);
      }
    };

    const render = () => {
      frame = 0;
      if (target && !target.isConnected) target = null;
      const state: CursorState = !visible || overField ? "hidden" : target ? "brackets" : "cross";
      if (el.dataset.state !== state) el.dataset.state = state;
      if (state === "brackets" && target) {
        const r = target.getBoundingClientRect();
        place(r.left + r.width / 2, r.top + r.height / 2, r.width / 2 + OUTSET, r.height / 2 + OUTSET);
      } else {
        place(x, y, ARM / 2, ARM / 2);
      }
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
      const hovered = e.target instanceof Element ? e.target : null;
      overField = hovered?.closest(FIELD) != null;
      target = overField ? null : (hovered?.closest(TARGET) ?? null);
      schedule();
    };
    // No related target: the pointer left the window or went into an iframe.
    const onOut = (e: PointerEvent) => {
      if (e.relatedTarget) return;
      visible = false;
      schedule();
    };

    reset.current = () => {
      target = null;
      schedule();
    };
    const unsubscribeScroll = subscribeScroll(() => {
      if (target) schedule();
    });

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      unsubscribeScroll();
      reset.current = () => {};
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
      {CORNERS.map((corner) => (
        <span
          key={corner}
          ref={(node) => {
            corners.current[corner] = node;
          }}
          data-cursor-corner={corner}
          className={`absolute left-0 top-0 size-[10px] border-glow ${CORNER_BORDERS[corner]}`}
        />
      ))}
    </div>
  );
}
