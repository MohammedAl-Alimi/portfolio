import { getSite } from "@/lib/content";
import { fillYear } from "@/lib/site-copy";
import { Container } from "./Container";

export async function Footer() {
  const { footer } = await getSite();
  return (
    // The layout wrapper already clears the 72 px rail; Container lines the text up with the pages.
    <footer className="border-t border-border py-6">
      <Container>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          {fillYear(footer.line, new Date().getFullYear())}
        </p>
      </Container>
    </footer>
  );
}
