import { LAB_FRAME_ORIGINS } from "@/lib/lab-origins";

export function buildCsp(nonce: string, options: { dev: boolean; upgradeInsecure?: boolean }): string {
  const scriptSrc = `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${
    options.dev ? " 'unsafe-eval'" : ""
  }`;
  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://media.licdn.com",
    "font-src 'self'",
    "connect-src 'self' https://vitals.vercel-insights.com",
    `frame-src https://www.linkedin.com ${LAB_FRAME_ORIGINS.join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "worker-src 'self' blob:",
    ...(options.upgradeInsecure === false ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
