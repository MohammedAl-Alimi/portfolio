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
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--radius-sm)] border-2 font-sans font-semibold duration-[var(--motion-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-4)] disabled:opacity-50";

const pixelHover =
  "hover:shadow-[2px_2px_0_var(--accent-4)] hover:-translate-x-[1px] hover:-translate-y-[1px] motion-safe:transition-[transform,box-shadow]";

const variants: Record<Variant, string> = {
  primary: `bg-text text-bg border-text ${pixelHover}`,
  secondary: `bg-transparent border-border text-text ${pixelHover}`,
  ghost: "border-transparent bg-transparent text-text hover:bg-surface",
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
    const isScheme = href.startsWith("mailto:") || href.startsWith("tel:");
    const forceNewTab = Boolean(external) && !isScheme;
    const opensNewTab = forceNewTab || anchorRest.target === "_blank";
    if (isInternal(href) && !external) {
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
        target={forceNewTab ? "_blank" : anchorRest.target}
        rel={opensNewTab ? "noopener noreferrer" : anchorRest.rel}
        className={classes}
      />
    );
  }

  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return <button type="button" {...buttonRest} className={classes} />;
}
