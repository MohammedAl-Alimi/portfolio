"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useTransition } from "./TransitionProvider";

export type TransitionLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

/**
 * next/link with the glitch wipe (components/motion/TransitionProvider.tsx).
 * Next calls onNavigate only for a plain left click on a local URL: modifier
 * keys, middle click, target="_blank", download and external hrefs never get
 * here and keep the browser's behaviour. Prefetch is unchanged. Hash-only
 * links, same-path links, and renders outside the provider navigate normally.
 */
export function TransitionLink({ href, onNavigate, ...rest }: TransitionLinkProps) {
  const transition = useTransition();
  return (
    <Link
      {...rest}
      href={href}
      onNavigate={(event) => {
        onNavigate?.(event);
        if (!transition || href.startsWith("#")) return;
        if (transition.navigate(href)) event.preventDefault();
      }}
    />
  );
}
