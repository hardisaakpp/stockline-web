import { Check, CircleSlash } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "../schemas";
import { isOffPath, MAIN_PATH, progressIndex } from "../status";

type MainStep =
  | "Draft"
  | "Submitted"
  | "UnderReview"
  | "SupplierConfirmed"
  | "RedistributionConfirmed"
  | "Sent"
  | "Completed";

/** Where the order is on its normal path, or a notice when it left the path (rejected, cancelled…). */
export function OrderProgress({ status }: { status: OrderStatus }) {
  const t = useTranslations("orders");
  const current = progressIndex(status);

  if (current === null || isOffPath(status)) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
        <CircleSlash className="size-4 shrink-0" />
        {t("detail.progress.offPath", { status: t(`status.${status}`) })}
      </div>
    );
  }

  return (
    <ol aria-label={t("detail.progress.label")} className="flex items-center overflow-x-auto pb-1">
      {MAIN_PATH.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} aria-current={active ? "step" : undefined} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-primary/10 text-primary ring-4 ring-primary/15",
                  !done && !active && "text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-sm whitespace-nowrap",
                  active ? "font-medium" : "text-muted-foreground",
                )}
              >
                {t(`detail.progress.steps.${step as MainStep}`)}
                {active && <span className="sr-only"> ({t("detail.progress.current")})</span>}
              </span>
            </div>
            {index < MAIN_PATH.length - 1 && (
              <span
                aria-hidden="true"
                className={cn("mx-3 h-px w-8 shrink-0 sm:w-12", done ? "bg-primary" : "bg-border")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
