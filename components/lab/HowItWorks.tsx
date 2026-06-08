import type { ReactNode } from "react";

export function HowItWorks({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="mt-10 rounded-[var(--radius-md)] border border-border bg-surface p-6">
      <summary className="cursor-pointer font-display text-xl">{title}</summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}
