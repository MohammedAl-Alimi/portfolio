import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "./Container";

type SectionProps = {
  id?: string;
  title?: string;
  children: ReactNode;
  className?: string;
};

export function Section({ id, title, children, className }: SectionProps) {
  return (
    <section id={id} className={cn("py-[64px] md:py-[96px]", className)}>
      <Container>
        {title ? (
          <h2 className="font-display text-3xl md:text-5xl mb-10">{title}</h2>
        ) : null}
        {children}
      </Container>
    </section>
  );
}
