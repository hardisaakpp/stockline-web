import { ArrowUpRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  /** Where the number leads: the list filtered by what the card counts. */
  href: string;
  linkLabel: string;
  tone?: "default" | "attention" | "danger";
};

const TONES = {
  default: "bg-primary/10 text-primary",
  attention: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  danger: "bg-destructive/10 text-destructive",
} as const;

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  linkLabel,
  tone = "default",
}: Props) {
  return (
    <Link
      href={href}
      aria-label={`${linkLabel}: ${label}`}
      className="group rounded-xl border bg-card p-4 transition-colors outline-none hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between">
        <span className={cn("flex size-9 items-center justify-center rounded-lg", TONES[tone])}>
          <Icon className="size-4" />
        </span>
        <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </Link>
  );
}
