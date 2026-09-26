import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import type { Site } from "@/lib/schemas";

export function WhatIBuild({ copy }: { copy: Site["home"]["whatIBuild"] }) {
  return (
    <Section title={copy.title} decodeTitle>
      <div className="grid gap-6 md:grid-cols-3">
        {copy.items.map((item) => (
          <Card key={item.href} href={item.href} className="h-full">
            <h3 className="font-display text-2xl">{item.title}</h3>
            <p className="mt-3 text-muted">{item.text}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
