import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { cn } from "@/lib/cn";
import { Brackets } from "./Brackets";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  external?: boolean;
  /** Corner brackets. On by default for secondary, opt-in for the others. */
  brackets?: boolean;
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
  "inline-flex min-h-[44px] items-center justify-center gap-2 border font-mono text-[13px] font-bold uppercase tracking-[0.12em] duration-[var(--motion-fast)] motion-safe:transition-colors focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--glow)] disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-text text-bg border-text hover:bg-bg hover:text-text",
  secondary: "bg-transparent text-text border-border",
  ghost: "border-transparent bg-transparent text-text hover:bg-surface",
};

const sizes: Record<Size, string> = {
  md: "px-5",
  lg: "px-7",
};

/** A path on this site. Hash-only links stay plain anchors (same-page jumps). */
function isInternal(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

export function Button(props: ButtonProps) {
  const button = renderButton(props);
  if (!(props.brackets ?? props.variant === "secondary")) return button;
  // A filled button would hide marks drawn on its own edge, so they sit 3 px
  // outside it. The negative margin keeps its layout box the same size.
  const filled = props.variant === undefined || props.variant === "primary";
  return (
    <Brackets as="span" className={cn("inline-flex", filled && "-m-[3px] p-[3px]")}>
      {button}
    </Brackets>
  );
}

function renderButton(props: ButtonProps) {
  // `brackets` is handled by Button; keep it off the DOM element.
  const { variant = "primary", size = "md", external, className, brackets: _brackets, ...rest } = props;
  void _brackets;
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
        <TransitionLink
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
