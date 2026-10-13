import { describe, expect, it } from "vitest";
import { filterProjects, parseTagParam } from "@/lib/filter";
import type { Project } from "@/lib/content-core";

function make(slug: string, tags: Project["frontmatter"]["tags"]): Project {
  return {
    frontmatter: {
      title: slug,
      slug,
      tagline: "Tagline",
      color: "#FF6B35",
      shape: "sphere",
      tags,
      year: 2025,
      role: "Builder",
      featured: false,
      order: 1,
      links: {},
      stack: ["TypeScript"],
    },
    body: "",
  };
}

const projects = [
  make("crowd-detection", ["ai", "computer-vision", "privacy"]),
  make("demo-web", ["web"]),
];

describe("parseTagParam", () => {
  it("returns null for unknown or missing tag", () => {
    expect(parseTagParam("nonexistent")).toBeNull();
    expect(parseTagParam(undefined)).toBeNull();
    expect(parseTagParam(["ai", "web"])).toBe("ai");
  });
  it("accepts a known tag", () => {
    expect(parseTagParam("web")).toBe("web");
  });
});

describe("filterProjects", () => {
  it("filters by tag and keeps order", () => {
    expect(filterProjects(projects, "ai").map((p) => p.frontmatter.slug)).toEqual(["crowd-detection"]);
    expect(filterProjects(projects, null)).toHaveLength(projects.length);
    expect(filterProjects(projects, "security")).toEqual([]);
  });
});
