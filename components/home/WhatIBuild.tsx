import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { pad2 } from "@/lib/format";
import type { Site } from "@/lib/schemas";

export function WhatIBuild({ copy }: { copy: Site["home"]["whatIBuild"] }) {
  return (
    <Section title={copy.title} decodeTitle>
      <div className="grid gap-6 md:grid-cols-3">
        {copy.items.map((item, i) => (
          <Card key={item.href} href={item.href} className="h-full">
            {/* `01 AI AND COMPUTER VISION`: CSS does the caps, so the name reads as words. */}
            <h3 className="font-display text-xl uppercase leading-[1.1] tracking-[-0.02em] break-words md:text-2xl">
              <span aria-hidden="true" className="font-mono text-[11px] tracking-[0.12em] text-muted">
                {pad2(i + 1)}
              </span>{" "}
              {item.title}
            </h3>
            <p className="mt-3 font-mono text-muted">{item.text}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
