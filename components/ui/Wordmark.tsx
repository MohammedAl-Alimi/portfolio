import Link from "next/link";

export function Wordmark() {
  return (
    <Link
      href="/"
      aria-label="Mohammed Al-Alimi, home"
      className="inline-flex min-h-[44px] items-center font-display text-base font-bold lowercase md:text-xl text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-4)]"
    >
      mohammed
    </Link>
  );
}
