import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Resolve metadata before the shell is sent, so title and description are
  // in <head> for every visitor, not streamed into <body> (Lighthouse and
  // some crawlers only read <head>).
  htmlLimitedBots: /.*/,
};

export default nextConfig;
