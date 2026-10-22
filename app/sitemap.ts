import type { MetadataRoute } from "next";
import { getLabItems, getProjects } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, labItems] = await Promise.all([getProjects(), getLabItems()]);
  const lastModified = new Date();
  const entry = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "monthly",
    priority,
  });
  return [
    entry("/", 1),
    entry("/projects", 0.6),
    entry("/about", 0.6),
    entry("/lab", 0.6),
    entry("/contact", 0.6),
    ...projects.map((p) => entry(`/projects/${p.frontmatter.slug}`, 0.8)),
    ...labItems.map((l) => entry(`/lab/${l.frontmatter.slug}`, 0.6)),
  ];
}
