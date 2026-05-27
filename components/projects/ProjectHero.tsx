import type { CSSProperties } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { contrastText } from "@/lib/color";
import type { Project } from "@/lib/content";
import { projectLinks } from "@/lib/project-links";

export function ProjectHero({ project }: { project: Project }) {
  const { title, tagline, color, year, role, links } = project.frontmatter;
  const present = projectLinks(links);
  const style = {
    "--project-color": color,
    backgroundColor: "var(--project-color)",
    color: contrastText(color),
  } as CSSProperties;

  return (
    <section aria-labelledby="project-title" data-project-shape-slot style={style}>
      <Container className="py-[96px] md:py-[128px]">
        <p className="mb-6 text-sm font-semibold uppercase tracking-wider">
          {year} · {role}
        </p>
        <h1
          id="project-title"
          className="font-display tracking-[-0.03em] text-[clamp(1.75rem,7vw,6rem)] leading-[0.9] mb-6 break-words"
        >
          {title}
        </h1>
        <p className="text-xl md:text-2xl max-w-[40ch]">{tagline}</p>
        {present.length > 0 ? (
          <div className="mt-10 flex flex-wrap gap-3">
            {present.map(({ label, href }) => (
              <Button
                key={label}
                variant="secondary"
                external
                href={href}
                className="border-current text-current bg-transparent hover:bg-current/10"
              >
                {label}
              </Button>
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
