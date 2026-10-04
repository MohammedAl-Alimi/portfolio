export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
        MA · {new Date().getFullYear()} · Built with Next.js
      </p>
    </footer>
  );
}
