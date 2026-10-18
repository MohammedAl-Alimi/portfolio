// Origins that lab iframes may embed. The CSP `frame-src` must list the same origins.
export const LAB_FRAME_ORIGINS = ["https://crowdmonitoringdashboard.vercel.app"] as const;

export function isAllowedLabOrigin(url: string): boolean {
  try {
    const { origin } = new URL(url);
    return (LAB_FRAME_ORIGINS as readonly string[]).includes(origin);
  } catch {
    return false;
  }
}
