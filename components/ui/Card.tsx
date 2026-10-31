import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = {
  color?: string;
  href?: string;
  children: ReactNode;
  className?: string;
};

export function Card({ color, href, children, className }: CardProps) {
  const surface = (
    <div
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
      className="block rounded-[var(--radius-md)] transition-transform duration-[var(--motion-base)] hover:-translate-y-1 motion-reduce:translate-none motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
    >
      {surface}
    </Link>
  );
}
