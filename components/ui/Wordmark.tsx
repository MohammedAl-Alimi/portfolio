import Link from "next/link";

export function Wordmark() {
  return (
    <Link
      href="/"
      aria-label="Mohammed Al-Alimi, home"
      className="inline-flex min-h-[44px] items-center font-display text-base font-extrabold lowercase md:text-xl text-text focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--glow)]"
    >
      mohammed
    </Link>
  );
}
