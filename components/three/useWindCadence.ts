"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, type RefObject } from "react";
import { stormNow, TRAIL_TTL, windTrail } from "@/lib/pointer-force";

const WIND_FPS = 60; // wind feels laggy at 30
const IDLE_FPS = 30; // idle motion (shimmer, rotation, a fading-in breeze) does not need more
const STEADY_FPS = 15; // a settled breeze is slow enough for 15 fps
const SOFTWARE_FPS = 15;

/** Frames per second the demand loop should run at, or 0 to stop. */
export function cadenceFps(windy: boolean, animating: boolean, steady: boolean, software: boolean): number {
  if (windy) return software ? SOFTWARE_FPS : WIND_FPS;
  if (animating) return steady ? STEADY_FPS : IDLE_FPS;
  return 0;
}

/**
 * Drives the demand loop. Wind runs at up to 60 fps (15 on software) until the
 * trail settles 1.5 s after its last sample. Then idle motion runs at 30 and a
 * steady breeze at 15. With nothing animating, the loop stops after one more
 * frame and the next trail sample wakes it. A scroll or resize also draws a
 * frame, because the view reads the slot rect inside one.
 */
export function useWindCadence({
  animating,
  software,
  steadyRef,
}: {
  animating: boolean;
  software: boolean;
  /** True while the breeze is settled. Leave out when idle motion never settles. */
  steadyRef?: RefObject<{ steady: boolean }>;
}): void {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    invalidate();
    const onChange = () => invalidate();
    window.addEventListener("scroll", onChange, { passive: true });
    window.addEventListener("resize", onChange);
    return () => {
      window.removeEventListener("scroll", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, [invalidate]);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = 0;
      const windy = windTrail.count > 0 && stormNow() < windTrail.latestTime + TRAIL_TTL;
      const fps = cadenceFps(windy, animating, steadyRef?.current?.steady ?? false, software);
      if (fps === 0) {
        invalidate(); // one more frame draws the settled state
        return;
      }
      // 1 ms of slack so a 60 Hz display does not skip every other frame.
      if (now - last >= 1000 / fps - 1) {
        last = now;
        invalidate();
      }
      raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    wake();
    const off = windTrail.subscribe(wake);
    return () => {
      off();
      cancelAnimationFrame(raf);
    };
  }, [animating, software, steadyRef, invalidate]);
}
