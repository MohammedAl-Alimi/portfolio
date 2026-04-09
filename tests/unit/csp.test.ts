import { describe, expect, it } from "vitest";
import { buildCsp } from "@/lib/csp";
import { LAB_FRAME_ORIGINS } from "@/lib/lab-origins";

describe("buildCsp", () => {
  it("builds a strict csp with nonce and allowed frames", () => {
    const csp = buildCsp("abc", { dev: false });
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(csp).toContain("frame-src https://www.linkedin.com");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("allows eval only in dev", () => {
    expect(buildCsp("abc", { dev: true })).toContain("'unsafe-eval'");
    expect(buildCsp("abc", { dev: false })).not.toContain("'unsafe-eval'");
  });

  it("lists every lab origin in frame-src", () => {
    const frameSrc = buildCsp("abc", { dev: false })
      .split("; ")
      .find((d) => d.startsWith("frame-src "));
    for (const origin of LAB_FRAME_ORIGINS) {
      expect(frameSrc).toContain(origin);
    }
  });

  it("allows unsafe-inline only in style-src", () => {
    const directives = buildCsp("abc", { dev: false }).split("; ");
    for (const d of directives) {
      if (d.startsWith("style-src ")) continue;
      expect(d).not.toContain("unsafe-inline");
    }
  });
});

describe("buildCsp upgradeInsecure", () => {
  it("keeps upgrade-insecure-requests by default and can drop it", () => {
    expect(buildCsp("abc", { dev: false })).toContain("upgrade-insecure-requests");
    expect(buildCsp("abc", { dev: false, upgradeInsecure: false })).not.toContain(
      "upgrade-insecure-requests",
    );
  });
});
