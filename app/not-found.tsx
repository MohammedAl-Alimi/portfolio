import type { Metadata } from "next";
import { StaticField } from "@/components/three/StaticField";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <Section>
      <StaticField />
      <h1 className="font-display text-center tracking-[-0.03em] leading-[0.9] text-[clamp(1.75rem,6vw,5rem)]">
        This page wandered off.
      </h1>
      <p className="mt-4 text-center text-muted">The link may be old, or the page moved.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/">Home</Button>
        <Button href="/projects" variant="secondary">
          Projects
        </Button>
      </div>
    </Section>
  );
}
