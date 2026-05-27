import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { Profile } from "@/lib/schemas";
import { HeroPoster } from "./HeroPoster";

export function Hero({ profile }: { profile: Profile }) {
  return (
    <section aria-labelledby="hero-title" className="py-12 md:py-20">
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="order-2 lg:order-1 lg:col-span-5">
            <h1
              id="hero-title"
              className="font-display font-bold leading-[0.9] tracking-[-0.03em] text-[clamp(2rem,8vw,7rem)]"
            >
              {profile.name}
            </h1>
            <p className="mt-6 max-w-[32ch] text-xl text-muted md:text-2xl">{profile.headline}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button variant="primary" size="lg" href="/projects">
                See projects
              </Button>
              <Button variant="secondary" size="lg" href="/cv">
                Download CV
              </Button>
            </div>
          </div>
          <div className="order-1 lg:order-2 lg:col-span-7">
            <div data-hero-slot className="relative aspect-[4/3]">
              <HeroPoster />
            </div>
            <p className="mt-3 text-left text-sm text-muted">Drag the shapes. Click one to open a project.</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
