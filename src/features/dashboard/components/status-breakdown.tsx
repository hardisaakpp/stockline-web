import { useTranslations } from "next-intl";
import Link from "next/link";
import { StatusBadge, statusDotClass } from "@/features/orders";
import { cn } from "@/lib/utils";
import { shares } from "../chart-math";
import type { DashboardSummary } from "../schemas";

/** One stacked bar plus a legend; every legend row leads to the list filtered by that status. */
export function StatusBreakdown({ byStatus }: { byStatus: DashboardSummary["byStatus"] }) {
  const t = useTranslations("dashboard.status");
  const total = byStatus.reduce((sum, row) => sum + row.count, 0);
  const percents = shares(byStatus.map((row) => row.count));

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-medium">{t("title")}</h2>
      {total === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <>
          <div
            role="img"
            aria-label={t("chartLabel")}
            className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted"
          >
            {byStatus.map((row, index) => (
              <span
                key={row.status}
                style={{ width: `${percents[index]}%` }}
                className={cn("h-full", statusDotClass(row.status))}
              />
            ))}
          </div>
          <ul className="mt-4 space-y-1">
            {byStatus.map((row, index) => (
              <li key={row.status}>
                <Link
                  href={`/orders?status=${row.status}`}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-muted"
                >
                  <StatusBadge status={row.status} />
                  <span className="text-sm tabular-nums">
                    <span className="font-medium">{row.count}</span>
                    <span className="ml-2 text-muted-foreground">{percents[index]}%</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
