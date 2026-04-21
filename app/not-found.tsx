import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <Section>
      <div
        data-notfound-shape-slot
        aria-hidden
        className="mx-auto mb-10 h-40 w-40 md:h-56 md:w-56"
      >
        <svg viewBox="0 0 200 200" className="h-full w-full" fill="none">
          <defs>
            <filter id="nf-shadow" x="-20%" y="-20%" width="140%" height="150%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.2" />
            </filter>
          </defs>
          <g filter="url(#nf-shadow)" strokeLinejoin="round" strokeWidth="14">
            <polygon
              points="40,60 100,30 110,90 50,110"
              fill="var(--accent-1)"
              stroke="var(--accent-1)"
              transform="rotate(-8 80 70) translate(-6 -4)"
            />
            <polygon
              points="110,50 170,70 160,130 105,115"
              fill="var(--accent-4)"
              stroke="var(--accent-4)"
              transform="rotate(6 140 90) translate(6 0)"
            />
            <polygon
              points="70,125 130,135 115,180 60,170"
              fill="var(--accent-2)"
              stroke="var(--accent-2)"
              transform="rotate(-4 95 150) translate(0 6)"
            />
          </g>
        </svg>
      </div>
      <h1 className="font-display text-center text-[clamp(2.5rem,6vw,5rem)] leading-tight">
        This page wandered off.
      </h1>
      <p className="mt-4 text-center text-muted">The link may be old, or the page moved.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/">Home</Button>
        <Button href="/projects" variant="secondary">
          Projects
        </Button>
      </div>
    </Section>
  );
}
