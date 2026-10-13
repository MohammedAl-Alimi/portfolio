import type { Project } from "@/lib/content-core";
import { TAG_NAMES, type TagName } from "@/lib/schemas";

export function parseTagParam(value: string | string[] | undefined): TagName | null {
  const first = Array.isArray(value) ? value[0] : value;
  if (first === undefined) return null;
  return (TAG_NAMES as readonly string[]).includes(first) ? (first as TagName) : null;
}

export function filterProjects(projects: Project[], tag: TagName | null): Project[] {
  if (tag === null) return projects;
  return projects.filter((project) => project.frontmatter.tags.includes(tag));
}
