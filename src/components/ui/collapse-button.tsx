"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Chevron button that collapses or expands a panel. It only reports the click: whoever owns the panel keeps
 * the state and hides the panel with the `hidden` attribute (not by unmounting it, so typed text survives).
 * `controls` is the id of that panel, for screen readers; `children` is the visible text next to the chevron.
 */
export function CollapseButton({
  expanded,
  controls,
  label,
  onClick,
  className,
  children,
}: {
  expanded: boolean;
  controls: string;
  /** Accessible name, e.g. «Collapse Contact». */
  label: string;
  onClick: () => void;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controls}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "-ml-1 flex min-w-0 items-center gap-2 rounded-md p-1 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <ChevronDown
        aria-hidden
        className={cn(
          "size-4 shrink-0 text-muted-foreground transition-transform duration-150 motion-reduce:transition-none",
          !expanded && "-rotate-90",
        )}
      />
      {children}
    </button>
  );
}
