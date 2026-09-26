import { Button } from "@/components/ui/Button";
import { Brackets } from "@/components/ui/Brackets";
import { Tag } from "@/components/ui/Tag";
import type { Project } from "@/lib/content";
import { projectLinks } from "@/lib/project-links";
import type { Site } from "@/lib/schemas";

function Label({ children }: { children: string }) {
  return <dt className="mb-2 font-mono uppercase tracking-[0.12em] text-[11px] text-muted">{children}</dt>;
}

export function ProjectMeta({ project, labels }: { project: Project; labels: Site["projects"]["meta"] }) {
  // Year and role are in the hero line above, so the panel starts at the stack.
  const { stack, tags, links } = project.frontmatter;
  const present = projectLinks(links);

  return (
    <aside aria-label="Project details">
      <Brackets hover={false} className="bg-surface border border-border p-6">
        <dl className="space-y-6">
          <div>
            <Label>{labels.stack}</Label>
            <dd className="flex flex-wrap gap-2">
              {stack.map((item) => (
                <Tag key={item}>{item}</Tag>
              ))}
            </dd>
          </div>
          <div>
            <Label>{labels.tags}</Label>
            <dd className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Tag key={tag}>
                  {tag}
                </Tag>
              ))}
            </dd>
          </div>
        </dl>
        {present.length > 0 ? (
          <ul className="mt-6 flex flex-col items-start gap-1 border-t border-border pt-4">
            {present.map(({ label, href }) => (
              <li key={label}>
                <Button variant="ghost" external href={href}>
                  {label}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </Brackets>
    </aside>
  );
}
