import { cn } from "@/lib/cn";
import type { Project } from "@/lib/content";
import { ProjectCard } from "./ProjectCard";

type ProjectGridProps = {
  projects: Project[];
  /** Every slug, ordered by `order`. Cards number themselves from it, so a filter keeps the numbers. */
  order: string[];
};

export function ProjectGrid({ projects, order }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <p role="status" className="text-muted">
        No projects with that tag yet.
      </p>
    );
  }
  return (
    <div data-testid="project-grid" className="grid grid-cols-1 lg:grid-flow-dense gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <div
          key={project.frontmatter.slug}
          className={cn("min-w-0", project.frontmatter.featured && "lg:col-span-2")}
        >
          <ProjectCard
            project={project}
            index={order.indexOf(project.frontmatter.slug) + 1}
            total={order.length}
            size={project.frontmatter.featured ? "lg" : "md"}
          />
        </div>
      ))}
    </div>
  );
}
