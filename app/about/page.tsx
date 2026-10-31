import type { Metadata } from "next";
import { Timeline } from "@/components/about/Timeline";
import { MdxBody } from "@/components/mdx/MdxBody";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { getAbout } from "@/lib/content";

export const metadata: Metadata = { title: "About | Mohammed Al-Alimi" };

export default async function AboutPage() {
  const { frontmatter, body } = await getAbout();

  return (
    <Section>
      <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)]">{frontmatter.title}</h1>
      <p className="mt-4 mb-10 max-w-2xl text-lg text-muted">{frontmatter.intro}</p>
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <MdxBody source={body} />
        </div>
        <div className="lg:col-span-5">
          <Card>
            <Timeline entries={frontmatter.timeline} />
            <h2 className="mt-8 mb-3 font-display text-xl">Outside work</h2>
            <ul className="list-disc space-y-1 pl-5 text-muted">
              {frontmatter.outside.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="mt-8">
              <Button href="/cv" variant="primary">
                Download CV
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Section>
  );
}
