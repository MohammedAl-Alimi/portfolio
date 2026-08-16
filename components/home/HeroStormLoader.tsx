"use client";

import dynamic from "next/dynamic";

// The storm and its sampler load only when the hero view is active.
const HeroStorm = dynamic(() => import("@/components/three/HeroStorm"), { ssr: false });

export function HeroStormLoader() {
  return <HeroStorm slot="[data-hero-slot]" />;
}
