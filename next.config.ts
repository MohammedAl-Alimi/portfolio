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
