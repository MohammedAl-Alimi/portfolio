import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("SITE_URL", () => {
  it("uses the default without a trailing slash when env is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    delete process.env.NEXT_PUBLIC_SITE_URL;
    vi.resetModules();
    const { SITE_URL } = await import("@/lib/site");
    expect(SITE_URL).toBe("https://portfolio-mohammed-al-alimis-projects.vercel.app");
  });

  it("strips a trailing slash from the env value", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com/");
    vi.resetModules();
    const { SITE_URL } = await import("@/lib/site");
    expect(SITE_URL).toBe("https://example.com");
  });
});
