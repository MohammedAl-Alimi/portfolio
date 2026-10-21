import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "@/lib/csp";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  // WebKit upgrades subresources to https even on http://localhost, which breaks
  // local and CI runs. Real deployments are always https, so they keep the directive.
  const { protocol, hostname } = request.nextUrl;
  const plainLocalhost =
    protocol === "http:" && (hostname === "localhost" || hostname === "127.0.0.1");
  const csp = buildCsp(nonce, {
    dev: process.env.NODE_ENV === "development",
    upgradeInsecure: !plainLocalhost,
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next reads the nonce for its own scripts from the request CSP header.
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), accelerometer=(self), gyroscope=(self)",
  );
  response.headers.set("X-Frame-Options", "DENY");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:webp|png|jpg|jpeg|svg|ico|pdf|txt|xml|js|css|map|woff2?)$).*)",
  ],
};
