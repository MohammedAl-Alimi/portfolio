import { describe, expect, it } from "vitest";
import { isSoftwareRenderer, type RendererInfoSource } from "@/lib/gpu";

function stub(renderer: string, withExt = true): RendererInfoSource {
  return {
    RENDERER: 0x1f01,
    getExtension: (name: string) =>
      withExt && name === "WEBGL_debug_renderer_info" ? { UNMASKED_RENDERER_WEBGL: 0x9246 } : null,
    getParameter: (p: number) => (p === 0x9246 || (!withExt && p === 0x1f01) ? renderer : "WebKit WebGL"),
  };
}

describe("isSoftwareRenderer", () => {
  it.each([
    "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)",
    "llvmpipe (LLVM 15.0.7, 256 bits)",
    "Microsoft Basic Render Driver",
    "Google SwiftShader",
  ])("flags %s", (r) => {
    expect(isSoftwareRenderer(stub(r))).toBe(true);
  });

  it("passes a real GPU", () => {
    expect(isSoftwareRenderer(stub("ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)"))).toBe(false);
  });

  it("falls back to RENDERER when the debug extension is missing", () => {
    expect(isSoftwareRenderer(stub("SwiftShader", false))).toBe(true);
    expect(isSoftwareRenderer(stub("Apple GPU", false))).toBe(false);
  });
});
