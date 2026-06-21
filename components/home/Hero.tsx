import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { Profile } from "@/lib/schemas";
import { ViewSlot } from "@/components/three/ViewSlot";
import { HeroHint } from "./HeroHint";
import { HeroPoster } from "./HeroPoster";
import { HeroStormLoader } from "./HeroStormLoader";

export function Hero({ profile }: { profile: Profile }) {
  const [first = "", ...restParts] = profile.name.split(" ");
  const rest = restParts.join(" ");
  return (
    <section aria-labelledby="hero-title" className="py-12 md:py-20">
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="order-2 lg:order-1 lg:col-span-6">
            <h1
              id="hero-title"
              className="font-display leading-[0.9] tracking-[-0.02em] text-[clamp(1.75rem,4vw,4.5rem)]"
            >
              <span data-name-line className="block">
                {first}
              </span>{" "}
              {rest ? (
                <span data-name-line className="block whitespace-nowrap">
                  {rest}
                </span>
              ) : null}
            </h1>
            <p className="mt-6 max-w-[32ch] text-xl text-muted md:text-2xl">{profile.headline}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button variant="primary" size="lg" href="/projects">
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
                className="relative aspect-[4/3] lg:aspect-auto lg:h-[520px]"
                poster={<HeroPoster src="/posters/pixel-name.webp" alt="" />}
              >
                <HeroStormLoader />
              </ViewSlot>
            </div>
            <HeroHint />
          </div>
        </div>
      </Container>
    </section>
  );
}
