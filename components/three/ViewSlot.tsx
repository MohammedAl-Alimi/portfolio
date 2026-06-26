"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useSceneActive, useSceneStore } from "@/lib/scene-store";
import { SceneErrorBoundary } from "./SceneErrorBoundary";

const ViewTrack = dynamic(() => import("./ViewTrack"), { ssr: false });

export { useSceneActive };

interface Props {
  children: ReactNode;
  poster: ReactNode;
  className?: string;
  index?: number;
}

export function ViewSlot({ children, poster, className, index }: Props) {
  const active = useSceneActive();
  const ready = useSceneStore((s) => s.ready);

  return (
    <div className={cn("relative", className)}>
      <div
        data-poster
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-300",
          active && ready ? "opacity-0" : "opacity-100",
        )}
      >
        {poster}
      </div>
      {active ? (
        <SceneErrorBoundary>
          <ViewTrack index={index}>{children}</ViewTrack>
        </SceneErrorBoundary>
      ) : null}
    </div>
  );
}
