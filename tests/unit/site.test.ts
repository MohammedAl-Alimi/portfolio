import { afterEach, describe, expect, it, vi } from "vitest";

const DEFAULT = "https://portfolio-mohammed-al-alimis-projects.vercel.app";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function load(value?: string) {
  if (value === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else vi.stubEnv("NEXT_PUBLIC_SITE_URL", value);
  vi.resetModules();
  return import("@/lib/site");
}

describe("SITE_URL", () => {
  it("uses the default when env is unset", async () => {
    expect((await load()).SITE_URL).toBe(DEFAULT);
  });

  it("treats a blank value as unset", async () => {
    expect((await load("")).SITE_URL).toBe(DEFAULT);
    expect((await load("   ")).SITE_URL).toBe(DEFAULT);
  });

  it("strips all trailing slashes", async () => {
    expect((await load("https://example.com//")).SITE_URL).toBe("https://example.com");
  });

  it("throws on an invalid value", async () => {
    await expect(load("not a url")).rejects.toThrow(
      "NEXT_PUBLIC_SITE_URL is not a valid absolute URL",
    );
  });
});
