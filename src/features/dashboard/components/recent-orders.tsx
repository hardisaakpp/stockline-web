import { useTranslations } from "next-intl";
import Link from "next/link";
import { StatusBadge } from "@/features/orders";
import { useFormatters } from "@/i18n/formatters";
import type { DashboardSummary } from "../schemas";

export function RecentOrders({ orders }: { orders: DashboardSummary["recent"] }) {
  const t = useTranslations("dashboard.recent");
  const f = useFormatters();

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{t("title")}</h2>
        <Link href="/orders" className="text-sm text-primary hover:underline">
          {t("viewAll")}
        </Link>
      </div>
      {orders.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="mt-3 divide-y">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-muted/40"
              >
                <span>
                  <span className="block font-medium text-primary">{order.code}</span>
                  <span className="block text-xs text-muted-foreground">
                    {order.supplierName} · {f.date(order.orderDate)}
                  </span>
                </span>
                <StatusBadge status={order.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
