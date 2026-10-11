import type { AboutFrontmatter } from "@/lib/schemas";

type TimelineProps = { entries: AboutFrontmatter["timeline"] };

export function Timeline({ entries }: TimelineProps) {
  return (
    <ol
      aria-label="Timeline"
      data-about-timeline
      className="relative ml-2 border-l border-border pl-6"
    >
      {entries.map((entry) => (
        <li key={`${entry.year}-${entry.title}`} className="relative pb-6 last:pb-0">
          <span
            aria-hidden="true"
            className="absolute top-1.5 -left-[31px] size-3 rounded-full bg-accent-1"
          />
          <p className="font-mono text-sm text-muted">{entry.year}</p>
          <p className="font-bold">{entry.title}</p>
          <p className="text-muted">{entry.detail}</p>
        </li>
      ))}
    </ol>
  );
}
