import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  external?: boolean;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type ButtonAsAnchor = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | "href"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const base =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--radius-sm)] font-sans font-semibold transition-colors duration-[var(--motion-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-4)] disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-text text-bg hover:opacity-90",
  secondary: "border border-border bg-surface text-text hover:border-text",
  ghost: "bg-transparent text-text hover:bg-surface",
};

const sizes: Record<Size, string> = {
  md: "px-5",
  lg: "px-7 text-lg",
};

function isInternal(href: string) {
  return (href.startsWith("/") && !href.startsWith("//")) || href.startsWith("#");
}

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", external, className, ...rest } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if (props.href !== undefined) {
    const { href, ...anchorRest } = rest as Omit<
      AnchorHTMLAttributes<HTMLAnchorElement>,
      "href"
    > & { href: string };
    const opensNewTab = external || anchorRest.target === "_blank";
    if (isInternal(href)) {
      return (
        <Link
          {...anchorRest}
          href={href}
          rel={anchorRest.target === "_blank" ? "noopener noreferrer" : anchorRest.rel}
          className={classes}
        />
      );
    }
    return (
      <a
        {...anchorRest}
        href={href}
        target={external ? "_blank" : anchorRest.target}
        rel={opensNewTab ? "noopener noreferrer" : anchorRest.rel}
        className={classes}
      />
    );
  }

  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return <button type="button" {...buttonRest} className={classes} />;
}
