"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useSceneActive, useSceneStore } from "@/lib/scene-store";
import { ViewSlot } from "./ViewSlot";

// The figure loader, slot measuring and three.js load only when a canvas is active. The root
// not-found is in every route's client manifest, so this file keeps to the button and the poster.
const StaticFieldScene = dynamic(() => import("./StaticFieldCloud").then((m) => m.StaticFieldScene), {
  ssr: false,
});

const SLOT = "[data-static-field]";
const REASSEMBLE_MS = 900;

type FieldState = "scattered" | "whole";

/**
 * The 404 figure, dissolved into static. A click reassembles it, a second click scatters it again.
 * Without a canvas (low tier, no WebGL, failed load) the poster sharpens instead, and the state still flips.
 */
export function StaticField() {
  const active = useSceneActive();
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  // True once the scene has its figure; a failed load leaves it false and the poster path runs.
  const [drawing, setDrawing] = useState(false);
  const [whole, setWhole] = useState(false);
  const [state, setState] = useState<FieldState>("scattered");
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const toggle = () => {
    const next = !whole;
    setWhole(next);
    window.clearTimeout(timer.current);
    const animated = active && drawing && !reducedMotion;
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
          // A CSS background, not next/image: this file ships on every route (see above),
          // and the 35 KB poster needs no resizing at 224 px.
          <div
            data-static-poster
            className={cn(
              "absolute inset-0 bg-[url(/posters/figure.webp)] bg-cover bg-center grayscale motion-safe:transition-[opacity,filter] motion-safe:duration-[900ms]",
              whole ? "opacity-100" : "opacity-40 blur-[2px]",
            )}
          />
        }
      >
        <StaticFieldScene slot={SLOT} whole={whole} durationMs={REASSEMBLE_MS} onFigure={setDrawing} />
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
