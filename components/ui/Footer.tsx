import { getProfile } from "@/lib/content";
import { Button } from "./Button";
import { Section } from "./Section";

export async function Footer() {
  const profile = await getProfile();
  return (
    <footer id="contact" className="border-t border-border">
      <Section>
        <h2 className="font-display text-5xl md:text-7xl">Say hi</h2>
        <p className="mt-4 text-lg text-muted">{profile.availability}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={`mailto:${profile.email}`} size="lg">
            Say hi
          </Button>
          <Button href={profile.socials.github} variant="secondary" size="lg" external>
            GitHub
          </Button>
          <Button href={profile.socials.linkedin} variant="secondary" size="lg" external>
            LinkedIn
          </Button>
          <Button href="/cv" variant="secondary" size="lg">
            Download CV
          </Button>
        </div>
        <p className="mt-16 text-sm text-muted">
          © 2026 Mohammed Al-Alimi. Built with Next.js.
        </p>
      </Section>
    </footer>
  );
}
