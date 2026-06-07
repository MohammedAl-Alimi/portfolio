import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComponentSlot } from "@/components/lab/ComponentSlot";
import { HowItWorks } from "@/components/lab/HowItWorks";
import { LabFrame } from "@/components/lab/LabFrame";
import { MdxBody } from "@/components/mdx/MdxBody";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { getLabItem, getLabItems } from "@/lib/content";
import { SITE_NAME } from "@/lib/site";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  const items = await getLabItems();
  return items.map((item) => ({ slug: item.frontmatter.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getLabItem(slug);
  if (!item) return {};
  const { title, description } = item.frontmatter;
  return {
    title,
    description,
    alternates: { canonical: `/lab/${slug}` },
    openGraph: { title, description, type: "website", siteName: SITE_NAME, locale: "en" },
  };
}

export default async function LabItemPage({ params }: PageProps) {
  const { slug } = await params;
  const item = await getLabItem(slug);
  if (!item) notFound();
  const { title, description, kind, url, component } = item.frontmatter;

  return (
    <Section>
      <h1 className="font-display tracking-[-0.03em] leading-[0.9] text-[clamp(1.75rem,6vw,5rem)]">{title}</h1>
      <p className="mt-4 mb-8 text-muted">{description}</p>
      <div data-lab-slot={slug}>
        {kind === "iframe" && url ? (
          <LabFrame url={url} title={title} />
        ) : (
          <ComponentSlot name={component ?? ""} />
        )}
      </div>
      <HowItWorks>
        <MdxBody source={item.body} />
      </HowItWorks>
      <div className="mt-10">
        <Button href="/lab" variant="ghost">
          Back to Lab
        </Button>
      </div>
    </Section>
  );
}
