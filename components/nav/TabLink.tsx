"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type TabLinkProps = {
  href: string;
  className?: string;
  activeClassName?: string;
  children: ReactNode;
};

export function TabLink({ href, className, activeClassName, children }: TabLinkProps) {
  const pathname = usePathname();
  const active = isActive(href, pathname);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      data-active={active ? "true" : "false"}
      className={cn(className, active && activeClassName)}
    >
      {children}
    </Link>
  );
}
