"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
// A client component Next renders on its own: it cannot load files, so it imports the JSON.
// validate:content checks the same file against siteSchema at prebuild.
import site from "@/content/site.json";

const copy = site.error;

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("route error", { digest: error.digest });
  }, [error.digest]);

  return (
    <Section>
      <h1 className="font-display text-center tracking-[-0.03em] leading-[0.9] text-[clamp(1.75rem,6vw,5rem)]">
        {copy.title}
      </h1>
      <p className="mt-4 text-center text-muted">{copy.text}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>{copy.retry}</Button>
        <Button href="/" variant="secondary">
          {copy.home}
        </Button>
      </div>
      <p className="mt-8 text-center font-mono text-sm text-muted">
        {copy.requestId} {error.digest ?? "unknown"}
      </p>
    </Section>
  );
}
