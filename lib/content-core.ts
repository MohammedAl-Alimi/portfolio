import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import {
  type Highlight,
  type LabFrontmatter,
  type Profile,
  type ProjectFrontmatter,
  highlightSchema,
  labFrontmatterSchema,
  profileSchema,
  projectFrontmatterSchema,
} from "./schemas";

export type Project = { frontmatter: ProjectFrontmatter; body: string };
export type LabItem = { frontmatter: LabFrontmatter; body: string };

const defaultDir = () => path.join(process.cwd(), "content");

function describeIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"} ${issue.message}`)
    .join("; ");
}

function isMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

async function readMdxFolder<T extends { slug: string }>(
  folder: string,
  schema: z.ZodType<T>,
): Promise<{ frontmatter: T; body: string }[]> {
  let names: string[];
  try {
    names = await readdir(folder);
  } catch (error) {
    if (isMissing(error)) return [];
    throw error;
  }
  const files = names.filter((name) => name.endsWith(".mdx")).sort();
  const items = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(folder, file), "utf8");
      const parsed = matter(raw);
      const result = schema.safeParse(parsed.data);
      if (!result.success) {
        throw new Error(`Invalid frontmatter in ${file}: ${describeIssues(result.error)}`);
      }
      if (`${result.data.slug}.mdx` !== file) {
        throw new Error(`Invalid frontmatter in ${file}: slug must match the file name`);
      }
      return { frontmatter: result.data, body: parsed.content };
    }),
  );
  return items;
}

async function readJson<T>(file: string, schema: z.ZodType<T>, fallback?: T): Promise<T> {
  let raw: string;
  try {
    raw = await readFile(file, "utf8");
  } catch (error) {
    if (isMissing(error) && fallback !== undefined) return fallback;
    throw new Error(`Could not read ${path.basename(file)}: ${error instanceof Error ? error.message : String(error)}`);
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in ${path.basename(file)}`);
  }
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid content in ${path.basename(file)}: ${describeIssues(result.error)}`);
  }
  return result.data;
}

export async function getProjects(dir: string = defaultDir()): Promise<Project[]> {
  const items = await readMdxFolder(path.join(dir, "projects"), projectFrontmatterSchema);
  return items.sort(
    (a, b) =>
      a.frontmatter.order - b.frontmatter.order || b.frontmatter.year - a.frontmatter.year,
  );
}

export async function getProject(slug: string, dir?: string): Promise<Project | null> {
  const projects = await getProjects(dir);
  return projects.find((p) => p.frontmatter.slug === slug) ?? null;
}

export async function getLabItems(dir: string = defaultDir()): Promise<LabItem[]> {
  const items = await readMdxFolder(path.join(dir, "lab"), labFrontmatterSchema);
  return items.sort((a, b) => a.frontmatter.order - b.frontmatter.order);
}

export async function getLabItem(slug: string, dir?: string): Promise<LabItem | null> {
  const items = await getLabItems(dir);
  return items.find((p) => p.frontmatter.slug === slug) ?? null;
}

export async function getHighlights(dir: string = defaultDir()): Promise<Highlight[]> {
  const highlights = await readJson(
    path.join(dir, "highlights.json"),
    z.array(highlightSchema),
    [],
  );
  return highlights.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getProfile(dir: string = defaultDir()): Promise<Profile> {
  return readJson(path.join(dir, "profile.json"), profileSchema);
}

export async function getAdjacentProjects(
  slug: string,
  dir?: string,
): Promise<{ previous: Project | null; next: Project | null }> {
  const projects = await getProjects(dir);
  const index = projects.findIndex((p) => p.frontmatter.slug === slug);
  if (index === -1) return { previous: null, next: null };
  return { previous: projects[index - 1] ?? null, next: projects[index + 1] ?? null };
}
