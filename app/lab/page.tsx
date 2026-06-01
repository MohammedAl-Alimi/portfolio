import type { Metadata } from "next";
import { LabCard } from "@/components/lab/LabCard";
import { Section } from "@/components/ui/Section";
import { getLabItems } from "@/lib/content";

export const metadata: Metadata = {
  title: "Lab",
  alternates: { canonical: "/lab" },
};

export default async function LabPage() {
  const items = await getLabItems();

  return (
    <Section>
      <h1 className="font-display tracking-[-0.03em] leading-[0.9] text-[clamp(2.5rem,6vw,5rem)]">Lab</h1>
      <p className="mt-4 mb-10 text-muted">
        Small experiments and live demos. Click anything to try it.
      </p>
      {items.length === 0 ? (
        <p role="status">Nothing here yet. Check back soon.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <LabCard key={item.frontmatter.slug} item={item} />
          ))}
        </div>
      )}
    </Section>
  );
}
