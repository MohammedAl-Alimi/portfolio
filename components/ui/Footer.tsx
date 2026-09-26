import { getSite } from "@/lib/content";
import { fillYear } from "@/lib/site-copy";

export async function Footer() {
  const { footer } = await getSite();
  return (
    <footer className="border-t border-border px-6 py-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
        {fillYear(footer.line, new Date().getFullYear())}
      </p>
    </footer>
  );
}
