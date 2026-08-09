import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import type { Project } from "@/lib/content";
import { projectLinks } from "@/lib/project-links";

function Label({ children }: { children: string }) {
  return <dt className="mb-2 font-pixel text-[11px] uppercase tracking-wider text-muted">{children}</dt>;
}

export function ProjectMeta({ project }: { project: Project }) {
  const { year, role, stack, tags, color, links } = project.frontmatter;
  const present = projectLinks(links);

  return (
    <aside aria-label="Project details">
      <Card className="p-6">
        <dl className="space-y-6">
          <div>
            <Label>Year</Label>
            <dd>{year}</dd>
          </div>
          <div>
            <Label>Role</Label>
            <dd>{role}</dd>
          </div>
          <div>
            <Label>Stack</Label>
            <dd className="flex flex-wrap gap-2">
              {stack.map((item) => (
                <Tag key={item}>{item}</Tag>
              ))}
            </dd>
          </div>
          <div>
            <Label>Tags</Label>
            <dd className="flex flex-wrap gap-2">
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
      </Card>
    </aside>
  );
}
