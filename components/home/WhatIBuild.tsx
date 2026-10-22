import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";

const ITEMS = [
  {
    title: "AI and computer vision",
    text: "Models that see, count and respect privacy.",
    href: "/projects?tag=ai",
  },
  {
    title: "Agents and automation",
    text: "Assistants and pipelines that do real work on a schedule.",
    href: "/projects?tag=agents",
  },
  {
    title: "Security-minded web apps",
    text: "Fast, accessible apps with security built in from day one.",
    href: "/projects?tag=security",
  },
];

export function WhatIBuild() {
  return (
    <Section title="What I build" decodeTitle>
      <div className="grid gap-6 md:grid-cols-3">
        {ITEMS.map((item) => (
          <Card key={item.href} href={item.href} className="h-full">
            <h3 className="font-display text-2xl">{item.title}</h3>
            <p className="mt-3 text-muted">{item.text}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
