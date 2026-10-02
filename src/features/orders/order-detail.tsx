import { ArrowLeft, GitBranch } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ApiError } from "@/lib/api/problem";
import { requireUser } from "@/features/auth/server";
import { ordersApi } from "./api";
import { orderCapabilities } from "./capabilities";
import { AttentionBanner } from "./components/attention-banner";
import { AuditTimeline } from "./components/audit-timeline";
import { CorrectCodeForm } from "./components/correct-code-form";
import { ErpPanel } from "./components/erp-panel";
import { LinesTable } from "./components/lines-table";
import { LiveUpdates } from "./components/live-updates";
import { OrderActions } from "./components/order-actions";
import { OrderDetails } from "./components/order-details";
import { OrderProgress } from "./components/order-progress";
import { OrderTabs } from "./components/order-tabs";
import { OrderTotals } from "./components/order-totals";
import { RedistributionEditor } from "./components/redistribution-editor";
import { StatusBadge } from "./components/status-badge";
import { getOrder } from "./queries";
import type { Order } from "./schemas";
import { availableTabs, pickTab, type TabName } from "./tabs";
import { ButtonLink } from "@/components/ui/button-link";

type Props = { id: string; tab: string | string[] | undefined };

/** Loads an order, treating "not found" as a 404 page and letting every other failure reach the error boundary. */
async function loadOrder(id: string): Promise<Order> {
  try {
    return await getOrder(id);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }
}

export async function OrderDetail({ id, tab: requestedTab }: Props) {
  const [user, order, t] = await Promise.all([
    requireUser(),
    loadOrder(id),
    getTranslations("orders.detail"),
  ]);
  const caps = orderCapabilities(user.role, order.status);
  const tabs = availableTabs(user.role, order.status);
  const tab = pickTab(requestedTab, tabs);

  const { actions } = await ordersApi.actions(id);
  const difference = actions.includes("ConfirmBySupplier") ? await ordersApi.difference(id) : null;

  return (
    <div className="space-y-6">
      <ButtonLink variant="ghost" size="sm" className="-ml-2" href="/orders">
        <ArrowLeft className="size-4" />
        {t("backToList")}
      </ButtonLink>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{order.header.code}</h1>
            <StatusBadge status={order.status} className="text-sm" />
            <LiveUpdates orderId={order.id} />
          </div>
          {order.parentOrderId && (
            <Link
              href={`/orders/${order.parentOrderId}`}
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <GitBranch className="size-3.5" />
              {t("viewParent")}
            </Link>
          )}
        </div>
        <OrderActions
          orderId={order.id}
          role={user.role}
          status={order.status}
          actions={actions}
          caps={caps}
          difference={difference}
        />
      </header>

      <OrderProgress status={order.status} />
      <AttentionBanner status={order.status} danger={order.status === "ErpSubmissionFailed"} />
      <OrderTotals order={order} />
      <OrderDetails order={order} />

      <div className="space-y-5">
        <OrderTabs orderId={order.id} available={tabs} active={tab} />
        <TabContent id={order.id} order={order} tab={tab} />
      </div>
    </div>
  );
}

async function TabContent({ id, order, tab }: { id: string; order: Order; tab: TabName }) {
  const user = await requireUser();
  const caps = orderCapabilities(user.role, order.status);

  if (tab === "lines") return <LinesTable order={order} caps={caps} />;
  if (tab === "history") return <AuditTimeline entries={await ordersApi.audit(id)} />;
  if (tab === "redistribution") {
    return (
      <RedistributionEditor
        orderId={id}
        view={await ordersApi.redistribution(id)}
        editable={caps.redistribute}
      />
    );
  }
  const submission = await ordersApi.erp(id);
  return (
    <div className="space-y-5">
      <ErpPanel orderId={id} submission={submission} canPrint={caps.viewErpDocuments} />
      {caps.correctProductCodes && (
        <CorrectCodeForm orderId={id} productCodes={order.lines.map((line) => line.productCode)} />
      )}
    </div>
  );
}
