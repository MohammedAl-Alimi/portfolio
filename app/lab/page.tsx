import type { Metadata } from "next";
import { LabCard } from "@/components/lab/LabCard";
import { Section } from "@/components/ui/Section";
import { getLabItems, getSite } from "@/lib/content";

export const metadata: Metadata = {
  title: "Lab",
  alternates: { canonical: "/lab" },
};

export default async function LabPage() {
  const [items, site] = await Promise.all([getLabItems(), getSite()]);
  const copy = site.lab;

  return (
    <Section>
      <h1 className="font-display tracking-[-0.03em] leading-[0.9] text-[clamp(1.75rem,6vw,5rem)]">{copy.title}</h1>
      <p className="mt-4 mb-10 text-muted">{copy.intro}</p>
      {items.length === 0 ? (
        <p role="status">{copy.empty}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <LabCard key={item.frontmatter.slug} item={item} tryLabel={copy.try} />
          ))}
        </div>
      )}
    </Section>
  );
}
