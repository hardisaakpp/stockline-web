import { AlertTriangle, ClipboardList, Hourglass, PackageOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/feedback/page-header";
import { getServerFormatters } from "@/i18n/formatters";
import { dashboardApi } from "./api";
import { KpiCard } from "./components/kpi-card";
import { RecentOrders } from "./components/recent-orders";
import { StatusBreakdown } from "./components/status-breakdown";
import { VolumeChart } from "./components/volume-chart";

/** The signed-in user's overview: what needs attention and how orders are flowing. */
export async function DashboardView({ firstName }: { firstName: string }) {
  const [t, f, summary] = await Promise.all([
    getTranslations("dashboard"),
    getServerFormatters(),
    dashboardApi.summary(),
  ]);
  const view = t("kpis.viewList");

  return (
    <div className="space-y-6">
      <PageHeader title={t("greeting", { name: firstName })} description={t("description")} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("kpis.awaiting")}
          value={f.quantity(summary.awaitingMyAction)}
          hint={t("kpis.awaitingHint")}
          icon={Hourglass}
          href="/orders?pending=1"
          linkLabel={view}
          tone="attention"
        />
        <KpiCard
          label={t("kpis.open")}
          value={f.quantity(summary.openOrders)}
          hint={t("kpis.openHint")}
          icon={PackageOpen}
          href="/orders"
          linkLabel={view}
        />
        <KpiCard
          label={t("kpis.total")}
          value={f.quantity(summary.totalOrders)}
          hint={t("kpis.totalHint")}
          icon={ClipboardList}
          href="/orders"
          linkLabel={view}
        />
        <KpiCard
          label={t("kpis.failures")}
          value={f.quantity(summary.erpFailures)}
          hint={t("kpis.failuresHint")}
          icon={AlertTriangle}
          href="/orders?status=ErpSubmissionFailed"
          linkLabel={view}
          tone={summary.erpFailures > 0 ? "danger" : "default"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <VolumeChart days={summary.last30Days} />
        </div>
        <StatusBreakdown byStatus={summary.byStatus} />
      </div>

      <RecentOrders orders={summary.recent} />
    </div>
  );
}
