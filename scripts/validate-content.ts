import { existsSync } from "node:fs";
import path from "node:path";
import {
  getAbout,
  getHighlights,
  getLabItems,
  getProfile,
  getProjects,
} from "../lib/content-core";
import { isAllowedLabOrigin } from "../lib/lab-origins";
import { findRawTag } from "../lib/mdx-guard";

const errors: string[] = [];

function assertUnique(kind: string, slugs: string[]) {
  const seen = new Set<string>();
  for (const slug of slugs) {
    if (seen.has(slug)) errors.push(`Duplicate ${kind} slug: ${slug}`);
    seen.add(slug);
  }
}

function assertPublicFile(label: string, publicPath: string) {
  const file = path.join(process.cwd(), "public", publicPath);
  if (!existsSync(file)) errors.push(`${label} not found: public${publicPath}`);
}

async function main() {
  const [projects, lab, highlights] = await Promise.all([
    getProjects(),
    getLabItems(),
    getHighlights(),
  ]);
  await getProfile();
  const about = await getAbout();

  assertUnique("project", projects.map((p) => p.frontmatter.slug));
  assertUnique("lab", lab.map((p) => p.frontmatter.slug));

  const bodies = [
    ...projects.map((p) => ({ file: `content/projects/${p.frontmatter.slug}.mdx`, body: p.body })),
    ...lab.map((p) => ({ file: `content/lab/${p.frontmatter.slug}.mdx`, body: p.body })),
    { file: "content/about.mdx", body: about.body },
  ];
  for (const { file, body } of bodies) {
    const hit = findRawTag(body);
    if (hit) {
      errors.push(`${file} has a raw HTML tag (body line ${hit.line}): ${hit.text}. Use plain Markdown.`);
    }
  }

  for (const { frontmatter } of projects) {
    if (frontmatter.cover) assertPublicFile(`Cover for ${frontmatter.slug}`, frontmatter.cover);
  }
  for (const { frontmatter } of lab) {
    assertPublicFile(`Thumbnail for ${frontmatter.slug}`, frontmatter.thumbnail);
    if (frontmatter.kind === "iframe" && (!frontmatter.url || !isAllowedLabOrigin(frontmatter.url))) {
      errors.push(
        `Lab item ${frontmatter.slug} embeds an origin not in LAB_FRAME_ORIGINS (lib/lab-origins.ts)`,
      );
    }
  }

  if (errors.length > 0) {
    for (const message of errors) console.error(`validate-content: ${message}`);
    process.exit(1);
  }
  console.log(`projects: ${projects.length}, lab: ${lab.length}, highlights: ${highlights.length}`);
}

main().catch((error: unknown) => {
  console.error(`validate-content: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
