import { CountUp } from "@/components/motion/CountUp";
import { Halftone } from "@/components/media/Halftone";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import type { Project } from "@/lib/content";

type ProjectCardProps = {
  project: Project;
  /** 1-based position in the full list, ordered by `order`. */
  index: number;
  /** Number of projects in the full list. */
  total: number;
  size?: "md" | "lg";
};

const pad = (n: number) => String(n).padStart(2, "0");

export function ProjectCard({ project, index, total, size = "md" }: ProjectCardProps) {
  const { title, slug, tagline, tags, year, cover } = project.frontmatter;

  return (
    <Card
      data-project-card
      className="relative h-full overflow-hidden p-0 motion-safe:transition-transform motion-safe:duration-[var(--motion-base)] motion-safe:hover:-translate-y-1 focus-within:outline-1 focus-within:outline-offset-2 focus-within:outline-[var(--glow)]"
    >
      <div className="flex h-full flex-col">
        {cover ? (
          <Halftone
            src={cover}
            sizes={size === "lg" ? "(min-width: 768px) 520px, 85vw" : "(min-width: 1024px) 380px, 100vw"}
            className="aspect-video w-full border-b border-border"
          />
        ) : (
          <div aria-hidden="true" className="aspect-video w-full border-b border-border bg-surface-2" />
        )}
        <div className="flex flex-1 flex-col gap-3 p-6">
          <p data-project-index className="font-mono uppercase tracking-[0.12em] text-[11px] text-muted">
            {pad(index)} / {pad(total)}
          </p>
          <h3
            className={size === "lg" ? "font-display text-2xl break-words md:text-3xl" : "font-display text-xl break-words md:text-2xl"}
          >
            <TransitionLink
              href={`/projects/${slug}`}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {title}
            </TransitionLink>
          </h3>
          <p className="text-muted">{tagline}</p>
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
            {tags.map((tag) => (
              <Tag key={tag}>
                {tag}
              </Tag>
            ))}
            <CountUp value={year} className="ml-auto font-mono uppercase tracking-[0.12em] text-[11px] text-muted" />
          </div>
        </div>
      </div>
    </Card>
  );
}
