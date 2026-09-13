"use client";

import { View } from "@react-three/drei";
import type { ReactNode } from "react";

interface Props {
  index?: number;
  children: ReactNode;
}

// Kept apart from ViewSlot so drei stays out of pages until a canvas is active.
// drei 10.7 renders its own element for the view, so it fills the slot itself.
export default function ViewTrack({ index, children }: Props) {
  return (
    <View className="absolute inset-0" index={index}>
      {children}
    </View>
  );
}
