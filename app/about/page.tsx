import type { Metadata } from "next";
import { Timeline } from "@/components/about/Timeline";
import { MdxBody } from "@/components/mdx/MdxBody";
import { Decode } from "@/components/motion/Decode";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { getAbout, getSite } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const [{ frontmatter, body }, site] = await Promise.all([getAbout(), getSite()]);

  return (
    <Section>
      <Decode as="h1" text={frontmatter.title} trigger="load" className="font-display tracking-[-0.03em] leading-[0.9] text-[clamp(1.75rem,6vw,5rem)]" />
      <p className="mt-4 mb-10 max-w-2xl font-mono text-lg text-muted">{frontmatter.intro}</p>
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <MdxBody source={body} />
        </div>
        <div className="lg:col-span-5">
          <Card>
            <Timeline entries={frontmatter.timeline} />
            <h2 className="mt-8 mb-3 font-mono uppercase tracking-[0.12em] text-[11px] text-muted">
              {site.about.outside}
            </h2>
            <ul className="list-disc space-y-1 pl-5 font-mono text-muted">
              {frontmatter.outside.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="mt-8">
              <Button href="/cv" variant="secondary">
                {site.about.cv}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Section>
  );
}
