import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

type BracketsProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  as?: ElementType;
};

const corners = [
  "top-0 left-0 border-t border-l",
  "top-0 right-0 border-t border-r",
  "bottom-0 left-0 border-b border-l",
  "bottom-0 right-0 border-b border-r",
];

const growth =
  "group-hover/brackets:size-4 group-focus-within/brackets:size-4 motion-safe:transition-[width,height] motion-safe:duration-[var(--motion-fast)]";

export function Brackets({ children, className, hover = true, as: Tag = "div" }: BracketsProps) {
  return (
    <Tag className={cn("group/brackets relative", className)}>
      {children}
      {corners.map((corner) => (
        <span
          key={corner}
          aria-hidden="true"
          data-bracket
          className={cn(
            "pointer-events-none absolute size-2 border-glow",
            corner,
            hover && growth,
          )}
        />
      ))}
    </Tag>
  );
}
