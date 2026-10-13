import Link from "next/link";
import { cn } from "@/lib/cn";
import { TAG_NAMES, type TagName } from "@/lib/schemas";

type TagFilterProps = { active: TagName | null };

const chip =
  "inline-flex min-h-[44px] items-center rounded-full px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";

function chipClass(isActive: boolean) {
  return cn(chip, isActive ? "bg-text text-bg" : "border border-border bg-surface");
}

export function TagFilter({ active }: TagFilterProps) {
  return (
    <nav aria-label="Filter by tag">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href="/projects"
            aria-current={active === null ? "true" : undefined}
            className={chipClass(active === null)}
          >
            All
          </Link>
        </li>
        {TAG_NAMES.map((tag) => (
          <li key={tag}>
            <Link
              href={`/projects?tag=${tag}`}
              aria-current={active === tag ? "true" : undefined}
              className={chipClass(active === tag)}
            >
              {tag}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
