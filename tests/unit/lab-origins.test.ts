import { describe, expect, it } from "vitest";
import { isAllowedLabOrigin } from "@/lib/lab-origins";

describe("isAllowedLabOrigin", () => {
  it("allows a listed origin", () => {
    expect(isAllowedLabOrigin("https://crowdmonitoringdashboard.vercel.app/some/path")).toBe(true);
  });
  it("rejects an unlisted origin", () => {
    expect(isAllowedLabOrigin("https://evil.example.com/")).toBe(false);
  });
  it("rejects a lookalike host and invalid urls", () => {
    expect(isAllowedLabOrigin("https://crowdmonitoringdashboard.vercel.app.evil.com/")).toBe(false);
    expect(isAllowedLabOrigin("not a url")).toBe(false);
  });
});
