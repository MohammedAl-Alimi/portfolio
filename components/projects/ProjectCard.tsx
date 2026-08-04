import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import type { Project } from "@/lib/content";

type ProjectCardProps = {
  project: Project;
  size?: "md" | "lg";
};

export function ProjectCard({ project, size = "md" }: ProjectCardProps) {
  const { title, slug, tagline, color, tags, year, cover } = project.frontmatter;

  return (
    <Card
      data-project-card
      color={color}
      className="relative h-full overflow-hidden p-0 motion-safe:transition-transform motion-safe:duration-[var(--motion-base)] motion-safe:hover:-translate-y-1 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-current"
    >
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
            className={size === "lg" ? "font-display text-2xl break-words md:text-3xl" : "font-display text-xl break-words md:text-2xl"}
          >
            <Link
              href={`/projects/${slug}`}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {title}
            </Link>
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
            <span className="ml-auto font-mono uppercase tracking-[0.12em] text-[11px] text-muted">{year}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
