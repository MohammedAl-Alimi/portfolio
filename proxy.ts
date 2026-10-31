import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "@/lib/csp";
import {
  PERMISSIONS_POLICY,
  REFERRER_POLICY,
  STRICT_TRANSPORT_SECURITY,
  X_CONTENT_TYPE_OPTIONS,
} from "@/lib/security-headers";

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
  response.headers.set("Strict-Transport-Security", STRICT_TRANSPORT_SECURITY);
  response.headers.set("X-Content-Type-Options", X_CONTENT_TYPE_OPTIONS);
  response.headers.set("Referrer-Policy", REFERRER_POLICY);
  response.headers.set("Permissions-Policy", PERMISSIONS_POLICY);
  response.headers.set("X-Frame-Options", "DENY");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:webp|png|jpg|jpeg|svg|ico|pdf|txt|xml|js|css|map|woff2?)$).*)",
  ],
};
