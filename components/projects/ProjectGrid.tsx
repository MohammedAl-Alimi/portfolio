import { cn } from "@/lib/cn";
import type { Project } from "@/lib/content";
import { ProjectCard } from "./ProjectCard";

type ProjectGridProps = { projects: Project[] };

export function ProjectGrid({ projects }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <p role="status" className="text-muted">
        No projects with that tag yet.
      </p>
    );
  }
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <div
          key={project.frontmatter.slug}
          className={cn(project.frontmatter.featured && "lg:col-span-2")}
        >
          <ProjectCard project={project} size={project.frontmatter.featured ? "lg" : "md"} />
        </div>
      ))}
    </div>
  );
}
