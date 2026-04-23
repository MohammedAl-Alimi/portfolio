"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { loadFigure, type Figure } from "@/lib/figure";
import { useSceneStore } from "@/lib/scene-store";
import { useSlot } from "@/lib/use-slot";

// The scene and three.js load only when the hero view is active.
const FigureCloud = dynamic(() => import("@/components/three/FigureCloud").then((m) => m.FigureCloud), {
  ssr: false,
});

const SLOT = "[data-hero-slot]";
const COUNT = { high: 56000, mid: 30000 } as const;

function figureUrl(): string {
  // Test-only switch to exercise the fallback. Production builds inline "0" and drop it.
  if (process.env.NEXT_PUBLIC_E2E === "1" && new URLSearchParams(window.location.search).get("figure") === "missing") {
    return "/figure/missing.bin";
  }
  return "/figure/bust.bin";
}

/** Loads the point cloud and draws it in the hero view. Until the first frame, the poster shows. */
export function HeroFigure() {
  const tier = useSceneStore((s) => s.tier);
  const count = tier === "high" ? COUNT.high : COUNT.mid;
  const { size, visible } = useSlot(SLOT);
  const [figure, setFigure] = useState<Figure | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    // A failed load gives null: the poster stays and no scene is drawn.
    void loadFigure(figureUrl(), { count, signal: ctrl.signal }).then((fig) => {
      if (!ctrl.signal.aborted) setFigure(fig);
    });
    return () => ctrl.abort();
  }, [count]);

  if (!figure || !size || size.width === 0) return null;
  return <FigureCloud figure={figure} size={size} visible={visible} slot={SLOT} />;
}
