import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import type { OrderStatus } from "../schemas";

const ATTENTION_STATUSES = [
  "SupplierConfirmed",
  "ReadyForRedistribution",
  "ProductionPostponed",
  "ErpSubmissionFailed",
  "RedistributionConfirmed",
  "LogisticsPending",
] as const satisfies readonly OrderStatus[];

type AttentionStatus = (typeof ATTENTION_STATUSES)[number];
const needsAttention = (status: OrderStatus): status is AttentionStatus =>
  (ATTENTION_STATUSES as readonly string[]).includes(status);

/** One-line hint about what the order is waiting for, shown only in statuses that need someone to act. */
export function AttentionBanner({ status, danger }: { status: OrderStatus; danger?: boolean }) {
  const t = useTranslations("orders.detail.attention");
  if (!needsAttention(status)) return null;

  return (
    <div
      role="note"
      className={
        danger
          ? "flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
          : "flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm"
      }
    >
      <Info className="mt-0.5 size-4 shrink-0" />
      {t(status)}
    </div>
  );
}
