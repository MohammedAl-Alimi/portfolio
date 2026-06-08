import type { Metadata } from "next";
import { Brackets } from "@/components/ui/Brackets";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { getProfile, getSite } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const [profile, site] = await Promise.all([getProfile(), getSite()]);
  const copy = site.contact;
  const rows = [
    { ...copy.rows.email, href: `mailto:${profile.email}`, external: false },
    { ...copy.rows.github, href: profile.socials.github, external: true },
    { ...copy.rows.linkedin, href: profile.socials.linkedin, external: true },
    { ...copy.rows.cv, href: "/cv", external: false },
  ];
  return (
    <section id="contact">
      <Section>
        <h1 className="font-display uppercase tracking-[-0.03em] leading-[0.9] text-[clamp(1.75rem,6vw,5rem)]">
          {copy.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">{profile.availability}</p>
        <ul className="mt-12 flex max-w-3xl flex-col gap-4">
          {rows.map((row) => (
            <li key={row.label}>
              <Brackets
                data-contact-row
                className="flex flex-wrap items-center justify-between gap-4 border border-border bg-surface p-5"
              >
                <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
                  {row.label}
                </span>
                <Button href={row.href} variant="secondary" external={row.external}>
                  {row.action}
                </Button>
              </Brackets>
            </li>
          ))}
        </ul>
      </Section>
    </section>
  );
}
