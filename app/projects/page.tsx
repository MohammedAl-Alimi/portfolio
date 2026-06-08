import type { Metadata } from "next";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { TagFilter } from "@/components/projects/TagFilter";
import { Section } from "@/components/ui/Section";
import { getProjects, getSite, orderProjects, projectNumbers } from "@/lib/content";
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
  const [all, site] = await Promise.all([getProjects(), getSite()]);
  const copy = site.projects;
  const projects = orderProjects(all);
  const visible = rawTag !== undefined && active === null ? [] : filterProjects(projects, active);

  return (
    <Section>
      <h1 className="font-display tracking-[-0.03em] leading-[0.9] text-[clamp(1.75rem,6vw,5rem)]">{copy.title}</h1>
      <p className="mt-4 mb-8 text-muted">{copy.intro}</p>
      <div className="mb-10">
        <TagFilter active={active} allLabel={copy.all} />
      </div>
      <ProjectGrid projects={visible} numbers={projectNumbers(all)} emptyText={copy.empty} />
    </Section>
  );
}
