import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import type { Project } from "@/lib/content";

type ProjectCardProps = {
  project: Project;
  size?: "md" | "lg";
};

export function ProjectCard({ project, size = "md" }: ProjectCardProps) {
  const { title, slug, tagline, color, tags, year, cover } = project.frontmatter;
  const titleId = `project-title-${slug}`;

  return (
    <Card href={`/projects/${slug}`} color={color} aria-labelledby={titleId} className="h-full p-0 overflow-hidden">
      <div className="flex h-full flex-col">
        {cover ? (
          <Image
            src={cover}
            alt=""
            width={1600}
            height={900}
            sizes={size === "lg" ? "(min-width: 768px) 520px, 85vw" : "(min-width: 1024px) 380px, 100vw"}
            className="aspect-video w-full object-cover"
          />
        ) : (
          <div aria-hidden="true" className="aspect-video w-full" style={{ backgroundColor: color }} />
        )}
        <div className="flex flex-1 flex-col gap-3 p-6">
          <h3
            id={titleId}
            className={size === "lg" ? "font-display text-3xl" : "font-display text-2xl"}
          >
            {title}
          </h3>
          <p className="text-muted">{tagline}</p>
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
            {tags.map((tag) => (
              <Tag key={tag}>
                <span
                  aria-hidden="true"
                  className="mr-2 inline-block size-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {tag}
              </Tag>
            ))}
            <span className="ml-auto text-sm text-muted">{year}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
