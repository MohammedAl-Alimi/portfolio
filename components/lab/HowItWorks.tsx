import type { ReactNode } from "react";

export function HowItWorks({ children }: { children: ReactNode }) {
  return (
    <details className="mt-10 rounded-[var(--radius-md)] border border-border bg-surface p-6">
      <summary className="cursor-pointer font-display text-xl">How it works</summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}
