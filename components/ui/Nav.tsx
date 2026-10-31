import { Container } from "./Container";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";
import { Wordmark } from "./Wordmark";
import { SearchIcon } from "./icons";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 h-[72px] border-b border-border bg-bg/80 backdrop-blur">
      <Container className="flex h-full items-center justify-between gap-2 md:gap-4">
        <Wordmark />
        <nav aria-label="Main" className="hidden md:block">
          <NavLinks />
        </nav>
        <div className="flex items-center gap-1.5 md:gap-2">
          <button
            type="button"
            aria-label="Search"
            data-search-trigger
            disabled
            className="inline-flex min-h-[44px] min-w-[44px] cursor-default items-center justify-center gap-2 border-2 border-border bg-surface px-3 font-mono uppercase tracking-[0.12em] text-[12px] text-text opacity-60"
          >
            <SearchIcon />
            <span className="hidden md:inline">Search</span>
          </button>
          <MobileMenu />
        </div>
      </Container>
    </header>
  );
}
