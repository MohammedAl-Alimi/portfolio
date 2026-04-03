"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("route error", { digest: error.digest });
  }, [error.digest]);

  const button = {
    minHeight: 44,
    padding: "0 20px",
    borderRadius: 8,
    font: "600 16px system-ui, sans-serif",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    cursor: "pointer",
  } as const;

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#fffbf5",
          color: "#17161a",
          font: "16px/1.5 system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "96px 16px", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", lineHeight: 1.1, margin: 0 }}>
            Something broke on our side.
          </h1>
          <p style={{ color: "#5f5b66", marginTop: 16 }}>
            It has been logged. You can try again or head home.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32 }}>
            <button
              type="button"
              onClick={reset}
              style={{ ...button, background: "#17161a", color: "#fffbf5", border: 0 }}
            >
              Try again
            </button>
            {/* Plain anchor on purpose: the router may be what broke. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{ ...button, color: "#17161a", border: "1px solid #17161a" }}
            >
              Home
            </a>
          </div>
          <p style={{ color: "#5f5b66", marginTop: 32, font: "14px ui-monospace, monospace" }}>
            Request ID: {error.digest ?? "unknown"}
          </p>
        </main>
      </body>
    </html>
  );
}
