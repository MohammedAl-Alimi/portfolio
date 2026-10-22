import type { Metadata } from "next";
import { headers } from "next/headers";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { Hero } from "@/components/home/Hero";
import { WhatIBuild } from "@/components/home/WhatIBuild";
import { Ticker } from "@/components/motion/Ticker";
import { JsonLd } from "@/components/seo/JsonLd";
import { Section } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/Skeleton";
import { getHighlights, getProfile, getProjects } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

const TICKER = "AI · AGENTS · COMPUTER VISION · SECURITY · SYSTEMS";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return { description: profile.headline, alternates: { canonical: "/" } };
}

export default async function Home() {
  const [profile, projects, highlights, headerList] = await Promise.all([
    getProfile(),
    getProjects(),
    getHighlights(),
    headers(),
  ]);
  const nonce = headerList.get("x-nonce") ?? undefined;

  return (
    <>
      <JsonLd
        nonce={nonce}
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: profile.name,
          url: SITE_URL,
          jobTitle: profile.headline,
          sameAs: [profile.socials.github, profile.socials.linkedin],
          email: `mailto:${profile.email}`,
        }}
      />
      <Hero profile={profile} />
      <Ticker text={TICKER} />
      <WhatIBuild />
      <FeaturedProjects projects={projects} />
      <Ticker text={TICKER} />
      <Section id="right-now" title="Right now">
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[240px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
        <p className="sr-only">Live activity loads here soon.</p>
      </Section>
      {highlights.length > 0 ? (
        <Section id="highlights" title="Highlights">
          <ul className="grid gap-4 md:grid-cols-3">
            {highlights.map((h) => (
              <li key={h.url}>
                <a href={h.url} target="_blank" rel="noopener noreferrer" className="underline">
                  {h.caption}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
