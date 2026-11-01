import Image from "next/image";
import type { AnchorHTMLAttributes, ComponentPropsWithoutRef, ImgHTMLAttributes, ReactNode } from "react";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { cn } from "@/lib/cn";

const BASE = "https://x.invalid";

export function isSafeHref(href: string | undefined): href is string {
  if (!href) return false;
  // Reject backslashes, whitespace and ASCII control characters anywhere.
  if (/[\\\u0000-\u0020\u007f]/.test(href)) return false;
  if (href.startsWith("//")) return false;
  if (href.startsWith("https:") || href.startsWith("mailto:")) return true;
  if (href.startsWith("/") || href.startsWith("#")) {
    try {
      return new URL(href, BASE).origin === BASE;
    } catch {
      return false;
    }
  }
  return false;
}

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
}

function uniqueId(text: string, seen: Map<string, number>): string {
  const base = slugify(text);
  const count = (seen.get(base) ?? 0) + 1;
  seen.set(base, count);
  return count === 1 ? base : `${base}-${count}`;
}

function Anchor({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (!isSafeHref(href)) return <span>{children}</span>;
  const external = href.startsWith("https:");
  if (href.startsWith("/")) {
    return (
      <TransitionLink {...rest} href={href} className="underline underline-offset-4 decoration-1 hover:decoration-2">
        {children}
      </TransitionLink>
    );
  }
  return (
    <a
      {...rest}
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="underline underline-offset-4 decoration-1 hover:decoration-2"
    >
      {children}
    </a>
  );
}

function MdxImage({ src, alt }: ImgHTMLAttributes<HTMLImageElement>) {
  if (typeof src !== "string" || alt === undefined) {
    throw new Error("MDX images need a src and alt text.");
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={1600}
      height={900}
      sizes="(min-width: 1024px) 800px, 100vw"
      className="mb-6 h-auto w-full rounded-[var(--radius-sm)]"
    />
  );
}

export function createMdxComponents(seen: Map<string, number> = new Map()) {
  return {
  h2: ({ children }: ComponentPropsWithoutRef<"h2">) => (
    <h2 id={uniqueId(textOf(children), seen)} className="font-display text-3xl md:text-4xl mt-16 mb-6 scroll-mt-24">
      {children}
    </h2>
  ),
  h3: ({ children }: ComponentPropsWithoutRef<"h3">) => (
    <h3 id={uniqueId(textOf(children), seen)} className="font-display text-2xl md:text-3xl mt-10 mb-4 scroll-mt-24">
      {children}
    </h3>
  ),
  p: ({ children }: ComponentPropsWithoutRef<"p">) => (
    <p className="text-lg leading-relaxed mb-6 max-w-[68ch]">{children}</p>
  ),
  ul: ({ children }: ComponentPropsWithoutRef<"ul">) => (
    <ul className="list-disc pl-6 mb-6 space-y-2 text-lg leading-relaxed max-w-[68ch]">{children}</ul>
  ),
  ol: ({ children }: ComponentPropsWithoutRef<"ol">) => (
    <ol className="list-decimal pl-6 mb-6 space-y-2 text-lg leading-relaxed max-w-[68ch]">{children}</ol>
  ),
  li: ({ children }: ComponentPropsWithoutRef<"li">) => <li>{children}</li>,
  a: Anchor,
  img: MdxImage,
  code: ({ className, children }: ComponentPropsWithoutRef<"code">) => (
    <code
      className={cn(
        "font-mono text-[0.9em] bg-surface border border-border rounded px-1.5 py-0.5",
        className,
      )}
    >
      {children}
    </code>
  ),
  // Sideways swipes scroll the code natively; Lenis (components/motion/SmoothScroll.tsx)
  // would otherwise turn a diagonal trackpad swipe into page scroll.
  pre: ({ children }: ComponentPropsWithoutRef<"pre">) => (
    <pre
      data-lenis-prevent-horizontal
      className="overflow-x-auto rounded-[var(--radius-sm)] border border-border bg-surface p-4 mb-6 text-sm [&_code]:rounded-none [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[1em]"
    >
      {children}
    </pre>
  ),
  };
}
