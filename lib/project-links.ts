export type ProjectLink = { label: "Repo" | "Live" | "Demo"; href: string };

export function projectLinks(links: { repo?: string; live?: string; demo?: string }): ProjectLink[] {
  const all: [ProjectLink["label"], string | undefined][] = [
    ["Repo", links.repo],
    ["Live", links.live],
    ["Demo", links.demo],
  ];
  return all.flatMap(([label, href]) => (href ? [{ label, href }] : []));
}
