// Test-only switches. Production builds inline NEXT_PUBLIC_E2E as "0", so these
// return false and the bundler drops the URL check.

/**
 * `?motion=force`: CI renders WebGL on the CPU, where the figure holds still and
 * text decodes fall back to a fade. The flag lets an e2e test run the GPU paths there.
 */
export function forceMotion(): boolean {
  return (
    process.env.NEXT_PUBLIC_E2E === "1" && new URLSearchParams(window.location.search).get("motion") === "force"
  );
}
