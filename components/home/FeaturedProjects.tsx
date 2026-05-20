import { ProjectCard } from "@/components/projects/ProjectCard";
import { Section } from "@/components/ui/Section";
import { projectNumbers, type Project } from "@/lib/content";

/** `projects` is the full list from getProjects(); cards number from it like the /projects grid. */
export function FeaturedProjects({ projects }: { projects: Project[] }) {
  const featured = projects.filter((p) => p.frontmatter.featured);
  if (featured.length === 0) return null;
  const numbers = projectNumbers(projects);

  return (
    <Section title="Featured projects" decodeTitle>
      <section aria-label="Featured projects">
        {/* Sideways swipes scroll the strip natively; Lenis keeps vertical ones. */}
        <div
          data-lenis-prevent-horizontal
          className="-mx-4 -mt-2 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4 pt-2"
        >
          {featured.map((project) => (
            <div key={project.frontmatter.slug} className="w-[85vw] shrink-0 snap-start md:w-[520px]">
              <ProjectCard project={project} index={numbers.get(project.frontmatter.slug) ?? 0} total={numbers.size} size="lg" />
            </div>
          ))}
        </div>
      </section>
    </Section>
  );
}
