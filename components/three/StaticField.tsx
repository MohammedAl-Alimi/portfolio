"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { loadFigure, type Figure } from "@/lib/figure";
import { useSceneActive, useSceneStore } from "@/lib/scene-store";
import { useSlot } from "@/lib/use-slot";
import { ViewSlot } from "./ViewSlot";

// three.js loads only when a canvas is active, never with the page.
const StaticFieldCloud = dynamic(() => import("./StaticFieldCloud").then((m) => m.StaticFieldCloud), {
  ssr: false,
});

const SLOT = "[data-static-field]";
const COUNT = 30000;
const REASSEMBLE_MS = 900;

type FieldState = "scattered" | "whole";

/**
 * The 404 figure, dissolved into static. A click reassembles it, a second click scatters it again.
 * Without a canvas (low tier, no WebGL, failed load) the poster sharpens instead, and the state still flips.
 */
export function StaticField() {
  const active = useSceneActive();
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  const { size } = useSlot(SLOT);
  const [figure, setFigure] = useState<Figure | null>(null);
  const [whole, setWhole] = useState(false);
  const [state, setState] = useState<FieldState>("scattered");
  const timer = useRef(0);

  useEffect(() => {
    if (!active) return;
    const ctrl = new AbortController();
    void loadFigure("/figure/bust.bin", { count: COUNT, signal: ctrl.signal }).then((fig) => {
      if (!ctrl.signal.aborted) setFigure(fig);
    });
    return () => ctrl.abort();
  }, [active]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const toggle = () => {
    const next = !whole;
    setWhole(next);
    window.clearTimeout(timer.current);
    const animated = active && figure !== null && !reducedMotion;
    // "whole" only once the points have landed; scattering starts at once.
    if (next && animated) {
      timer.current = window.setTimeout(() => setState("whole"), REASSEMBLE_MS);
    } else {
      setState(next ? "whole" : "scattered");
    }
  };

  return (
    <div
      data-static-field
      data-state={state}
      data-notfound-shape-slot
      className="relative mx-auto mb-10 h-40 w-40 md:h-56 md:w-56"
    >
      <ViewSlot
        className="h-full w-full"
        poster={
          <Image
            src="/posters/figure.webp"
            alt=""
            fill
            sizes="224px"
            className={cn(
              "object-cover grayscale motion-safe:transition-[opacity,filter] motion-safe:duration-[900ms]",
              whole ? "opacity-100" : "opacity-40 blur-[2px]",
            )}
          />
        }
      >
        {figure && size && size.width > 0 ? <StaticFieldCloud figure={figure} size={size} whole={whole} durationMs={REASSEMBLE_MS} /> : null}
      </ViewSlot>
      <button
        type="button"
        aria-label="Reassemble the figure"
        aria-pressed={whole}
        onClick={toggle}
        className="absolute inset-0 focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[var(--glow)]"
      />
    </div>
  );
}
