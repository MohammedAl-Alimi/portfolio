import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = {
  color?: string;
  href?: string;
  children: ReactNode;
  className?: string;
  "data-project-card"?: boolean;
};

export function Card({
  color,
  href,
  children,
  className,
  "data-project-card": projectCard,
}: CardProps) {
  const surface = (
    <div
      data-project-card={projectCard ? "" : undefined}
      className={cn(
        "bg-surface border border-border rounded-[var(--radius-md)] p-6",
        className,
      )}
      style={color ? { borderTop: `6px solid ${color}` } : undefined}
    >
      {children}
    </div>
  );

  if (!href) return surface;

  return (
    <Link
      href={href}
      className="block rounded-[var(--radius-md)] motion-safe:transition-transform motion-safe:duration-[var(--motion-base)] motion-safe:hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
    >
      {surface}
    </Link>
  );
}
