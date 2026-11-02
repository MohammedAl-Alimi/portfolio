import fs from "node:fs";
import path from "node:path";

/** Every project slug, from the content files. */
export const projectSlugs = fs
  .readdirSync(path.join(process.cwd(), "content/projects"))
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => f.replace(/\.mdx$/, ""))
  .sort();

/** The pages the a11y and colour checks visit: one of each kind, plus the 404. */
export const sitePaths = [
  "/",
  "/projects",
  ...projectSlugs.map((s) => `/projects/${s}`),
  "/lab",
  "/lab/crowd-dashboard",
  "/lab/figure",
  "/about",
  "/contact",
  "/nope",
];
