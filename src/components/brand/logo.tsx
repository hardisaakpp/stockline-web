import { cn } from "@/lib/utils";

/** Stacked-layers mark: stock moving along a line. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-8 shrink-0", className)}
      fill="none"
    >
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d="M16 7 7 11.5 16 16l9-4.5L16 7Z" className="fill-primary-foreground" />
      <path
        d="m7 16 9 4.5 9-4.5M7 20.5 16 25l9-4.5"
        className="stroke-primary-foreground"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight">Stockline</span>
    </span>
  );
}
