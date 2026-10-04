import { ProjectCard } from "@/components/projects/ProjectCard";
import { Container } from "@/components/ui/Container";
import type { Project } from "@/lib/content";

type Props = { previous: Project | null; next: Project | null };

export function AdjacentProjects({ previous, next }: Props) {
  if (!previous && !next) return null;
  return (
    <nav aria-label="More projects" className="border-t border-border py-16">
      <Container>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {previous ? (
            <div className="min-w-0">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Previous</p>
              <ProjectCard project={previous} size="md" />
            </div>
          ) : null}
          {next ? (
            <div className="min-w-0 md:col-start-2">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Next</p>
              <ProjectCard project={next} size="md" />
            </div>
          ) : null}
        </div>
      </Container>
    </nav>
  );
}
