import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getAbout,
  getAdjacentProjects,
  getHighlights,
  getLabItem,
  getLabItems,
  getProfile,
  getProject,
  getProjects,
  sortProjectsByYear,
} from "@/lib/content-core";

const fixturesDir = path.join(__dirname, "..", "fixtures", "content");
const invalidFixturesDir = path.join(__dirname, "..", "fixtures", "content-invalid");
const invalidAboutDir = path.join(__dirname, "..", "fixtures", "content-invalid-about");
const emptyDir = path.join(__dirname, "..", "fixtures", "does-not-exist");

describe("project loaders", () => {
  it("loads projects sorted by order then year desc", async () => {
    const p = await getProjects(fixturesDir);
    expect(p.map((x) => x.frontmatter.slug)).toEqual(["valid", "second"]);
  });

  it("returns the body without frontmatter", async () => {
    const project = await getProject("valid", fixturesDir);
    expect(project?.body.trim()).toBe("Body of valid.");
  });

  it("returns null for unknown slug", async () => {
    expect(await getProject("nope", fixturesDir)).toBeNull();
  });

  it("throws a message naming the file and field on invalid frontmatter", async () => {
    await expect(getProjects(invalidFixturesDir)).rejects.toThrow(/invalid-color\.mdx.*color/);
  });

  it("returns previous and next by sorted position", async () => {
    const first = await getAdjacentProjects("valid", fixturesDir);
    expect(first.previous).toBeNull();
    expect(first.next?.frontmatter.slug).toBe("second");
    const last = await getAdjacentProjects("second", fixturesDir);
    expect(last.previous?.frontmatter.slug).toBe("valid");
    expect(last.next).toBeNull();
  });

  it("returns an empty list when the folder is missing", async () => {
    expect(await getProjects(emptyDir)).toEqual([]);
  });
});

describe("lab, highlights and profile loaders", () => {
  it("loads lab items", async () => {
    const items = await getLabItems(fixturesDir);
    expect(items.map((x) => x.frontmatter.slug)).toEqual(["toy"]);
    expect((await getLabItem("toy", fixturesDir))?.frontmatter.title).toBe("Toy");
    expect(await getLabItem("nope", fixturesDir)).toBeNull();
  });

  it("loads highlights", async () => {
    const h = await getHighlights(fixturesDir);
    expect(h).toHaveLength(1);
  });

  it("loads the profile", async () => {
    const profile = await getProfile(fixturesDir);
    expect(profile.name).toBe("Test Person");
  });

  it("throws a clear error for a missing profile", async () => {
    await expect(getProfile(emptyDir)).rejects.toThrow(/profile\.json/);
  });
});

describe("about loader", () => {
  it("loads title and timeline", async () => {
    const about = await getAbout(fixturesDir);
    expect(about.frontmatter.title).toBe("About test");
    expect(about.frontmatter.timeline).toHaveLength(2);
    expect(about.body.trim()).toBe("Body of about.");
  });

  it("throws naming the file when the timeline is empty", async () => {
    await expect(getAbout(invalidAboutDir)).rejects.toThrow(/about\.mdx.*timeline/);
  });
});

describe("sortProjectsByYear", () => {
  it("sorts newest year first, then order ascending, without mutating", async () => {
    const [a, b] = await getProjects(fixturesDir);
    if (!a || !b) throw new Error("fixtures missing");
    const older = { ...a, frontmatter: { ...a.frontmatter, slug: "older", year: 2020, order: 1 } };
    const newer = { ...b, frontmatter: { ...b.frontmatter, slug: "newer", year: 2024, order: 9 } };
    const newerFirst = { ...b, frontmatter: { ...b.frontmatter, slug: "tie", year: 2024, order: 2 } };
    const input = [older, newer, newerFirst];
    const sorted = sortProjectsByYear(input);
    expect(sorted.map((x) => x.frontmatter.slug)).toEqual(["tie", "newer", "older"]);
    expect(input.map((x) => x.frontmatter.slug)).toEqual(["older", "newer", "tie"]);
  });
});
