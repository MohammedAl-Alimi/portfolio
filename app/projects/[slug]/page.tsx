import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdjacentProjects } from "@/components/projects/AdjacentProjects";
import { ProjectBody } from "@/components/projects/ProjectBody";
import { ProjectHero } from "@/components/projects/ProjectHero";
import { ProjectMeta } from "@/components/projects/ProjectMeta";
import { Container } from "@/components/ui/Container";
import { getAdjacentProjects, getProject, getProjects, getSite } from "@/lib/content";
import { SITE_NAME } from "@/lib/site";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.frontmatter.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};
  const { title, tagline } = project.frontmatter;
  return {
    title,
    description: tagline,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: { title, description: tagline, type: "article", siteName: SITE_NAME, locale: "en" },
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  const [{ previous, next }, site] = await Promise.all([getAdjacentProjects(slug), getSite()]);

  return (
    <>
      <ProjectHero project={project} />
      <Container className="grid gap-12 py-16 lg:grid-cols-12 md:py-24">
        <div className="lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:sticky lg:top-24 lg:self-start">
          <ProjectMeta project={project} labels={site.projects.meta} />
        </div>
        <div className="min-w-0 lg:col-span-8 lg:col-start-1 lg:row-start-1 [&>div>*:first-child]:mt-0">
          <ProjectBody source={project.body} />
        </div>
      </Container>
      <AdjacentProjects previous={previous} next={next} labels={site.projects.adjacent} />
    </>
  );
}
