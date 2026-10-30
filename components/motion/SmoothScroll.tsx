"use client";

import { useEffect } from "react";
import { useSceneStore } from "@/lib/scene-store";
import { setSmoothScroller } from "@/lib/scroll";
import "lenis/dist/lenis.css";

/**
 * Lenis smooth scrolling (spec 18.6), mounted once in the root layout. Off under
 * reduced motion and on the low tier, where the page scrolls natively. Lenis
 * drives the window's own scroll position, so anchors, keyboard scrolling and
 * window.scrollY keep working; it runs on its own rAF and never touches the canvas.
 */
export function SmoothScroll() {
  const enabled = useSceneStore((s) => s.tier !== null && s.tier !== "low" && !s.reducedMotion);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let destroy: (() => void) | null = null;
    void import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      // A link click stops any glide, so Next's scroll on navigation is not fought.
      const lenis = new Lenis({ autoRaf: true, stopInertiaOnNavigate: true });
      setSmoothScroller(lenis);
      destroy = () => {
        setSmoothScroller(null);
        lenis.destroy();
      };
    });
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [enabled]);

  return null;
}
