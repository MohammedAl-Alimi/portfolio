import type { Metadata } from "next";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { Hero } from "@/components/home/Hero";
import { WhatIBuild } from "@/components/home/WhatIBuild";
import { Section } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/Skeleton";
import { getHighlights, getProfile, getProjects } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return { title: "Mohammed Al-Alimi", description: profile.headline };
}

export default async function Home() {
  const [profile, projects, highlights] = await Promise.all([
    getProfile(),
    getProjects(),
    getHighlights(),
  ]);

  return (
    <>
      <Hero profile={profile} />
      <WhatIBuild />
      <FeaturedProjects projects={projects} />
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
