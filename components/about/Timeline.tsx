import { Decode } from "@/components/motion/Decode";
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
            className="absolute top-2 -left-[28px] size-[6px] bg-text"
          />
          <p className="font-mono uppercase tracking-[0.12em] text-[11px] text-muted">{entry.year}</p>
          <Decode as="p" text={entry.title} trigger="enter" className="font-mono font-bold" />
          <p className="font-mono text-muted">{entry.detail}</p>
        </li>
      ))}
    </ol>
  );
}
