import { describe, expect, it } from "vitest";
import site from "@/content/site.json";
import {
  highlightSchema,
  labFrontmatterSchema,
  profileSchema,
  projectFrontmatterSchema,
  siteSchema,
} from "@/lib/schemas";

const validProject = {
  title: "Crowd detection",
  slug: "crowd-detection",
  tagline: "Counts people without identifying anyone",
  color: "#FF6B35",
  shape: "icosahedron",
  tags: ["ai", "privacy"],
  year: 2026,
  role: "Solo developer",
  featured: true,
  order: 1,
  links: { repo: "https://github.com/example/repo" },
  cover: "/projects/crowd-detection/cover.webp",
  coverAlt: "A dashboard showing crowd counts",
  stack: ["Python", "FastAPI"],
};

const validProfile = {
  name: "Test Person",
  headline: "I build things",
  bio: "Short bio.",
  email: "test@example.com",
  location: "Germany",
  availability: "Open to roles",
  socials: {
    github: "https://github.com/example",
    linkedin: "https://www.linkedin.com/in/example",
  },
  decorationColors: ["#FFD23F", "#3BCEAC"],
};

describe("projectFrontmatterSchema", () => {
  it("accepts a full project frontmatter", () => {
    expect(projectFrontmatterSchema.safeParse(validProject).success).toBe(true);
  });

  it("applies defaults for featured and order", () => {
    const rest: Record<string, unknown> = { ...validProject };
    delete rest.featured;
    delete rest.order;
    const r = projectFrontmatterSchema.safeParse(rest);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.featured).toBe(false);
      expect(r.data.order).toBe(99);
    }
  });

  it("rejects a non-hex color", () => {
    const r = projectFrontmatterSchema.safeParse({ ...validProject, color: "orange" });
    expect(r.success).toBe(false);
  });

  it("rejects unknown keys", () => {
    expect(projectFrontmatterSchema.safeParse({ ...validProject, extra: 1 }).success).toBe(false);
  });

  it("rejects a non-https link", () => {
    expect(
      projectFrontmatterSchema.safeParse({ ...validProject, links: { repo: "javascript:alert(1)" } }).success,
    ).toBe(false);
    expect(
      projectFrontmatterSchema.safeParse({ ...validProject, links: { repo: "http://example.com" } }).success,
    ).toBe(false);
  });

  it("requires coverAlt when cover is set", () => {
    expect(projectFrontmatterSchema.safeParse({ ...validProject, coverAlt: undefined }).success).toBe(false);
  });

  it("rejects an unknown tag or shape", () => {
    expect(projectFrontmatterSchema.safeParse({ ...validProject, tags: ["nope"] }).success).toBe(false);
    expect(projectFrontmatterSchema.safeParse({ ...validProject, shape: "cube" }).success).toBe(false);
  });
});

describe("labFrontmatterSchema", () => {
  const validLab = {
    title: "Toy",
    slug: "toy",
    description: "A small toy",
    kind: "component",
    component: "toy",
    thumbnail: "/lab/toy.webp",
    thumbnailAlt: "A toy",
    order: 1,
  };

  it("accepts a component item", () => {
    expect(labFrontmatterSchema.safeParse(validLab).success).toBe(true);
  });

  it("requires component for kind component", () => {
    expect(labFrontmatterSchema.safeParse({ ...validLab, component: undefined }).success).toBe(false);
  });

  it("requires url for kind iframe", () => {
    const iframe = { ...validLab, kind: "iframe", component: undefined };
    expect(labFrontmatterSchema.safeParse(iframe).success).toBe(false);
    expect(
      labFrontmatterSchema.safeParse({ ...iframe, url: "https://example.com/toy" }).success,
    ).toBe(true);
  });
});

describe("highlightSchema", () => {
  it("accepts a linkedin.com url", () => {
    expect(
      highlightSchema.safeParse({
        url: "https://www.linkedin.com/posts/x",
        date: "2026-01-01",
        caption: "x",
      }).success,
    ).toBe(true);
  });

  it("requires a linkedin.com url", () => {
    expect(
      highlightSchema.safeParse({ url: "https://example.com/x", date: "2026-01-01", caption: "x" }).success,
    ).toBe(false);
  });

  it("rejects a lookalike host", () => {
    expect(
      highlightSchema.safeParse({
        url: "https://linkedin.com.evil.test/x",
        date: "2026-01-01",
        caption: "x",
      }).success,
    ).toBe(false);
  });
});

describe("profileSchema", () => {
  it("accepts a valid profile", () => {
    expect(profileSchema.safeParse(validProfile).success).toBe(true);
  });

  it("rejects a bad email", () => {
    expect(profileSchema.safeParse({ ...validProfile, email: "nope" }).success).toBe(false);
  });

  it("needs between 2 and 6 decoration colors", () => {
    expect(profileSchema.safeParse({ ...validProfile, decorationColors: ["#FFD23F"] }).success).toBe(false);
  });
});

describe("siteSchema", () => {
  it("parses content/site.json", () => {
    expect(siteSchema.safeParse(site).success).toBe(true);
  });

  it("rejects an unknown key at the top and inside a group", () => {
    expect(siteSchema.safeParse({ ...site, extra: "x" }).success).toBe(false);
    expect(siteSchema.safeParse({ ...site, lab: { ...site.lab, extra: "x" } }).success).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(siteSchema.safeParse({ ...site, footer: { line: "" } }).success).toBe(false);
  });

  it("rejects a missing group", () => {
    const rest: Record<string, unknown> = { ...site };
    delete rest.contact;
    expect(siteSchema.safeParse(rest).success).toBe(false);
  });
});
