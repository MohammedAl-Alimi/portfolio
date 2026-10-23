const DEFAULT_SITE_URL = "https://portfolio-mohammed-al-alimis-projects.vercel.app";

function resolveSiteUrl(): string {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
  try {
    new URL(candidate);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL is not a valid absolute URL");
  }
  return candidate.replace(/\/+$/, "");
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = "Mohammed Al-Alimi";
