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
        "inline-flex items-center gap-2 rounded-[2px] border border-border px-2 py-1 font-mono uppercase tracking-[0.12em] text-[11px] leading-none text-muted",
      )}
    >
      {color ? (
        <span
          data-tag-dot
          aria-hidden="true"
          className="inline-block size-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      ) : null}
      {children}
    </span>
  );
}
