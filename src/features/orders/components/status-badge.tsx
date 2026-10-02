import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "../schemas";
import { STATUS_TONE, type StatusTone } from "../status";

const TONE_CLASSES: Record<StatusTone, { badge: string; dot: string }> = {
  neutral: { badge: "bg-muted text-muted-foreground", dot: "bg-muted-foreground/60" },
  info: { badge: "bg-sky-500/10 text-sky-700 dark:text-sky-300", dot: "bg-sky-500" },
  attention: { badge: "bg-amber-500/15 text-amber-800 dark:text-amber-300", dot: "bg-amber-500" },
  success: {
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  danger: { badge: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
};

/** Colored pill with the localized name of an order status. The color is never the only signal: the label is always shown. */
export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const t = useTranslations("orders.status");
  const tone = TONE_CLASSES[STATUS_TONE[status]];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tone.badge,
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", tone.dot)} />
      {t(status)}
    </span>
  );
}

/** Background color class of a status' dot, for charts and legends that must match the badges. */
export function statusDotClass(status: OrderStatus): string {
  return TONE_CLASSES[STATUS_TONE[status]].dot;
}
