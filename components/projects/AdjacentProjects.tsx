import { ProjectCard } from "@/components/projects/ProjectCard";
import { Container } from "@/components/ui/Container";
import { getProjects, type Project } from "@/lib/content";

type Props = { previous: Project | null; next: Project | null };

export async function AdjacentProjects({ previous, next }: Props) {
  if (!previous && !next) return null;
  // Numbered against the full list, so the cards match the /projects page.
  const order = (await getProjects()).map((p) => p.frontmatter.slug);
  const indexOf = (p: Project) => order.indexOf(p.frontmatter.slug) + 1;
  return (
    <nav aria-label="More projects" className="border-t border-border py-16">
      <Container>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {previous ? (
            <div className="min-w-0">
              <p className="mb-3 font-mono uppercase tracking-[0.12em] text-[11px] text-muted">Previous</p>
              <ProjectCard project={previous} index={indexOf(previous)} total={order.length} size="md" />
            </div>
          ) : null}
          {next ? (
            <div className="min-w-0 md:col-start-2">
              <p className="mb-3 font-mono uppercase tracking-[0.12em] text-[11px] text-muted">Next</p>
              <ProjectCard project={next} index={indexOf(next)} total={order.length} size="md" />
            </div>
          ) : null}
        </div>
      </Container>
    </nav>
  );
}
