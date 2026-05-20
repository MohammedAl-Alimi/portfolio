import type { NextConfig } from "next";
import {
  REFERRER_POLICY,
  STRICT_TRANSPORT_SECURITY,
  X_CONTENT_TYPE_OPTIONS,
} from "./lib/security-headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Resolve metadata before the shell is sent, so title and description are
  // in <head> for every visitor, not streamed into <body> (Lighthouse and
  // some crawlers only read <head>).
  htmlLimitedBots: /.*/,
  // Always inlined, so production builds drop the e2e-only scene probe (window.__figure).
  env: { NEXT_PUBLIC_E2E: process.env.NEXT_PUBLIC_E2E === "1" ? "1" : "0" },
  // lib/og.tsx reads the Open Graph fonts with fs. Both images prerender, but if one ever
  // renders at request time the TTFs must be in its function bundle.
  outputFileTracingIncludes: {
    "/opengraph-image/*": ["./app/fonts/og/**"],
    "/projects/*/opengraph-image/*": ["./app/fonts/og/**"],
  },
  // The proxy skips static files, so send the baseline headers here too.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: X_CONTENT_TYPE_OPTIONS },
          { key: "Referrer-Policy", value: REFERRER_POLICY },
          { key: "Strict-Transport-Security", value: STRICT_TRANSPORT_SECURITY },
        ],
      },
    ];
  },
};

export default nextConfig;
