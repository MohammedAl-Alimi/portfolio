import { ProjectCard } from "@/components/projects/ProjectCard";
import { Container } from "@/components/ui/Container";
import { getProjects, projectNumbers, type Project } from "@/lib/content";
import type { Site } from "@/lib/schemas";

type Props = { previous: Project | null; next: Project | null; labels: Site["projects"]["adjacent"] };

export async function AdjacentProjects({ previous, next, labels }: Props) {
  if (!previous && !next) return null;
  // Numbered against the full list, so the cards match the /projects page.
  const numbers = projectNumbers(await getProjects());
  const indexOf = (p: Project) => numbers.get(p.frontmatter.slug) ?? 0;
  return (
    <nav aria-label="More projects" className="border-t border-border py-16">
      <Container>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {previous ? (
            <div className="min-w-0">
              <p className="mb-3 font-mono uppercase tracking-[0.12em] text-[11px] text-muted">{labels.previous}</p>
              <ProjectCard project={previous} index={indexOf(previous)} total={numbers.size} size="md" />
            </div>
          ) : null}
          {next ? (
            <div className="min-w-0 md:col-start-2">
              <p className="mb-3 font-mono uppercase tracking-[0.12em] text-[11px] text-muted">{labels.next}</p>
              <ProjectCard project={next} index={indexOf(next)} total={numbers.size} size="md" />
            </div>
          ) : null}
        </div>
      </Container>
    </nav>
  );
}
