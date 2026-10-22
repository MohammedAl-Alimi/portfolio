import type { ReactNode } from "react";
import { Decode } from "@/components/motion/Decode";
import { cn } from "@/lib/cn";
import { Container } from "./Container";

type SectionProps = {
  id?: string;
  title?: string;
  children: ReactNode;
  className?: string;
  /** Decode the title from random glyphs when it scrolls into view. */
  decodeTitle?: boolean;
};

const titleClass = "font-display text-3xl tracking-[-0.02em] leading-[0.9] md:text-5xl mb-10";

export function Section({ id, title, children, className, decodeTitle = false }: SectionProps) {
  return (
    <section id={id} className={cn("py-[64px] md:py-[96px]", className)}>
      <Container>
        {title && decodeTitle ? <Decode as="h2" text={title} trigger="enter" className={titleClass} /> : null}
        {title && !decodeTitle ? <h2 className={titleClass}>{title}</h2> : null}
        {children}
      </Container>
    </section>
  );
}
