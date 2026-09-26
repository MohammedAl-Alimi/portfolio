import type { Metadata } from "next";
import { headers } from "next/headers";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { Hero } from "@/components/home/Hero";
import { WhatIBuild } from "@/components/home/WhatIBuild";
import { Ticker } from "@/components/motion/Ticker";
import { JsonLd } from "@/components/seo/JsonLd";
import { Section } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/Skeleton";
import { getHighlights, getProfile, getProjects, getSite } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return { description: profile.headline, alternates: { canonical: "/" } };
}

export default async function Home() {
  const [profile, projects, highlights, site, headerList] = await Promise.all([
    getProfile(),
    getProjects(),
    getHighlights(),
    getSite(),
    headers(),
  ]);
  const copy = site.home;
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
      <Hero profile={profile} copy={copy} />
      <Ticker text={copy.ticker} />
      <WhatIBuild copy={copy.whatIBuild} />
      <FeaturedProjects projects={projects} title={copy.featured.title} />
      <Ticker text={copy.ticker} />
      <Section id="right-now" title={copy.rightNow.title} decodeTitle>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[240px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
        <p className="sr-only">{copy.rightNow.loading}</p>
      </Section>
      {highlights.length > 0 ? (
        <Section id="highlights" title={copy.highlights.title} decodeTitle>
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
