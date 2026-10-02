import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/formatters";
import type { Order } from "../schemas";

export function OrderTotals({ order }: { order: Order }) {
  const t = useTranslations("orders.detail.totals");
  const f = useFormatters();
  const totals = order.totals;
  if (!totals) return null;

  const short = totals.confirmedQuantity < totals.requestedQuantity;
  const cards: { label: string; value: string; tone?: string }[] = [
    { label: t("requested"), value: f.quantity(totals.requestedQuantity) },
    {
      label: t("confirmed"),
      value: f.quantity(totals.confirmedQuantity),
      tone: short ? "text-amber-700 dark:text-amber-300" : undefined,
    },
    { label: t("allocated"), value: f.quantity(totals.allocatedQuantity) },
  ];
  // Total cost is withheld (null) from roles that must not see it.
  if (totals.totalCost !== null)
    cards.push({ label: t("cost"), value: f.currency(totals.totalCost) });

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border bg-card px-4 py-3">
          <dt className="text-xs text-muted-foreground">{card.label}</dt>
          <dd className={`mt-1 text-xl font-semibold tabular-nums ${card.tone ?? ""}`}>
            {card.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
