import { Decode } from "@/components/motion/Decode";
import { GridFloor } from "@/components/motion/GridFloor";
import { ViewSlot } from "@/components/three/ViewSlot";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { Profile } from "@/lib/schemas";
import { HeroFigure } from "./HeroFigure";
import { HeroHint } from "./HeroHint";
import { HeroPoster } from "./HeroPoster";

export function Hero({ profile }: { profile: Profile }) {
  return (
    <section data-hero aria-labelledby="hero-title" className="relative py-12 md:py-20">
      <GridFloor />
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="order-2 lg:order-1 lg:col-span-6">
            {/* The name, once: the page heading, decoded in mono caps. CSS does the caps,
                so screen readers get the name as words, not letters. */}
            <Decode
              as="h1"
              id="hero-title"
              text={profile.name}
              className="font-mono uppercase tracking-[0.2em] text-[14px] text-muted"
            />
            <p
              data-hero-headline
              className="mt-6 max-w-[16ch] font-display font-extrabold leading-[0.95] tracking-[-0.02em] text-[clamp(2rem,4.2vw,4rem)]"
            >
              {profile.headline}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button variant="primary" size="lg" href="/projects" brackets>
                VIEW WORK
              </Button>
              <Button variant="secondary" size="lg" href="/cv">
                DOWNLOAD CV
              </Button>
            </div>
          </div>
          <div className="order-1 lg:order-2 lg:col-span-6">
            <div data-hero-slot className="touch-pan-y">
              <ViewSlot
                className="relative aspect-[4/3] lg:aspect-auto lg:h-[560px]"
                poster={<HeroPoster src="/posters/figure.webp" alt="" priority />}
              >
                <HeroFigure />
              </ViewSlot>
            </div>
            <HeroHint />
          </div>
        </div>
      </Container>
    </section>
  );
}
