import type { Metadata } from "next";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { TagFilter } from "@/components/projects/TagFilter";
import { Section } from "@/components/ui/Section";
import { getProjects } from "@/lib/content";
import { filterProjects, parseTagParam } from "@/lib/filter";

export const metadata: Metadata = {
  title: "Projects",
  alternates: { canonical: "/projects" },
};

type ProjectsPageProps = {
  searchParams: Promise<{ tag?: string | string[] }>;
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const { tag } = await searchParams;
  const rawTag = Array.isArray(tag) ? tag[0] : tag;
  const active = parseTagParam(tag);
  const projects = await getProjects();
  const visible = rawTag !== undefined && active === null ? [] : filterProjects(projects, active);

  return (
    <Section>
      <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)]">Projects</h1>
      <p className="mt-4 mb-8 text-muted">Things I have shipped. Newest first.</p>
      <div className="mb-10">
        <TagFilter active={active} />
      </div>
      <ProjectGrid projects={visible} />
    </Section>
  );
}
