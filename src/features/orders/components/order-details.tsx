import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/formatters";
import type { Order } from "../schemas";

export function OrderDetails({ order }: { order: Order }) {
  const t = useTranslations("orders.detail");
  const f = useFormatters();
  const { header } = order;
  const items = [
    { label: t("supplier"), value: header.supplierName },
    { label: t("orderDate"), value: f.date(header.orderDate) },
    {
      label: t("delivery"),
      value: header.deliveryDate ? f.date(header.deliveryDate) : (header.deliveryNote ?? "—"),
    },
    { label: t("paymentTerms"), value: header.paymentTerms ?? "—" },
    { label: t("buyer"), value: header.buyerName ?? "—" },
    { label: t("updated"), value: f.dateTime(order.modifiedAt ?? order.createdAt) },
  ];

  return (
    <div className="rounded-xl border bg-card p-4">
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="mt-0.5 text-sm font-medium">{item.value}</dd>
          </div>
        ))}
      </dl>
      {header.message && (
        <p className="mt-4 border-t pt-3 text-sm">
          <span className="text-xs text-muted-foreground">{t("message")}: </span>
          {header.message}
        </p>
      )}
    </div>
  );
}
