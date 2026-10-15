"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";

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
      <h1 className="font-display text-center text-[clamp(2.5rem,6vw,5rem)] leading-tight">
        Something broke on our side.
      </h1>
      <p className="mt-4 text-center text-muted">
        It has been logged. You can try again or head home.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button href="/" variant="secondary">
          Home
        </Button>
      </div>
      <p className="mt-8 text-center font-mono text-sm text-muted">
        Request ID: {error.digest ?? "unknown"}
      </p>
    </Section>
  );
}
