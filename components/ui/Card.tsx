import { TransitionLink } from "@/components/motion/TransitionLink";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Brackets } from "./Brackets";

type CardProps = {
  /** Kept so callers compile. The border is always monochrome. */
  color?: string;
  href?: string;
  children: ReactNode;
  className?: string;
  "data-project-card"?: boolean;
};

export function Card({
  href,
  children,
  className,
  "data-project-card": projectCard,
}: CardProps) {
  const surface = (
    <Brackets
      data-project-card={projectCard ? "" : undefined}
      className={cn("bg-surface border border-border p-6", className)}
    >
      {children}
    </Brackets>
  );

  if (!href) return surface;

  return (
    <TransitionLink
      href={href}
      className="block motion-safe:transition-transform motion-safe:duration-[var(--motion-base)] motion-safe:hover:-translate-y-1 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--glow)]"
    >
      {surface}
    </TransitionLink>
  );
}
