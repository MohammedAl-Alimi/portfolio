"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTiltForce } from "@/components/three/useTiltForce";
import { cn } from "@/lib/cn";
import { useSceneActive, useSceneStore } from "@/lib/scene-store";
import { useSlot } from "@/lib/use-slot";

const SEEN_KEY = "storm-hint-seen";

// Storage can throw in private windows or with site data blocked.
function readSeen(): boolean {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

const noSubscribe = () => () => {};

export function HeroHint() {
  const active = useSceneActive();
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  const interacted = useSceneStore((s) => s.interacted);
  // Seen earlier in this session: hidden from the start, without a fade.
  const seenBefore = useSyncExternalStore(noSubscribe, readSeen, () => false);
  // Tilt only listens while the hero slot is on screen.
  const { visible } = useSlot("[data-hero-slot]");
  const tilt = useTiltForce(active && !reducedMotion && visible);

  useEffect(() => {
    if (!interacted) return;
    try {
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // The hint just shows again next visit.
    }
  }, [interacted]);

  const hidden = seenBefore || interacted;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      <p
        data-hero-hint
        aria-hidden={hidden || undefined}
        className={cn(
          "font-mono uppercase tracking-[0.12em] text-[11px] text-muted",
          // Fade over 400 ms, then hide, so it leaves the accessibility tree too.
          hidden ? "invisible opacity-0" : "visible opacity-100",
          interacted && !seenBefore && "[transition:opacity_400ms_ease,visibility_0s_linear_400ms]",
        )}
      >
        MOVE YOUR MOUSE. CLICK A SHAPE.
      </p>
      {tilt.needsTap ? (
        <button
          type="button"
          onClick={tilt.enable}
          className="min-h-11 border border-current px-3 font-mono uppercase tracking-[0.12em] text-[11px]"
        >
          Enable tilt
        </button>
      ) : null}
    </div>
  );
}
