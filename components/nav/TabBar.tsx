import { NAV_ITEMS } from "@/lib/nav";
import { NavGlyph } from "./icons";
import { TabLink } from "./TabLink";

const tab =
  "relative flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-mono uppercase tracking-[0.08em] text-muted hover:text-text focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-[var(--glow)]";
const tabActive = "text-text before:absolute before:top-0 before:inset-x-3 before:h-[2px] before:bg-glow";

export function TabBar() {
  return (
    <nav
      aria-label="Main"
      className="flex lg:hidden fixed bottom-0 inset-x-0 z-40 h-[calc(56px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] border-t border-border bg-bg"
    >
      {NAV_ITEMS.map((item) => (
        <TabLink key={item.label} href={item.href} className={tab} activeClassName={tabActive}>
          <NavGlyph name={item.icon} />
          <span>{item.label}</span>
        </TabLink>
      ))}
    </nav>
  );
}
