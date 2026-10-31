"use client";

import dynamic from "next/dynamic";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useSceneStore } from "@/lib/scene-store";

const ViewTrack = dynamic(() => import("./ViewTrack"), { ssr: false });

export function useSceneActive(): boolean {
  const tier = useSceneStore((s) => s.tier);
  const failed = useSceneStore((s) => s.failed);
  return tier !== null && tier !== "low" && !failed;
}

interface Props {
  children: ReactNode;
  poster: ReactNode;
  className?: string;
  index?: boolean;
}

export function ViewSlot({ children, poster, className, index }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useSceneActive();
  const ready = useSceneStore((s) => s.ready);
  const showScene = active && ready;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div
        data-poster
        className={cn(
          "transition-opacity duration-300",
          showScene ? "opacity-0" : "opacity-100",
        )}
      >
        {poster}
      </div>
      {active ? (
        <ViewTrack track={ref} index={index ? 1 : undefined}>
          {children}
        </ViewTrack>
      ) : null}
    </div>
  );
}
