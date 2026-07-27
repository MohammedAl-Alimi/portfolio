"use client";

import { useTiltForce } from "@/components/three/useTiltForce";
import { useSceneActive, useSceneStore } from "@/lib/scene-store";

export function HeroHint() {
  const active = useSceneActive();
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  const tilt = useTiltForce(active && !reducedMotion);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      <p className="font-pixel text-[11px] tracking-wider text-muted uppercase">MOVE YOUR MOUSE. CLICK A SHAPE.</p>
      {tilt.needsTap ? (
        <button
          type="button"
          onClick={tilt.enable}
          className="min-h-11 border border-current px-3 font-pixel text-[11px] tracking-wider uppercase"
        >
          Enable tilt
        </button>
      ) : null}
    </div>
  );
}
