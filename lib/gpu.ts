// The subset of a WebGL context needed to read the renderer name.
export interface RendererInfoSource {
  RENDERER: number;
  getExtension(name: string): unknown;
  getParameter(pname: number): unknown;
}

const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i;

// True when WebGL runs on the CPU (no GPU, blocklisted driver, many CI
// machines). Continuous animation there competes with the main thread.
export function isSoftwareRenderer(gl: RendererInfoSource): boolean {
  try {
    const ext = gl.getExtension("WEBGL_debug_renderer_info") as { UNMASKED_RENDERER_WEBGL: number } | null;
    const name = gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
    return typeof name === "string" && SOFTWARE.test(name);
  } catch {
    return false;
  }
}
