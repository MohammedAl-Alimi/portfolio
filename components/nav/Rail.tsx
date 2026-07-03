import { TransitionLink } from "@/components/motion/TransitionLink";
import { NAV_ITEMS } from "@/lib/nav";
import { NavGlyph, RailSearchIcon } from "./icons";
import { ScrollReadout } from "./ScrollReadout";
import { TabLink } from "./TabLink";

const focusRing =
  "focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-[var(--glow)]";

const tab = `relative flex items-center gap-4 h-12 px-[26px] text-muted hover:text-text font-mono uppercase tracking-[0.12em] text-[11px] motion-safe:transition-colors duration-[var(--motion-fast)] ${focusRing}`;
const tabActive =
  "text-text before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-glow";

export function Rail() {
  return (
    <nav
      aria-label="Main"
      className="group/rail hidden lg:flex fixed left-0 top-0 z-40 h-dvh w-[72px] hover:w-[220px] has-[:focus-visible]:w-[220px] flex-col overflow-hidden border-r border-border bg-bg motion-safe:transition-[width] duration-[var(--motion-base)]"
    >
      <TransitionLink
        href="/"
        className={`flex h-12 items-center px-[26px] font-mono text-[12px] font-bold text-text ${focusRing}`}
      >
        <span aria-hidden="true">MA</span>
        <span className="sr-only">Mohammed Al-Alimi, home</span>
      </TransitionLink>
      <div className="flex flex-1 flex-col justify-center">
        {NAV_ITEMS.map((item) => (
          <TabLink key={item.label} href={item.href} className={tab} activeClassName={tabActive}>
            <NavGlyph name={item.icon} />
            <span className="sr-only">{item.label}</span>
            <span
              aria-hidden="true"
              data-rail-label
              className="absolute left-[60px] top-1/2 -translate-y-1/2 whitespace-nowrap opacity-0 group-hover/rail:opacity-100 group-has-[:focus-visible]/rail:opacity-100 motion-safe:transition-opacity duration-[var(--motion-base)]"
            >
              {item.label}
            </span>
          </TabLink>
        ))}
      </div>
      <div className="flex flex-col items-center gap-3 pb-3">
        <button
          type="button"
          aria-label="Search"
          data-search-trigger
          disabled
          className={`inline-flex size-[44px] cursor-default items-center justify-center text-muted opacity-60 ${focusRing}`}
        >
          <RailSearchIcon />
        </button>
        <div aria-hidden="true" className="h-px w-8 bg-border" />
        <ScrollReadout />
      </div>
    </nav>
  );
}
