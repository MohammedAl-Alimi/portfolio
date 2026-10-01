import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type TagProps = {
  children: ReactNode;
  color?: string;
};

export function Tag({ children, color }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
        !color && "bg-surface border border-border text-muted",
      )}
      style={color ? { backgroundColor: color + "22", color } : undefined}
    >
      {children}
    </span>
  );
}
