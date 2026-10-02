import type { VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

type ButtonStyle = VariantProps<typeof buttonVariants>;

/**
 * A real link that looks like a button. Rendering a link through `Button` adds `role="button"`,
 * which makes screen readers announce navigation as an action; this keeps the link semantics.
 */
export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & ButtonStyle) {
  return (
    <Link
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

/** Same, for a plain anchor (downloads and other non-routed URLs). */
export function ButtonAnchor({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"a"> & ButtonStyle) {
  return (
    <a data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
