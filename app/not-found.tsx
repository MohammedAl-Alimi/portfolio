import type { Metadata } from "next";
import { StaticField } from "@/components/three/StaticField";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { getSite } from "@/lib/content";

export const metadata: Metadata = {
  title: "Page not found",
};

export default async function NotFound() {
  const { notFound: copy } = await getSite();
  return (
    <Section>
      <StaticField />
      <h1 className="font-display text-center tracking-[-0.03em] leading-[0.9] text-[clamp(1.75rem,6vw,5rem)]">
        {copy.title}
      </h1>
      <p className="mt-4 text-center text-muted">{copy.text}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/">{copy.home}</Button>
        <Button href="/projects" variant="secondary">
          {copy.projects}
        </Button>
      </div>
    </Section>
  );
}
