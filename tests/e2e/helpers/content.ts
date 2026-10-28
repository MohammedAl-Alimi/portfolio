import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type ProjectInfo = {
  title: string;
  slug: string;
  featured: boolean;
  year: number;
  order: number;
};

export function allProjects(): ProjectInfo[] {
  const dir = path.join(process.cwd(), "content/projects");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .sort()
    .map((f) => {
      const data = matter(fs.readFileSync(path.join(dir, f), "utf8")).data as Record<string, unknown>;
      return {
        title: String(data.title),
        slug: String(data.slug),
        featured: data.featured === true,
        year: Number(data.year),
        order: Number(data.order),
      };
    });
}

export function featuredProjects(): ProjectInfo[] {
  return allProjects().filter((p) => p.featured);
}
