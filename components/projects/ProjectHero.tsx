import { Halftone } from "@/components/media/Halftone";
import { Decode } from "@/components/motion/Decode";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { Project } from "@/lib/content";
import { projectLinks } from "@/lib/project-links";

// Same lines as the page overlay (components/ui/Overlays.tsx); the mid tier hides both.
const SCANLINES = "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 2px)";

export function ProjectHero({ project }: { project: Project }) {
  const { title, tagline, year, role, links, cover } = project.frontmatter;
  const present = projectLinks(links);

  return (
    <section
      aria-labelledby="project-title"
      data-project-shape-slot
      className="relative overflow-hidden bg-bg text-text"
    >
      {cover ? (
        <div aria-hidden="true" data-project-backdrop className="pointer-events-none absolute inset-0">
          <Halftone src={cover} sizes="100vw" resolve="none" className="absolute inset-0 opacity-20" />
          <div data-overlay-scanlines className="absolute inset-0" style={{ background: SCANLINES }} />
        </div>
      ) : null}
      <Container className="relative py-[96px] md:py-[128px]">
        <p className="mb-6 font-mono uppercase tracking-[0.12em] text-[11px] text-muted">
          {year} · {role}
        </p>
        <Decode
          as="h1"
          id="project-title"
          text={title}
          trigger="load"
          className="font-display tracking-[-0.03em] text-[clamp(1.75rem,7vw,6rem)] leading-[0.9] mb-6 break-words"
        />
        <p className="text-xl md:text-2xl max-w-[40ch]">{tagline}</p>
        {present.length > 0 ? (
          <div className="mt-10 flex flex-wrap gap-3">
            {present.map(({ label, href }) => (
              <Button key={label} variant="secondary" external href={href}>
                {label}
              </Button>
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
