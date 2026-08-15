import type { ReactNode } from "react";

type TagProps = {
  children: ReactNode;
  /** Kept so callers compile. Tags no longer draw a colour dot. */
  color?: string;
};

export function Tag({ children }: TagProps) {
  return (
    <span className="inline-flex items-center border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase leading-none tracking-[0.12em] text-muted">
      {children}
    </span>
  );
}
